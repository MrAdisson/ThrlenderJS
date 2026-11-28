import * as THREE from 'three';

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
    const pickable = [];
    function collect(parent) {
      for (const object of thrlender.sceneItems(parent)) {
        if (!object.visible) continue;
        pickable.push(object);
        collect(object);
      }
    }
    collect(thrlender.scene);
    const hits = raycaster.intersectObjects(pickable, false);
    // Some light helpers use child meshes and lines for their pickable geometry.
    for (const helper of thrlender.lightHelpers) {
      if (!helper.visible) continue;
      const hit = raycaster.intersectObject(helper).find(({ object }) => thrlender.isVisible(object));
      if (hit) hits.push({ ...hit, object: helper.light });
    }
    hits.sort((a, b) => a.distance - b.distance);
    const hit = hits[0]?.object;
    thrlender.setSelectedObject(hit);
  };

  canvas.addEventListener('mousedown', onMouseClick);
  return () => canvas.removeEventListener('mousedown', onMouseClick);
};

export const mouseManager = {
  init,
};
