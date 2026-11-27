import GUI from 'lil-gui';
import * as THREE from 'three';
import { logger } from '../utils/logger';

/**
 * @param {HTMLElement} host
 * @param {import('../ThrlenderEngine').ThrlenderEngine} thrlender
 */
const init = (host, thrlender) => {
  const gui = new GUI({ container: host });
  gui.domElement.classList.add('editor-settings');
  const config = thrlender.config;

  // lil-gui releases its window drag listeners on mouseup or touchend.
  const dragEvents = new AbortController();
  const options = { signal: dragEvents.signal };
  let mouseDrag = false;
  let touchDrag = false;
  gui.domElement.addEventListener('mousedown', (event) => {
    if (event.target.closest('.controller.number input, .controller.number .slider')) mouseDrag = true;
  }, options);
  gui.domElement.addEventListener('touchstart', (event) => {
    if (event.target.closest('.controller.number .slider')) touchDrag = event.touches.length === 1;
  }, options);
  window.addEventListener('mouseup', () => { mouseDrag = false; }, options);
  window.addEventListener('touchend', () => { touchDrag = false; }, options);
  //GLOBAL SETTINGS
  gui.add(config, 'WIREFRAME_MODE').listen();
  gui.add(config, 'ENABLE_DAMPING').listen();

  const saveAndLoadFolder = gui.addFolder('Save and Load');
  saveAndLoadFolder.add(thrlender, 'save').listen();
  saveAndLoadFolder.add(thrlender, 'load').listen();
  saveAndLoadFolder.add(thrlender, 'loadFbx').listen();

  //GRID SETTINGS
  const gridFolder = gui.addFolder('Grid Settings');
  gridFolder.add(config, 'GRID_VISIBLE').name('VISIBLE').listen();
  gridFolder.addColor(config, 'GRID_COLOR').name('COLOR').listen();
  gridFolder.add(config, 'AXES_HELPER').listen();

  //TRANSFORM CONTROLS SETTINGS
  const transformControlsFolder = gui.addFolder('Transform Controls');
  transformControlsFolder.add(config, 'TRANSFORM_CONTROLS_ENABLED').name('ENABLED').listen();
  transformControlsFolder
    .add(config, 'TRANSFORM_CONTROLS_MODE', ['translate', 'rotate', 'scale'])
    .onChange((value) => {
      config.TRANSFORM_CONTROLS_MODE = value;
    })
    .name('MODE')
    .listen();
  transformControlsFolder.add(config, 'SNAP_TO_GRID').listen();
  // LIGHTS SETTINGS

  const lightsFolder = gui.addFolder('Lights');
  lightsFolder.add(config, 'LIGHTS_LIGHT_HELPERS_VISIBLE').name('HELPERS').listen();
  const skyLightFolder = lightsFolder.addFolder('Sky Light');
  skyLightFolder.add(config, 'LIGHTS_SKY_LIGHT_INTENSITY', 0, 2).name('INTENSITY').listen();
  skyLightFolder.addColor(config, 'LIGHTS_SKY_LIGHT_COLOR').name('COLOR').listen();
  skyLightFolder.addColor(config, 'LIGHTS_SKY_LIGHT_GROUND').name('GROUND').listen();
  let selectedObjectFolder;
  const clearSelection = () => {
    selectedObjectFolder?.destroy();
    selectedObjectFolder = undefined;
  };

  function showSelection(selectedObject) {
    clearSelection();
    if (!selectedObject) return;

    logger.log(selectedObject, 'debug', 'blue', 'New selected object :');
    selectedObjectFolder = gui.addFolder('Selected Object');
    const position = selectedObjectFolder.addFolder('position');
    for (const axis of ['x', 'y', 'z']) position.add(selectedObject.position, axis).listen();

    if (selectedObject instanceof THREE.Light) {
      selectedObjectFolder.add(selectedObject, 'intensity', 0, 500).listen();
      if ('distance' in selectedObject) selectedObjectFolder.add(selectedObject, 'distance', 1, 150).listen();
      if ('decay' in selectedObject) selectedObjectFolder.add(selectedObject, 'decay').listen();
      selectedObjectFolder.addColor(selectedObject, 'color').listen();
    } else {
      for (const axis of ['x', 'y', 'z']) selectedObjectFolder.add(selectedObject.scale, axis).name('s' + axis).listen();
      if (selectedObject.material?.color) selectedObjectFolder.addColor(selectedObject.material, 'color').listen();
    }
    selectedObjectFolder.add(thrlender, 'removeSelectedObject').listen();
  }

  thrlender.addEventListener('selection-cleared', clearSelection);
  return {
    showSelection,
    dispose() {
      if (mouseDrag) window.dispatchEvent(new MouseEvent('mouseup'));
      if (touchDrag) window.dispatchEvent(new Event('touchend'));
      dragEvents.abort();
      thrlender.removeEventListener('selection-cleared', clearSelection);
      gui.destroy();
    },
  };
};

export const DEBUG = { init };
