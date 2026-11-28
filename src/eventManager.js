/** @param {import('./ThrlenderEngine').ThrlenderEngine} thrlender */
const init = (thrlender) => {
  const canvas = thrlender.renderer.domElement;
  const { config, transformSettings } = thrlender;

  const onKeyDown = (event) => {
    if (!event.altKey && (event.ctrlKey || event.metaKey)) {
      const key = event.key.toLowerCase();
      if (key === 'z' || (event.ctrlKey && !event.shiftKey && key === 'y')) {
        event.preventDefault();
        if (key === 'y' || event.shiftKey) thrlender.redo();
        else thrlender.undo();
      }
      return;
    }
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey && event.key === 'Tab') return;
    if (event.code === 'Space') {
      event.preventDefault();
      transformSettings.TRANSFORM_CONTROLS_ENABLED = !transformSettings.TRANSFORM_CONTROLS_ENABLED;
    }
    //   S TOGGLE SCALE MODE
    if (!thrlender.vertexEdit && event.key === 's') {
      event.preventDefault();
      transformSettings.TRANSFORM_CONTROLS_MODE = 'scale';
    }
    //   R TOGGLE ROTATE MODE
    if (!thrlender.vertexEdit && event.key === 'r') {
      event.preventDefault();
      transformSettings.TRANSFORM_CONTROLS_MODE = 'rotate';
    }
    //   T TOGGLE TRANSLATE MODE
    if (!thrlender.vertexEdit && event.key === 't') {
      event.preventDefault();
      transformSettings.TRANSFORM_CONTROLS_MODE = 'translate';
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
    if (event.key === 'f') thrlender.focusSelection();
    if (!thrlender.vertexEdit && event.key === 'Tab') {
      let closest;
      let distance = Infinity;
      for (const object of thrlender.sceneItems()) {
        if (!thrlender.isVisible(object)) continue;
        const candidate = thrlender.camera.position.distanceToSquared(object.position);
        if (candidate < distance) {
          closest = object;
          distance = candidate;
        }
      }
      thrlender.setSelectedObject(closest);
      // Keep the scene shortcut, and let Tab continue into the editor controls.
    }
  };
  const onLostPointerCapture = () => {
    thrlender.transformControls.dragging = false;
    thrlender.transformControls.axis = null;
  };
  canvas.addEventListener('keydown', onKeyDown);
  canvas.addEventListener('lostpointercapture', onLostPointerCapture);

  return () => {
    canvas.removeEventListener('keydown', onKeyDown);
    canvas.removeEventListener('lostpointercapture', onLostPointerCapture);
  };
};

export const eventManager = {
  init,
};
