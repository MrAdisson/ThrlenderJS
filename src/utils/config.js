import { Color } from 'three';
import { logger } from './logger';

export const translationSnapSteps = [0.1, 0.25, 0.5, 1, 2, 5];

export const createViewPreferences = () => ({
  WIREFRAME_MODE: false,
  GRID_VISIBLE: true,
  GRID_COLOR: 'rgb(099, 099, 099)',
  AXES_HELPER: true,
  ENABLE_DAMPING: true,
  LIGHTS_LIGHT_HELPERS_VISIBLE: true,
});

export const createTransformSettings = () => ({
  TRANSFORM_CONTROLS_ENABLED: true,
  TRANSFORM_CONTROLS_MODE: 'translate',
  SNAP_TO_GRID: true,
  TRANSLATION_SNAP_STEP: 1,
});

/** @param {import('../ThrlenderEngine').ThrlenderEngine} thrlender */
export const getConfigCallbacks = (thrlender) => {
  const { config, transformSettings } = thrlender;
  const applyTranslationSnap = () => {
    thrlender.transformControls.setTranslationSnap(
      transformSettings.SNAP_TO_GRID ? transformSettings.TRANSLATION_SNAP_STEP : null
    );
  };
  return {
    WIREFRAME_MODE: () => {
      thrlender.scene.traverse((object) => {
        if (!object.isMesh) return;
        for (const material of [].concat(object.material ?? [])) {
          if ('wireframe' in material) material.wireframe = config.WIREFRAME_MODE;
        }
      });
      logger.log('WIREFRAME_MODE : ' + config.WIREFRAME_MODE, 'SETTINGS', 'grey');
    },
    GRID_VISIBLE: () => {
      thrlender.gridHelper.visible = config.GRID_VISIBLE;
      logger.log('GRID_VISIBLE : ' + config.GRID_VISIBLE, 'SETTINGS', 'grey');
    },
    GRID_COLOR: () => {
      const color = new Color(config.GRID_COLOR);
      const attribute = thrlender.gridHelper.geometry.getAttribute('color');
      for (let i = 0; i < attribute.count; i++) attribute.setXYZ(i, color.r, color.g, color.b);
      attribute.needsUpdate = true;
      logger.log('GRID_COLOR : ' + config.GRID_COLOR, 'SETTINGS', 'grey');
    },
    AXES_HELPER: () => {
      thrlender.axesHelper.visible = config.AXES_HELPER;
      logger.log('AXES_HELPER : ' + config.AXES_HELPER, 'SETTINGS', 'grey');
    },
    ENABLE_DAMPING: () => {
      thrlender.controls.enableDamping = config.ENABLE_DAMPING;
      logger.log('ENABLE_DAMPING : ' + config.ENABLE_DAMPING, 'SETTINGS', 'grey');
    },
    TRANSFORM_CONTROLS_MODE: () => {
      thrlender.transformControls.setMode(transformSettings.TRANSFORM_CONTROLS_MODE);
      logger.log('TRANSFORM_CONTROLS_MODE : ' + transformSettings.TRANSFORM_CONTROLS_MODE, 'SETTINGS', 'grey');
    },
    SNAP_TO_GRID: () => {
      applyTranslationSnap();
      thrlender.transformControls.setRotationSnap(transformSettings.SNAP_TO_GRID ? Math.PI / 12 : null);
      thrlender.transformControls.setScaleSnap(transformSettings.SNAP_TO_GRID ? 0.25 : null);
      logger.log('SNAP_TO_GRID : ' + transformSettings.SNAP_TO_GRID, 'SETTINGS', 'grey');
    },
    TRANSLATION_SNAP_STEP: applyTranslationSnap,
    TRANSFORM_CONTROLS_ENABLED: () => {
      transformSettings.TRANSFORM_CONTROLS_ENABLED
        ? (() => {
            thrlender.transformControls.enabled = true;
            thrlender.transformControls.showX = true;
            thrlender.transformControls.showY = true;
            thrlender.transformControls.showZ = true;
          })()
        : (() => {
            thrlender.transformControls.enabled = false;
            thrlender.transformControls.showX = false;
            thrlender.transformControls.showY = false;
            thrlender.transformControls.showZ = false;
          })();
    },
    LIGHTS_LIGHT_HELPERS_VISIBLE: () => {
      thrlender.syncLightHelpers();
    },
  };
};
