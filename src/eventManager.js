import { selectionnableObjectsTypes } from './utils/config';
import * as THREE from 'three';

/** @param {import('./ThrlenderEngine').ThrlenderEngine} thrlender */
const init = (thrlender) => {
  const canvas = thrlender.renderer.domElement;
  const config = thrlender.config;

  const onKeyDown = (event) => {
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey && event.key === 'Tab') return;
    if (event.code === 'Space') {
      event.preventDefault();
      config.TRANSFORM_CONTROLS_ENABLED = !config.TRANSFORM_CONTROLS_ENABLED;
    }
    //   S TOGGLE SCALE MODE
    if (event.key === 's') {
      event.preventDefault();
      config.TRANSFORM_CONTROLS_MODE = 'scale';
    }
    //   R TOGGLE ROTATE MODE
    if (event.key === 'r') {
      event.preventDefault();
      config.TRANSFORM_CONTROLS_MODE = 'rotate';
    }
    //   T TOGGLE TRANSLATE MODE
    if (event.key === 't') {
      event.preventDefault();
      config.TRANSFORM_CONTROLS_MODE = 'translate';
    }
    //   G TOGGLE GRID
    if (event.key === 'g') {
      event.preventDefault();
      config.GRID_VISIBLE = !config.GRID_VISIBLE;
    }
    //   A TOGGLE AXES HELPER
    if (event.key === 'a') {
      event.preventDefault();
      config.AXES_HELPER = !config.AXES_HELPER;
    }
    //   W TOGGLE WIREFRAME MODE
    if (event.key === 'w') {
      event.preventDefault();
      config.WIREFRAME_MODE = !config.WIREFRAME_MODE;
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
    if (event.key === 'Tab') {
      const objects = thrlender.scene.children.filter((obj) => selectionnableObjectsTypes.includes(obj.name));
      const distances = [];
      objects.forEach((obj) => {
        const distance = thrlender.camera.position.distanceTo(obj.position);
        distances.push(distance);
      });
      const minDistance = Math.min(...distances);
      const index = distances.indexOf(minDistance);
      thrlender.setSelectedObject(objects[index]);
      // Keep the scene shortcut, and let Tab continue into the editor controls.
    }
  };
  canvas.addEventListener('keydown', onKeyDown);

  return () => {
    canvas.removeEventListener('keydown', onKeyDown);
  };
};

export const eventManager = {
  init,
};
