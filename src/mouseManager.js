import * as THREE from 'three';
import { DEBUG } from './debug/debug';
import { ThrlenderEngine } from './ThrlenderEngine';

const selectionnableObjectsTypes = [
  'cube',
  'sphere',
  'cylinder',
  'cone',
  'plane',
  'pointLightHelper',
  'spotLightHelper',
  'directionalLightHelper',
  'ambientLightHelper',
  'ThrlenderSkyLightHelper',
];

const init = () => {
  const thrlender = ThrlenderEngine.getInstance();
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();
  const onMouseMove = function (event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  };

  const onMouseClick = function (event) {
    if (event.target.localName !== 'canvas') return;
    if (thrlender.transformControls.dragging) return;
    raycaster.setFromCamera(mouse, thrlender.camera);
    const intersects = raycaster
      .intersectObjects(thrlender.scene.children)
      .filter((obj) => selectionnableObjectsTypes.includes(obj.object?.name));
    if (!intersects.length > 0) {
      thrlender.transformControls.detach();
      thrlender.setSelectedObject(null);
      DEBUG.removeSelectedObject();
      return;
    }
    if (thrlender.selectedObject) {
      thrlender.transformControls.detach();
      thrlender.setSelectedObject(null);
      DEBUG.removeSelectedObject();
    }

    // IF IS LIGHTHELPER, SELECT LIGHT
    if (intersects[0].object?.light) {
      thrlender.setSelectedObject(intersects[0].object.light);
      thrlender.transformControls.attach(thrlender.selectedObject);
      DEBUG.addSelectedObject(thrlender.selectedObject);
      return;
    }
    thrlender.setSelectedObject(intersects[0].object);
    thrlender.transformControls.attach(thrlender.selectedObject);
    DEBUG.addSelectedObject(thrlender.selectedObject);
  };
  window.addEventListener('mousemove', onMouseMove, false);
  window.addEventListener('mousedown', onMouseClick, false);
  // window.addEventListener('click', onMouseClick, false);
};

export const mouseManager = {
  init,
};
