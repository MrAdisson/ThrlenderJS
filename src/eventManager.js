import { ThrlenderEngine } from './ThrlenderEngine';
import { CONFIG } from './utils/config';
import * as THREE from 'three';

const init = () => {
  const thrlender = ThrlenderEngine.getInstance();
  const resizeHandler = function () {
    thrlender.resize();
  };
  window.addEventListener('resize', resizeHandler);

  //   KEYBOARD HANDLER:
  window.addEventListener('keydown', (event) => {
    if (event.key === 'd') {
      const thrlender = ThrlenderEngine.getInstance();
      console.log(thrlender);
    }
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
      if (thrlender.selectedObject) {
        thrlender.controls.target = new THREE.Vector3(
          thrlender.selectedObject.position.x,
          thrlender.selectedObject.position.y,
          thrlender.selectedObject.position.z
        );
      }
    }
  });
};

export const eventManager = {
  init,
};
