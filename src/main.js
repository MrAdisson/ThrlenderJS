import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { TransformControls } from 'three/addons/controls/TransformControls.js';
import { CONFIG, CONFIG_CALLBACKS, initConfig } from './utils/config';
import { DEBUG } from './debug/debug';
import { mouseManager } from './mouseManager';
import { eventManager } from './eventManager';
import { MENU } from './menu/menu';

// INIT DEBUG
DEBUG.init();

// SCENE:
const scene = new THREE.Scene();

const state = {
  selectedObject: null,
  scene: scene,
  skyLight: null,
  sceneObjects: [],
  lights: [],
  grid: null,
  controls: null,
  helpers: [],
  axesHelper: null,
  transformControls: null,
  camera: null,
  renderer: null,
};

// CAMERA:
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 5, 10);
scene.add(camera);
state.camera = camera;

// RENDERER:
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
document.body.appendChild(renderer.domElement);

// SET SHADOWS:

renderer.shadowMap.enabled = true;
// renderer.shadowMap.type = THREE.PCFSoftShadowMap;

state.renderer = renderer;

// ORBIT CONTROLS:
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = CONFIG.ENABLE_DAMPING;
controls.dampingFactor = 0.05;
state.controls = controls;

// POINT LIGHT:
const light = new THREE.PointLight('orange', 30, 30);
light.position.set(0, 3, 0);
scene.add(light);
light.castShadow = true;
// LIGHT HELPER:
const lightHelper = new THREE.PointLightHelper(light);
scene.add(lightHelper);
state.lights.push(light);
state.helpers.push(lightHelper);

// SKY LIGHT:
const skyLight = new THREE.HemisphereLight(
  CONFIG.LIGHTS_SKY_LIGHT_COLOR,
  CONFIG.LIGHTS_SKY_LIGHT_GROUND,
  CONFIG.LIGHTS_SKY_LIGHT_INTENSITY
);
skyLight.castShadow = true;
skyLight.position.set(0, 20, 0);
scene.add(skyLight);
state.skyLight = skyLight;

// FLAT GRID :
const grid = new THREE.GridHelper(80, 80);
state.grid = grid;
scene.add(grid);

// AXES HELPER:
const axesHelper = new THREE.AxesHelper(5);
scene.add(axesHelper);
state.axesHelper = axesHelper;

// OBJECTS INSTANTIATION:
for (let i = 0; i < 5; i++) {
  const geometry = new THREE.BoxGeometry(1, 1, 1);
  const material = new THREE.MeshLambertMaterial({
    color: 0x333333,
    wireframe: CONFIG.WIREFRAME_MODE,
  });
  const cube = new THREE.Mesh(geometry, material);
  cube.position.set(
    Math.floor(Math.random() * 10 - 5),
    Math.floor(Math.random() * 3),
    Math.floor(Math.random() * 10 - 5)
  );
  cube.castShadow = true;
  cube.receiveShadow = true;
  scene.add(cube);
  state.sceneObjects.push(cube);
}

// ADD GROUND :
const groundGeometry = new THREE.PlaneGeometry(10, 10);
const groundMaterial = new THREE.MeshLambertMaterial({ color: 0xffffff });
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.position.y = -0.5;
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);
state.sceneObjects.push(ground);

// ADD TRANSFORM CONTROLS
const transformControls = new TransformControls(camera, renderer.domElement);
scene.add(transformControls);
state.transformControls = transformControls;

// UPDATE CONFIG:
let previousConfig = { ...CONFIG };
const updateConfig = function () {
  Object.keys(CONFIG).map((key) => {
    if (CONFIG[key] !== previousConfig[key]) {
      CONFIG_CALLBACKS[key] && CONFIG_CALLBACKS[key](state);
    }
  });
  transformControls.dragging ? (controls.enabled = false) : (controls.enabled = true);
  previousConfig = { ...CONFIG };
};

// INIT :
initConfig(state);
mouseManager.init(state);
eventManager.init(state);
MENU.initMenu(state);

// ANIMATION LOOP:
// const clock = new THREE.Clock();
const animate = function () {
  //   const elapsedTime = clock.getElapsedTime();
  controls.update();
  updateConfig();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
};

animate();
