import * as THREE from 'three';
import { createViewPreferences, createTransformSettings, getConfigCallbacks } from './utils/config';
import { SceneDocument } from './SceneDocument';
import { VertexEditSession } from './VertexEditSession.js';
import { supportsVertexEditing } from './VertexTopology.mjs';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { TransformControls } from 'three/addons/controls/TransformControls.js';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';

// A scene can share geometries, materials and textures across several meshes.
function disposeScene(scene, retainedScene) {
  const retained = retainedScene ? collectResources(retainedScene) : new Set();
  for (const resource of collectResources(scene)) {
    if (!retained.has(resource)) resource?.dispose();
  }
  scene.clear();
}

function collectResources(scene) {
  const resources = new Set();
  resources.add(scene.background?.isTexture ? scene.background : null);
  resources.add(scene.environment);
  scene.traverse((object) => {
    resources.add(object.geometry);
    resources.add(object.shadow);
    resources.add(object.skeleton);
    for (const material of [].concat(object.material ?? [])) {
      resources.add(material);
      for (const value of Object.values(material)) {
        if (value?.isTexture) resources.add(value);
      }
    }
  });
  return resources;
}

function copySkin(source, copy) {
  const { bones, boneInverses } = source.skeleton;
  const boneCopies = new Map(bones.filter(Boolean).map((bone) => [bone, bone.clone(false)]));
  source.updateWorldMatrix(true, false);
  const worldToMesh = source.bindMode === THREE.DetachedBindMode
    ? source.bindMatrixInverse
    : source.matrixWorld.clone().invert();

  for (const [bone, boneCopy] of boneCopies) {
    const parentCopy = boneCopies.get(bone.parent);
    if (parentCopy) {
      parentCopy.add(boneCopy);
    } else {
      bone.updateWorldMatrix(true, false);
      boneCopy.matrix.multiplyMatrices(worldToMesh, bone.matrixWorld);
      boneCopy.matrix.decompose(boneCopy.position, boneCopy.quaternion, boneCopy.scale);
      copy.add(boneCopy);
    }
  }

  copy.bindMode = THREE.AttachedBindMode;
  copy.bind(new THREE.Skeleton(
    bones.map((bone) => boneCopies.get(bone)),
    boneInverses.map((matrix) => matrix.clone()),
  ), source.bindMatrix);
}

export class ThrlenderEngine extends THREE.EventDispatcher {
  config = createViewPreferences();
  transformSettings = createTransformSettings();
  activeDocument = SceneDocument.create();

  get scene() {
    return this.activeDocument.scene;
  }

  get skyLight() {
    return this.activeDocument.skyLight;
  }
  fileEvents = new AbortController();
  readers = new Set();
  /** @type {Set<THREE.Object3D & { light: THREE.Light }>} */
  lightHelpers = new Set();
  objectUrls = new Set();
  /** @type {THREE.Object3D | null} */
  selectedObject = null;
  /** @type {VertexEditSession | null} */
  vertexEdit = null;

  /** @param {HTMLElement} host */
  init(host) {
    this.initCamera();
    this.initRenderer();
    this.initControls();
    this.initGrid();
    if (this.skyLight) this.addLightHelper(this.skyLight);
    this.initTransformControls();
    this.initAxesHelper();
    host.appendChild(this.renderer.domElement);
  }

  dispose() {
    this.fileEvents.abort();
    for (const reader of this.readers) reader.abort();
    this.readers.clear();
    for (const url of this.objectUrls) URL.revokeObjectURL(url);
    this.objectUrls.clear();

    this.stopVertexEditing();
    this.controls?.dispose();
    this.transformControls?.removeEventListener('dragging-changed', this.syncCameraControls);
    this.transformControls?.removeEventListener('objectChange', this.onTransformChange);
    this.transformControls?.detach();
    this.transformControls?.removeFromParent();
    this.transformControls?.dispose();
    if (this.scene) disposeScene(this.scene);
    this.renderer?.dispose();
    this.renderer?.forceContextLoss();
    this.renderer?.domElement.remove();
  }

