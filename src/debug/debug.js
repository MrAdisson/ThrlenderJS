import GUI from 'lil-gui';
import { CONFIG } from '../utils/config';

const gui = new GUI();

const init = () => {
  //GLOBAL SETTINGS
  gui.add(CONFIG, 'WIREFRAME_MODE').listen();
  gui.add(CONFIG, 'ENABLE_DAMPING').listen();

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
};

const addSelectedObject = (selectedObject) => {
  const selectedObjectFolder = gui.addFolder('Selected Object');
  const objPosition = selectedObjectFolder.addFolder('position');

  objPosition.add(selectedObject.position, 'x').name('x').listen();
  objPosition.add(selectedObject.position, 'y').name('y').listen();
  objPosition.add(selectedObject.position, 'z').name('z').listen();
  selectedObjectFolder.add(selectedObject.scale, 'x').name('sx').listen();
  selectedObjectFolder.add(selectedObject.scale, 'y').name('sy').listen();
  selectedObjectFolder.add(selectedObject.scale, 'z').name('sz').listen();
  selectedObjectFolder.addColor(selectedObject.material, 'color').name('color').listen();
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
