import * as THREE from 'three';

/**
 * @param {import('./ThrlenderEngine').ThrlenderEngine} thrlender
 */
const init = (thrlender) => {
  const canvas = thrlender.renderer.domElement;
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();

  let editClick;
  const onPointerDown = (event) => {
    const session = thrlender.vertexEdit;
    editClick = session && event.button === 0 && event.isPrimary && !thrlender.transformControls.dragging
      ? { session, id: event.pointerId, x: event.clientX, y: event.clientY, extend: event.shiftKey }
      : undefined;
  };

  const clearEditClick = () => { editClick = undefined; };
  const onPointerMove = (event) => {
    if (editClick?.id === event.pointerId &&
        Math.hypot(event.clientX - editClick.x, event.clientY - editClick.y) > 4) clearEditClick();
  };

  const onPointerUp = (event) => {
    const start = editClick;
    clearEditClick();
    if (!start || start.session !== thrlender.vertexEdit || start.id !== event.pointerId ||
        Math.hypot(event.clientX - start.x, event.clientY - start.y) > 4) return;
    const bounds = canvas.getBoundingClientRect();
    start.session.pick(event.clientX - bounds.left, event.clientY - bounds.top, bounds, thrlender.camera, start.extend);
    thrlender.syncSelectionGizmo();
    thrlender.dispatchEvent({ type: 'selection-changed' });
  };

  const onMouseClick = (event) => {
    canvas.focus({ preventScroll: true });
    if (thrlender.vertexEdit || thrlender.transformControls.dragging) return;
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

  const onAdditivePointerDown = (event) => {
    if (thrlender.vertexEdit?.selectionMode !== 'vertices' || !event.shiftKey || event.button !== 0 || !event.isPrimary) return;
    onPointerDown(event);
    canvas.focus({ preventScroll: true });
    canvas.setPointerCapture(event.pointerId);
    event.stopImmediatePropagation();
  };

  canvas.addEventListener('mousedown', onMouseClick);
  canvas.addEventListener('pointerdown', onAdditivePointerDown, true);
  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerup', onPointerUp);
  canvas.addEventListener('pointercancel', clearEditClick);
  return () => {
    canvas.removeEventListener('mousedown', onMouseClick);
    canvas.removeEventListener('pointerdown', onAdditivePointerDown, true);
    canvas.removeEventListener('pointerdown', onPointerDown);
    canvas.removeEventListener('pointermove', onPointerMove);
    canvas.removeEventListener('pointerup', onPointerUp);
    canvas.removeEventListener('pointercancel', clearEditClick);
  };
};

export const mouseManager = {
  init,
};
