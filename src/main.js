import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { TransformControls } from 'three/addons/controls/TransformControls.js';
import { CONFIG, CONFIG_CALLBACKS, initConfig } from './utils/config';
import { DEBUG } from './debug/debug';
import { mouseManager } from './mouseManager';
import { eventManager } from './eventManager';

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
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);
state.renderer = renderer;

// ORBIT CONTROLS:
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = CONFIG.ENABLE_DAMPING;
controls.dampingFactor = 0.05;
state.controls = controls;

// POINT LIGHT:
const light = new THREE.PointLight('orange', 100, 100);
light.position.set(0, 0, 0);
scene.add(light);
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
    color: 0xffffff,
    wireframe: CONFIG.WIREFRAME_MODE,
  });
  const cube = new THREE.Mesh(geometry, material);
  cube.position.set(Math.random() * 10 - 5, Math.random() * 10 - 5, Math.random() * 10 - 5);
  scene.add(cube);
  state.sceneObjects.push(cube);
}

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

initConfig(state);
mouseManager.init(state);
eventManager.init(state);

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

// MENU

const menu = document.createElement('div');
menu.style.position = 'absolute';
menu.style.top = '0';
menu.style.left = '0';
menu.style.zIndex = '999';
menu.style.display = 'flex';
menu.style.flexDirection = 'column';
menu.style.alignItems = 'center';
menu.style.justifyContent = 'center';
menu.style.padding = '10px';
menu.style.border = '1px solid black';
menu.style.borderRadius = '5px';
menu.style.backgroundColor = '#1f1f1f';

document.body.appendChild(menu);

const menuSelect = document.createElement('select');
menuSelect.style.marginTop = '10px';
menu.appendChild(menuSelect);

// COLOR OPTION
const colorOption = document.createElement('input');
colorOption.type = 'color';
colorOption.value = '#ffffff';
colorOption.style.marginTop = '10px';
menu.appendChild(colorOption);

const menuButton = document.createElement('button');
menuButton.innerHTML = 'ADD';
menuButton.style.marginTop = '10px';
menu.appendChild(menuButton);

const objects = [
  { value: 'cube', createGeometry: () => new THREE.BoxGeometry(1, 1, 1), type: 'object' },
  { value: 'sphere', createGeometry: () => new THREE.SphereGeometry(1, 32, 32), type: 'object' },
  { value: 'cylinder', createGeometry: () => new THREE.CylinderGeometry(1, 1, 2, 32), type: 'object' },
  { value: 'cone', createGeometry: () => new THREE.ConeGeometry(1, 2, 32), type: 'object' },
];

const lights = [
  { value: 'pointLight', createLight: () => new THREE.PointLight(colorOption.value, 100, 100), type: 'light' },
  { value: 'spotLight', createLight: () => new THREE.SpotLight(colorOption.value, 100, 100), type: 'light' },
  { value: 'directionalLight', createLight: () => new THREE.DirectionalLight(colorOption.value, 100), type: 'light' },
  { value: 'ambientLight', createLight: () => new THREE.AmbientLight(colorOption.value, 100), type: 'light' },
];

objects.forEach((obj) => {
  const menuOption = document.createElement('option');
  menuOption.innerHTML = obj.value.charAt(0).toUpperCase() + obj.value.slice(1);
  menuOption.value = obj.value;
  menuSelect.appendChild(menuOption);
});

lights.forEach((light) => {
  const menuOption = document.createElement('option');
  menuOption.innerHTML = light.value.charAt(0).toUpperCase() + light.value.slice(1);
  menuOption.value = light.value;
  menuSelect.appendChild(menuOption);
});

menuButton.addEventListener('click', () => {
  const selectedObject = objects.concat(...lights).find((obj) => obj.value === menuSelect.value);
  console.log(selectedObject);
  if (selectedObject?.type === 'object') {
    const geometry = selectedObject.createGeometry();
    const material = new THREE.MeshLambertMaterial({
      color: colorOption.value,
      wireframe: CONFIG.WIREFRAME_MODE,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(Math.random() * 10 - 5, Math.random() * 10 - 5, Math.random() * 10 - 5);
    scene.add(mesh);
    state.sceneObjects.push(mesh);
  }
  if (selectedObject?.type === 'light') {
    console.log('COUCOU');
    const light = selectedObject.createLight();
    // ADD HELPER:
    const lightHelper = new THREE.PointLightHelper(light);
    scene.add(lightHelper);
    light.position.set(Math.random() * 10 - 5, Math.random() * 10 - 5, Math.random() * 10 - 5);
    scene.add(light);
    state.lights.push(light);
  }
});
