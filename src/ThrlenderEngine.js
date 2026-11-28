import * as THREE from 'three';
import { createConfig, getConfigCallbacks } from './utils/config';
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

export class ThrlenderEngine extends THREE.EventDispatcher {
  config = createConfig();
  fileEvents = new AbortController();
  readers = new Set();
  objectUrls = new Set();
  /** @type {THREE.Object3D | null} */
  selectedObject = null;

  /** @param {HTMLElement} host */
  init(host) {
    this.initScene();
    this.initCamera();
    this.initRenderer();
    this.initControls();
    this.initGrid();
    this.initDefaultSkylight();
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

    this.controls?.dispose();
    this.transformControls?.removeEventListener('dragging-changed', this.syncCameraControls);
    this.transformControls?.removeEventListener('objectChange', this.updateSelectedHelper);
    this.transformControls?.detach();
    this.transformControls?.removeFromParent();
    this.transformControls?.dispose();
    if (this.scene) disposeScene(this.scene);
    this.renderer?.dispose();
    this.renderer?.forceContextLoss();
    this.renderer?.domElement.remove();
  }

  initScene() {
    this.scene = new THREE.Scene();
  }
  initCamera() {
    this.camera = new THREE.PerspectiveCamera(60, 1, 0.1, 1000);
    this.camera.position.set(0, 5, 10);
    this.camera.name = 'ThrlenderCamera';
    this.scene.add(this.camera);
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
  initDefaultSkylight() {
    this.skyLight = new THREE.HemisphereLight(
      this.config.LIGHTS_SKY_LIGHT_COLOR,
      this.config.LIGHTS_SKY_LIGHT_GROUND,
      this.config.LIGHTS_SKY_LIGHT_INTENSITY
    );
    this.skyLight.position.set(0, 20, 0);
    this.skyLight.name = 'ThrlenderSkyLight';
    this.scene.add(this.skyLight);
    this.addLightHelper(this.skyLight);
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
    helper.visible = this.config.LIGHTS_LIGHT_HELPERS_VISIBLE;
    this.scene.add(helper);
  }

  updateSelectedHelper = () => {
    const object = this.selectedObject;
    if (!object?.isLight) return;
    object.updateMatrixWorld();
    for (const helper of this.scene.children) {
      if (helper.light === object) helper.update();
    }
  };

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
    this.transformControls.addEventListener('objectChange', this.updateSelectedHelper);
    // DEFAULT SNAP TO GRID
    if (this.config.SNAP_TO_GRID) {
      this.transformControls.setTranslationSnap(1);
      this.transformControls.setRotationSnap((15 * Math.PI) / 180);
      this.transformControls.setScaleSnap(0.25);
    }
    this.scene.add(this.transformControls);
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
    // CLEAN SCENE FROM AXES HELPER, GRID HELPER, TRANSFORM CONTROLS:
    const editorObjects = [this.axesHelper, this.gridHelper, this.transformControls];
    this.scene.remove(...editorObjects);

    let jsonScene;
    try {
      jsonScene = JSON.stringify(this.scene.toJSON());
    } finally {
      this.scene.add(...editorObjects);
    }

    const blob = new Blob([jsonScene], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    this.objectUrls.add(url);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'scene.thrl';
    link.click();
    // Give the browser a task to consume the download URL.
    setTimeout(() => this.releaseUrl(url), 0);
  }

  releaseUrl(url) {
    if (this.objectUrls.delete(url)) URL.revokeObjectURL(url);
  }

  readLocalFile(extension, read, onLoad) {
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
      read(reader, file);
    }, { once: true, signal });
    input.click();
  }

  load() {
    this.readLocalFile('.thrl', (reader, file) => reader.readAsText(file), (contents) => {
      const scene = new THREE.ObjectLoader().parse(JSON.parse(contents));
      this.setSelectedObject(null);
      this.transformControls.removeFromParent();
      disposeScene(this.scene);

      this.scene = scene;
      const lights = scene.children.filter((child) => child.isLight);
      const helperNames = new Set(lights.map((light) => light.name + 'Helper'));
      // Older THRL files can contain serialized helper placeholders.
      for (const child of [...scene.children]) {
        if (child.type === 'Object3D' && helperNames.has(child.name)) child.removeFromParent();
      }
      for (const light of lights) this.addLightHelper(light);
      this.initGrid();
      this.initAxesHelper();
      scene.add(this.transformControls);
      const skyLight = scene.getObjectByName('ThrlenderSkyLight');
      this.skyLight = skyLight instanceof THREE.HemisphereLight ? skyLight : undefined;
      if (this.skyLight) {
        this.config.LIGHTS_SKY_LIGHT_INTENSITY = this.skyLight.intensity;
        this.config.LIGHTS_SKY_LIGHT_COLOR = '#' + this.skyLight.color.getHexString();
        this.config.LIGHTS_SKY_LIGHT_GROUND = '#' + this.skyLight.groundColor.getHexString();
      }
      getConfigCallbacks(this).WIREFRAME_MODE();
      this.dispatchEvent({ type: 'scene-loaded' });
    });
  }

  /** @param {THREE.Object3D} object */
  addObject(object) {
    this.scene.add(object);
    if (object instanceof THREE.Light) this.addLightHelper(object);
    this.setSelectedObject(object);
  }

  setSelectedObject(object) {
    const selection = object?.light ?? object ?? null;
    if (selection === this.selectedObject) return;
    this.selectedObject = selection;
    if (selection) this.transformControls.attach(selection);
    else this.transformControls.detach();
    this.dispatchEvent({ type: 'selection-changed' });
  }

  focusSelection() {
    if (this.selectedObject) this.controls.target.copy(this.selectedObject.position);
  }

  removeSelectedObject() {
    const object = this.selectedObject;
    if (!object) return;

    this.setSelectedObject(null);
    object.removeFromParent();
    for (const helper of [...this.scene.children]) {
      if (helper.light !== object) continue;
      helper.removeFromParent();
      helper.dispose();
    }
    if (object === this.skyLight) this.skyLight = undefined;
    disposeScene(object, this.scene);
  }

  loadFbx() {
    this.readLocalFile('.fbx', (reader, file) => reader.readAsArrayBuffer(file), (contents) => {
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
        object.name = 'FBX_Object';
        this.scene.add(object);
        getConfigCallbacks(this).WIREFRAME_MODE();
      } catch (error) {
        releaseTextures();
        throw error;
      }
    });
  }
}