  initCamera() {
    this.camera = new THREE.PerspectiveCamera(60, 1, 0.1, 1000);
    this.camera.position.set(0, 5, 10);
    this.camera.name = 'ThrlenderCamera';
  }

  initRenderer() {
    this.renderer = new THREE.WebGLRenderer({ alpha: true });
    this.renderer.domElement.tabIndex = 0;
    this.renderer.domElement.setAttribute('aria-label', '3D viewport');
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
  }
  initControls() {
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = this.config.ENABLE_DAMPING;
    this.controls.dampingFactor = 0.05;
    this.controls.screenSpacePanning = false;
  }
  /** @param {THREE.Light} light */
  addLightHelper(light) {
    let helper;
    if (light instanceof THREE.SpotLight) helper = new THREE.SpotLightHelper(light);
    if (light instanceof THREE.DirectionalLight) helper = new THREE.DirectionalLightHelper(light);
    if (light instanceof THREE.PointLight || light instanceof THREE.HemisphereLight) {
      helper = new THREE.PointLightHelper(light, 1);
    }
    if (!helper) return;
    helper.name = light.name + 'Helper';
    helper.visible = this.config.LIGHTS_LIGHT_HELPERS_VISIBLE && this.isVisible(light);
    this.lightHelpers.add(helper);
    this.scene.add(helper);
  }

  markDocumentChanged() {
    this.activeDocument.revision++;
    this.dispatchEvent({ type: 'document-changed' });
  }

  editSelection = () => {
    this.updateLightHelper(this.selectedObject);
    this.markDocumentChanged();
  };

  onTransformChange = () => {
    if (!this.vertexEdit) {
      this.editSelection();
      return;
    }

    const mesh = this.vertexEdit.mesh;
    if (this.vertexEdit.translateSelection((geometry) => {
      const previous = mesh.geometry;
      mesh.geometry = geometry;
      if (!collectResources(this.scene).has(previous)) previous.dispose();
    })) this.markDocumentChanged();
  };

  get editModeUnavailableReason() {
    const object = this.selectedObject;
    if (!object) return 'Select a cube or plane to edit vertices.';
    if (!(object instanceof THREE.Mesh)) return 'The selected item is not a mesh. Select a cube or plane.';
    if (!supportsVertexEditing(object)) return 'Vertex editing is available for cubes and planes.';
    if (!this.isVisible(object)) return 'Show the selected mesh to edit its vertices.';
    object.updateWorldMatrix(true, false);
    if (!object.matrixWorld.determinant()) return 'The selected mesh needs a nonzero scale on every axis.';
    return '';
  }

  setEditMode(enabled) {
    if (enabled === !!this.vertexEdit || (enabled && this.editModeUnavailableReason)) return;
    if (enabled) {
      this.transformControls.dragging = false;
      this.transformControls.axis = null;
      this.vertexEdit = new VertexEditSession(this.selectedObject, this.scene);
    } else {
      this.stopVertexEditing();
    }
    this.syncTransformMode();
    this.syncSelectionGizmo();
    this.dispatchEvent({ type: 'selection-changed' });
  }

  stopVertexEditing() {
    if (!this.vertexEdit) return;
    this.transformControls.dragging = false;
    this.transformControls.axis = null;
    this.transformControls.detach();
    this.vertexEdit.dispose();
    this.vertexEdit = null;
  }

  syncTransformMode() {
    this.transformControls.setMode(this.vertexEdit ? 'translate' : this.transformSettings.TRANSFORM_CONTROLS_MODE);
  }

  /** @param {THREE.Object3D | null} object */
  updateLightHelper(object) {
    if (!object) return;
    object.updateWorldMatrix(true, true);
    object.traverse((child) => {
      if (!child.isLight) return;
      for (const helper of this.lightHelpers) {
        if (helper.light === child) helper.update();
      }
    });
  }

