import * as THREE from 'three';
import { DEBUG } from './debug/debug';

const init = (state) => {
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();
  const onMouseMove = function (event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  };
  const onMouseClick = function (event) {
    if (state.transformControls.dragging) return;
    raycaster.setFromCamera(mouse, state.camera);
    const intersects = raycaster
      .intersectObjects(state.scene.children)
      .filter((obj) => state.sceneObjects.map((obj) => obj.uuid).includes(obj.object.uuid));
    if (intersects.length > 0) {
      if (state.selectedObject) {
        state.transformControls.detach();
        DEBUG.removeSelectedObject();
      }
      state.selectedObject = intersects[0].object;
      state.transformControls.attach(state.selectedObject);
      DEBUG.addSelectedObject(state.selectedObject);
    }
  };
  window.addEventListener('mousemove', onMouseMove, false);
  window.addEventListener('click', onMouseClick, false);
};

export const mouseManager = {
  init,
};
