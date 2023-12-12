import GUI from 'lil-gui';
import * as THREE from 'three';
import { CONFIG } from '../utils/config';
import { logger } from '../utils/logger';
import { ThrlenderEngine } from '../ThrlenderEngine';

const gui = new GUI();

const init = () => {
  // const thrlender = ThrlenderEngine.getInstance();
  //GLOBAL SETTINGS
  gui.add(CONFIG, 'WIREFRAME_MODE').listen();
  gui.add(CONFIG, 'ENABLE_DAMPING').listen();

  const saveAndLoadFolder = gui.addFolder('Save and Load');
  // saveAndLoadFolder.add(thrlender, 'save').listen();
  // saveAndLoadFolder.add(thrlender, 'load').listen();

  //GRID SETTINGS
  const gridFolder = gui.addFolder('Grid Settings');
  gridFolder.add(CONFIG, 'GRID_VISIBLE').name('VISIBLE').listen();
  gridFolder.addColor(CONFIG, 'GRID_COLOR').name('COLOR').listen();
  gridFolder.add(CONFIG, 'AXES_HELPER').listen();

  //TRANSFORM CONTROLS SETTINGS
  const transformControlsFolder = gui.addFolder('Transform Controls');
  transformControlsFolder.add(CONFIG, 'TRANSFORM_CONTROLS_ENABLED').name('ENABLED').listen();
  transformControlsFolder
    .add(CONFIG, 'TRANSFORM_CONTROLS_MODE', ['translate', 'rotate', 'scale'])
    .onChange((value) => {
      CONFIG.TRANSFORM_CONTROLS_MODE = value;
    })
    .name('MODE')
    .listen();
  transformControlsFolder.add(CONFIG, 'SNAP_TO_GRID').listen();
  // LIGHTS SETTINGS

  const lightsFolder = gui.addFolder('Lights');
  lightsFolder.add(CONFIG, 'LIGHTS_LIGHT_HELPERS_VISIBLE').name('HELPERS').listen();
  const skyLightFolder = lightsFolder.addFolder('Sky Light');
  skyLightFolder.add(CONFIG, 'LIGHTS_SKY_LIGHT_INTENSITY', 0, 2).name('INTENSITY').listen();
  skyLightFolder.addColor(CONFIG, 'LIGHTS_SKY_LIGHT_COLOR').name('COLOR').listen();
  skyLightFolder.addColor(CONFIG, 'LIGHTS_SKY_LIGHT_GROUND').name('GROUND').listen();
};

const addSelectedObject = (selectedObject) => {
  logger.log(selectedObject, 'debug', 'blue', 'New selected object :');
  const selectedObjectFolder = gui.addFolder('Selected Object');
  const objPosition = selectedObjectFolder.addFolder('position');
  objPosition.add(selectedObject.position, 'x').name('x').listen();
  objPosition.add(selectedObject.position, 'y').name('y').listen();
  objPosition.add(selectedObject.position, 'z').name('z').listen();

  //   CHECK OBJECT TYPE:
  if (selectedObject instanceof THREE.Light) {
    selectedObjectFolder.add(selectedObject, 'intensity', 0, 500).name('intensity').listen();
    selectedObjectFolder.add(selectedObject, 'distance', 1, 150).name('distance').listen();
    selectedObjectFolder.add(selectedObject, 'decay').name('decay').listen();
    selectedObjectFolder.addColor(selectedObject, 'color').name('color').listen();
    return;
  }

  selectedObjectFolder.add(selectedObject.scale, 'x').name('sx').listen();
  selectedObjectFolder.add(selectedObject.scale, 'y').name('sy').listen();
  selectedObjectFolder.add(selectedObject.scale, 'z').name('sz').listen();
  selectedObjectFolder.addColor(selectedObject.material, 'color').name('color').listen();
  selectedObject.removeFromScene &&
    selectedObjectFolder.add(selectedObject, 'removeFromScene')?.name('remove')?.listen();
  // ADD FUNCTION TO REMOVE OBJECT SELECTED OBJECT
};

export const DEBUG = {
  init,
  addSelectedObject,
  removeSelectedObject: () => {
    gui.folders.map((folder) => {
      folder._title === 'Selected Object' && folder.destroy();
    });
  },
};
