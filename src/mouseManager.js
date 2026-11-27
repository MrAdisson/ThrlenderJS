import * as THREE from 'three';
import { selectionnableObjectsTypes } from './utils/config';

/**
 * @param {import('./ThrlenderEngine').ThrlenderEngine} thrlender
 */
const init = (thrlender) => {
  const canvas = thrlender.renderer.domElement;
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();

  const onMouseClick = (event) => {
    canvas.focus({ preventScroll: true });
    if (thrlender.transformControls.dragging) return;
    const bounds = canvas.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return;
    mouse.x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
    mouse.y = -((event.clientY - bounds.top) / bounds.height) * 2 + 1;
    raycaster.setFromCamera(mouse, thrlender.camera);
    const intersects = raycaster
      .intersectObjects(thrlender.scene.children)
      .filter(({ object }) => selectionnableObjectsTypes.includes(object.name) || object.type === 'Group');
    const hit = intersects[0]?.object;
    thrlender.setSelectedObject(hit);
  };

  canvas.addEventListener('mousedown', onMouseClick);
  return () => canvas.removeEventListener('mousedown', onMouseClick);
};

export const mouseManager = {
  init,
};
