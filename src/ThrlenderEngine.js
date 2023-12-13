import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { TransformControls } from 'three/addons/controls/TransformControls.js';
import { CONFIG } from './utils/config';
import { DEBUG } from './debug/debug';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';

export class ThrlenderEngine {
  constructor() {
    if (!ThrlenderEngine.instance) {
      ThrlenderEngine.instance = this;
    }
  }
  static getInstance() {
    return ThrlenderEngine.instance;
  }

  init() {
    if (!this.scene) {
      // INIT SCENE
      this.initScene();
      // INIT CAMERA
      this.initCamera();
      // INIT RENDERER
      this.initRenderer();
      // INIT CONTROLS
      this.initControls();
      // INIT GRID
      this.initGrid();
      // INIT SKY LIGHT:
      this.initDefaultSkylight();
      // INIT TRANSFORM CONTROLS
      this.initTransformControls();
      //  INIT AXES HELPER
      this.initAxesHelper();
      this.selectedObject = null;
      // ADD SCENE TO DOM
    } else {
      this.initGrid();
      this.initAxesHelper();
      this.initTransformControls();
      this.skyLight = this.scene.getObjectByName('ThrlenderSkyLight');
    }
    document.body.appendChild(this.renderer.domElement);
  }

  initScene() {
    this.scene = new THREE.Scene();
  }
  initCamera() {
    this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.camera.position.set(0, 5, 10);
    this.camera.name = 'ThrlenderCamera';
    this.scene.add(this.camera);
  }

  initRenderer() {
    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
  }
  initControls() {
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = CONFIG.ENABLE_DAMPING;
    this.controls.dampingFactor = 0.05;
    this.controls.screenSpacePanning = false;
  }
  initDefaultSkylight() {
    this.skyLight = new THREE.HemisphereLight(
      CONFIG.LIGHTS_SKY_LIGHT_COLOR,
      CONFIG.LIGHTS_SKY_LIGHT_GROUND,
      CONFIG.LIGHTS_SKY_LIGHT_INTENSITY
    );
    this.skyLight.position.set(0, 20, 0);
    this.skyLight.name = 'ThrlenderSkyLight';
    // ADD HELPER TO LIGHTS:
    const lightHelper = new THREE.PointLightHelper(this.skyLight, 1);
    lightHelper.name = 'ThrlenderSkyLightHelper';
    this.scene.add(lightHelper);
    this.scene.add(this.skyLight);
  }
  initGrid() {
    this.gridHelper = new THREE.GridHelper(100, 100, CONFIG.GRID_COLOR, CONFIG.GRID_COLOR);
    this.gridHelper.visible = CONFIG.GRID_VISIBLE;
    this.gridHelper.name = 'ThrlenderGridHelper';
    this.scene.add(this.gridHelper);
  }

  initTransformControls() {
    this.transformControls = new TransformControls(this.camera, this.renderer.domElement);
    this.transformControls.name = 'ThrlenderTransformControls';
    // DEFAULT SNAP TO GRID
    if (CONFIG.SNAP_TO_GRID) {
      this.transformControls.setTranslationSnap(1);
      this.transformControls.setRotationSnap((15 * Math.PI) / 180);
      this.transformControls.setScaleSnap(0.25);
    }
    this.scene.add(this.transformControls);
  }

  initAxesHelper() {
    this.axesHelper = new THREE.AxesHelper(5);
    this.axesHelper.visible = CONFIG.AXES_HELPER;
    this.axesHelper.name = 'ThrlenderAxesHelper';
    this.scene.add(this.axesHelper);
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }

  update() {
    this.controls.update();
  }

  resize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  // SAVE AND LOAD METHODS:

  save() {
    // CLEAN SCENE FROM AXES HELPER, GRID HELPER, TRANSFORM CONTROLS:
    this.scene.remove(this.axesHelper);
    this.scene.remove(this.gridHelper);
    this.scene.remove(this.transformControls);

    const jsonScene = JSON.stringify(this.scene.toJSON());

    // RE-ADD AXES HELPER, GRID HELPER, TRANSFORM CONTROLS:
    this.scene.add(this.axesHelper);
    this.scene.add(this.gridHelper);
    this.scene.add(this.transformControls);

    // DOWNLOAD JSON SCENE:
    const blob = new Blob([jsonScene], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'scene.thrl';
    link.click();
    link.remove();
  }

  load() {
    // CLEAR CURRENT SCENE:
    // LOAD JSON SCENE:
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.thrl';
    input.onchange = (event) => {
      const reader = new FileReader();
      reader.readAsText(event.target.files[0]);
      reader.onload = (event) => {
        const jsonScene = JSON.parse(event.target.result);
        const loader = new THREE.ObjectLoader();
        this.transformControls.detach();
        this.scene.children.forEach((child) => {
          if (child.name !== '') {
            this.scene.remove(child);
          }
        });
        this.scene = loader.parse(jsonScene);
        // ADD HELPER TO LIGHTS:
        this.scene.children.forEach((child) => {
          if (child.type?.includes('Light')) {
            const lightHelper = new THREE.PointLightHelper(child, 1);
            lightHelper.name = `${child.name}Helper`;
            this.scene.add(lightHelper);
          }
        });
        this.init();
      };
    };
    input.click();
    input.remove();
  }

  setSelectedObject(object) {
    // ATTACH TRANSFORM CONTROLS TO OBJECT:
    this.transformControls.attach(object);
    this.selectedObject = object;
  }
  removeSelectedObject() {
    this.transformControls.detach();
    this.scene.remove(this.selectedObject);
    this.selectedObject.material.dispose();
    this.selectedObject.geometry.dispose();
    DEBUG.removeSelectedObject();
    this.selectedObject = null;
  }

  loadFbx() {
    // LOAD FBX SCENE:
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.fbx';
    input.onchange = (event) => {
      const reader = new FileReader();
      reader.readAsArrayBuffer(event.target.files[0]);
      reader.onload = (event) => {
        console.log(event);
        const contents = event.target.result;
        const loader = new FBXLoader();
        const object = loader.parse(contents);
        object.name = 'FBX_Object';
        this.scene.add(object);
      };
    };
    input.click();
    input.remove();
  }
}
