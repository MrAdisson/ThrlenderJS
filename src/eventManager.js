import { CONFIG } from './utils/config';
import * as THREE from 'three';

const init = (state) => {
  // RESIZE HANDLER:
  const resizeHandler = function () {
    state.camera.aspect = window.innerWidth / window.innerHeight;
    state.camera.updateProjectionMatrix();
    state.renderer.setSize(window.innerWidth, window.innerHeight);
  };
  window.addEventListener('resize', resizeHandler);

  //   KEYBOARD HANDLER:
  window.addEventListener('keydown', (event) => {
    if (event.code === 'Space') {
      event.preventDefault();
      CONFIG.TRANSFORM_CONTROLS_ENABLED = !CONFIG.TRANSFORM_CONTROLS_ENABLED;
    }
    //   S TOGGLE SCALE MODE
    if (event.key === 's') {
      event.preventDefault();
      CONFIG.TRANSFORM_CONTROLS_MODE = 'scale';
    }
    //   R TOGGLE ROTATE MODE
    if (event.key === 'r') {
      event.preventDefault();
      CONFIG.TRANSFORM_CONTROLS_MODE = 'rotate';
    }
    //   T TOGGLE TRANSLATE MODE
    if (event.key === 't') {
      event.preventDefault();
      CONFIG.TRANSFORM_CONTROLS_MODE = 'translate';
    }
    //   G TOGGLE GRID
    if (event.key === 'g') {
      event.preventDefault();
      CONFIG.GRID_VISIBLE = !CONFIG.GRID_VISIBLE;
    }
    //   A TOGGLE AXES HELPER
    if (event.key === 'a') {
      event.preventDefault();
      CONFIG.AXES_HELPER = !CONFIG.AXES_HELPER;
    }
    //   W TOGGLE WIREFRAME MODE
    if (event.key === 'w') {
      event.preventDefault();
      CONFIG.WIREFRAME_MODE = !CONFIG.WIREFRAME_MODE;
    }
    if (event.key === 'f') {
      if (state.selectedObject) {
        state.controls.target = new THREE.Vector3(
          state.selectedObject.position.x,
          state.selectedObject.position.y,
          state.selectedObject.position.z
        );
      }
    }
  });
};

export const eventManager = {
  init,
};