  /** @param {THREE.Object3D} parent */
  sceneItems(parent = this.scene) {
    return parent.children.filter((object) =>
      !object.isCamera && object !== this.gridHelper && object !== this.axesHelper &&
      object !== this.transformControls && object !== this.vertexEdit?.points &&
      object !== this.vertexEdit?.pivot && !this.lightHelpers.has(object)
    );
  }

  /** @param {THREE.Object3D} object */
  isVisible(object) {
    for (let ancestor = object; ancestor; ancestor = ancestor.parent) {
      if (!ancestor.visible) return false;
    }
    return true;
  }

  syncLightHelpers() {
    for (const helper of this.lightHelpers) {
      helper.visible = this.config.LIGHTS_LIGHT_HELPERS_VISIBLE && this.isVisible(helper.light);
    }
  }

  /** @param {THREE.Object3D} object @param {boolean} visible */
  setItemVisibility(object, visible) {
    object.visible = visible;
    this.syncLightHelpers();
    if (this.vertexEdit && !this.isVisible(this.vertexEdit.mesh)) this.setEditMode(false);
    this.syncSelectionGizmo();
    this.markDocumentChanged();
  }

  syncSelectionGizmo() {
    const target = this.vertexEdit
      ? (this.vertexEdit.selected.size ? this.vertexEdit.pivot : null)
      : this.selectedObject;
    if (target && this.isVisible(target)) {
      this.transformControls.attach(target);
    } else {
      this.transformControls.detach();
    }
  }

  initGrid() {
    this.gridHelper = new THREE.GridHelper(100, 100, this.config.GRID_COLOR, this.config.GRID_COLOR);
    this.gridHelper.visible = this.config.GRID_VISIBLE;
    this.gridHelper.name = 'ThrlenderGridHelper';
    this.scene.add(this.gridHelper);
  }

  initTransformControls() {
    this.transformControls = new TransformControls(this.camera, this.renderer.domElement);
    this.transformControls.name = 'ThrlenderTransformControls';
    this.transformControls.addEventListener('dragging-changed', this.syncCameraControls);
    this.transformControls.addEventListener('objectChange', this.onTransformChange);
    this.resetTransformSettings();
    this.scene.add(this.transformControls);
  }

  resetTransformSettings() {
    Object.assign(this.transformSettings, createTransformSettings());
    const callbacks = getConfigCallbacks(this);
    callbacks.TRANSFORM_CONTROLS_ENABLED();
    callbacks.TRANSFORM_CONTROLS_MODE();
    callbacks.SNAP_TO_GRID();
  }

  initAxesHelper() {
    this.axesHelper = new THREE.AxesHelper(5);
    this.axesHelper.visible = this.config.AXES_HELPER;
    this.axesHelper.name = 'ThrlenderAxesHelper';
    this.scene.add(this.axesHelper);
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }

  update() {
    this.controls.update();
    this.vertexEdit?.syncMatrix();
  }

  syncCameraControls = ({ value: dragging }) => {
    this.controls.enabled = !dragging;
  };

  /**
   * @param {number} width
   * @param {number} height
   */
  resize(width, height) {
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
  }

  // SAVE AND LOAD METHODS:

  save() {
    const activeDocument = this.activeDocument;
    const { scene, revision } = activeDocument;
    const children = scene.children;
    let jsonScene;
    try {
      scene.children = children.filter((child) =>
        child !== this.axesHelper && child !== this.gridHelper && child !== this.transformControls &&
        child !== this.vertexEdit?.points && child !== this.vertexEdit?.pivot && !this.lightHelpers.has(child));
      const data = scene.toJSON();
      // Keep the camera entry used by older THRL exports.
      data.object.children = [...(data.object.children ?? []), this.camera.toJSON().object];
      for (const material of data.materials ?? []) delete material.wireframe;
      jsonScene = JSON.stringify(data);
    } finally {
      scene.children = children;
    }

    const blob = new Blob([jsonScene], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    this.objectUrls.add(url);
    try {
      const link = document.createElement('a');
      link.href = url;
      link.download = 'scene.thrl';
      link.click();
    } finally {
      // Give the browser a task to consume the download URL.
      setTimeout(() => this.releaseUrl(url), 0);
    }
    activeDocument.savedRevision = revision;
    this.dispatchEvent({ type: 'document-changed' });
  }

  releaseUrl(url) {
    if (this.objectUrls.delete(url)) URL.revokeObjectURL(url);
  }

  readLocalFile(extension, read, onLoad, onError = () => {}) {
    const { signal } = this.fileEvents;
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = extension;
    input.addEventListener('change', () => {
      const file = input.files[0];
      if (!file) return;

      const reader = new FileReader();
      this.readers.add(reader);
      reader.addEventListener('loadend', () => this.readers.delete(reader), { once: true });
      reader.addEventListener('load', () => onLoad(reader.result), { once: true, signal });
      reader.addEventListener('error', onError, { once: true, signal });
      read(reader, file);
    }, { once: true, signal });
    input.click();
  }

  confirmReplacement() {
    return !this.activeDocument.dirty ||
      window.confirm('The current scene has unsaved changes. Discard them?');
  }

  newScene() {
    if (this.confirmReplacement()) this.replaceDocument(SceneDocument.create());
  }

  load() {
    if (!this.confirmReplacement()) return;
    const original = this.activeDocument;
    const revision = original.revision;
    this.readLocalFile('.thrl', (reader, file) => reader.readAsText(file), async (contents) => {
      if (this.activeDocument !== original) return;
      let scene;
      let next;
      try {
        const data = JSON.parse(contents);
        const root = data?.object;
        if (root?.type !== 'Scene' || typeof root.uuid !== 'string' ||
            (root.children !== undefined && !Array.isArray(root.children))) {
          throw new Error('Expected a Three.js scene');
        }
        // Older THRL files can include editor light helpers.
        const helperTypes = new Set(['PointLightHelper', 'SpotLightHelper', 'DirectionalLightHelper']);
        if (root.children) root.children = root.children.filter((child) => !helperTypes.has(child.type));
        scene = await new THREE.ObjectLoader().parseAsync(data);
        next = new SceneDocument(scene);
      } catch {
        if (scene) disposeScene(scene);
        if (!this.fileEvents.signal.aborted && this.activeDocument === original) {
          window.alert('This file could not be opened as a THRL scene.');
        }
        return;
      }
      if (this.fileEvents.signal.aborted || this.activeDocument !== original ||
          (original.revision !== revision && !this.confirmReplacement())) {
        disposeScene(scene);
        return;
      }
      this.replaceDocument(next);
    }, () => {
      if (this.activeDocument === original) window.alert('This THRL file could not be read.');
    });
  }

  /** @param {SceneDocument} next */
  replaceDocument(next) {
    const previous = this.scene;
    const selection = this.selectedObject;
    this.stopVertexEditing();
    this.selectedObject = null;
    this.transformControls.detach();
    this.transformControls.dragging = false;
    this.resetTransformSettings();

    // Clear pending orbit damping before restoring the starting camera pose.
    this.controls.enableDamping = false;
    this.controls.update();
    this.controls.reset();
    this.controls.enableDamping = this.config.ENABLE_DAMPING;

    const scene = next.scene;
    const lights = [];
    scene.traverse((child) => {
      if (child.isLight) lights.push(child);
    });
    const helperNames = new Set(lights.map((light) => light.name + 'Helper'));
    for (const child of [...scene.children]) {
      if ((child.type === 'Object3D' && helperNames.has(child.name)) ||
          (child.isCamera && child.name === this.camera.name)) child.removeFromParent();
    }

    this.lightHelpers.clear();
    this.activeDocument = next;
    scene.add(this.gridHelper, this.axesHelper, this.transformControls);
    for (const light of lights) this.addLightHelper(light);
    getConfigCallbacks(this).WIREFRAME_MODE();
    disposeScene(previous, scene);
    if (selection) this.dispatchEvent({ type: 'selection-changed' });
    this.dispatchEvent({ type: 'document-replaced' });
    this.dispatchEvent({ type: 'document-changed' });
  }

  /** @param {THREE.Object3D} object */
  addObject(object) {
    this.scene.add(object);
    if (object instanceof THREE.Light) this.addLightHelper(object);
    getConfigCallbacks(this).WIREFRAME_MODE();
    this.setSelectedObject(object);
    this.markDocumentChanged();
  }

  setSelectedObject(object) {
    const selection = object?.light ?? object ?? null;
    if (selection === this.selectedObject) return;
    this.stopVertexEditing();
    this.selectedObject = selection;
    this.syncTransformMode();
    this.syncSelectionGizmo();
    this.dispatchEvent({ type: 'selection-changed' });
  }

  focusSelection() {
    const object = this.selectedObject;
    if (!object) return;

    // Clear pending orbit motion before setting the new pose.
    const damping = this.controls.enableDamping;
    this.controls.enableDamping = false;
    this.controls.update();

    const direction = this.camera.position.clone().sub(this.controls.target).normalize();
    const bounds = new THREE.Box3().setFromObject(object);
    const sphere = bounds.getBoundingSphere(new THREE.Sphere());
    const vertical = THREE.MathUtils.degToRad(this.camera.getEffectiveFOV() / 2);
    const horizontal = Math.atan(Math.tan(vertical) * this.camera.aspect);
    const radius = Math.max(0.5, sphere.radius);
    const distance = (1.2 * radius) / Math.sin(Math.min(vertical, horizontal));
    if (bounds.isEmpty()) object.getWorldPosition(this.controls.target);
    else this.controls.target.copy(sphere.center);

    this.camera.position.copy(this.controls.target).addScaledVector(direction, distance);
    this.controls.update();
    this.controls.enableDamping = damping;
  }

  get canDuplicateSelection() {
    return this.selectedObject instanceof THREE.Mesh && !!this.selectedObject.parent;
  }

  duplicateSelection() {
    const source = this.selectedObject;
    if (!(source instanceof THREE.Mesh) || !source.parent) return;

    const copy = source.clone(false);
    copy.name = source.name ? source.name + ' Copy' : 'Mesh Copy';
    copy.geometry = source.geometry.clone();
    copy.material = Array.isArray(source.material)
      ? source.material.map((material) => material.clone())
      : source.material.clone();
    if (source instanceof THREE.SkinnedMesh && source.skeleton) copySkin(source, copy);
    source.parent.add(copy);
    this.setSelectedObject(copy);
    this.markDocumentChanged();
  }

  removeSelectedObject() {
    const object = this.selectedObject;
    if (!object) return;

    this.setSelectedObject(null);
    const removed = new Set();
    object.traverse((child) => removed.add(child));
    object.removeFromParent();
    for (const helper of this.lightHelpers) {
      if (!removed.has(helper.light)) continue;
      this.lightHelpers.delete(helper);
      helper.removeFromParent();
      helper.dispose();
    }
    if (removed.has(this.skyLight)) this.activeDocument.skyLight = undefined;
    disposeScene(object, this.scene);
    this.markDocumentChanged();
  }

  loadFbx() {
    const original = this.activeDocument;
    this.readLocalFile('.fbx', (reader, file) => reader.readAsArrayBuffer(file), (contents) => {
      if (this.activeDocument !== original) return;
      const manager = new THREE.LoadingManager();
      const textureUrls = new Set();
      manager.setURLModifier((url) => {
        if (url.startsWith('blob:')) {
          textureUrls.add(url);
          this.objectUrls.add(url);
        }
        return url;
      });
      const releaseTextures = () => {
        for (const url of textureUrls) this.releaseUrl(url);
        textureUrls.clear();
      };
      manager.onLoad = releaseTextures;

      try {
        const object = new FBXLoader(manager).parse(contents, '');
        object.name ||= 'FBX_Object';
        this.scene.add(object);
        object.traverse((child) => {
          if (child.isLight) this.addLightHelper(child);
        });
        getConfigCallbacks(this).WIREFRAME_MODE();
        this.markDocumentChanged();
      } catch (error) {
        releaseTextures();
        throw error;
      }
    });
  }
}
