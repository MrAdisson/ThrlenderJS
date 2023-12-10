import { logger } from './logger';

export const CONFIG = {
  WIREFRAME_MODE: false,
  GRID_VISIBLE: true,
  GRID_COLOR: 'rgb(099, 099, 099)',
  AXES_HELPER: true,
  ENABLE_DAMPING: true,
  TRANSFORM_CONTROLS_ENABLED: true,
  TRANSFORM_CONTROLS_MODE: 'translate',
  SNAP_TO_GRID: true,
  LIGHTS_LIGHT_HELPERS_VISIBLE: true,
  LIGHTS_SKY_LIGHT_INTENSITY: 0.2,
  LIGHTS_SKY_LIGHT_COLOR: 'rgb(255, 255, 255)',
  LIGHTS_SKY_LIGHT_GROUND: '#333333',
};

export const initConfig = (state) => {
  CONFIG.SNAP_TO_GRID &&
    (() => {
      state.transformControls.setTranslationSnap(1);
      state.transformControls.setRotationSnap((15 * Math.PI) / 180);
      state.transformControls.setScaleSnap(0.25);
    })();
};

export const CONFIG_CALLBACKS = {
  WIREFRAME_MODE: (state) => {
    logger.log('WIREFRAME_MODE : ' + CONFIG.WIREFRAME_MODE, 'SETTINGS', 'grey');
    state.sceneObjects.forEach((obj) => {
      obj.material.wireframe = CONFIG.WIREFRAME_MODE;
    });
  },
  GRID_VISIBLE: (state) => {
    logger.log('GRID_VISIBLE : ' + CONFIG.GRID_VISIBLE, 'SETTINGS', 'grey');
    state.grid.visible = CONFIG.GRID_VISIBLE;
  },
  GRID_COLOR: (state) => {
    logger.log('GRID_COLOR : ' + CONFIG.GRID_COLOR, 'SETTINGS', 'grey');
    state.grid.material.color.set(CONFIG.GRID_COLOR);
  },
  AXES_HELPER: (state) => {
    logger.log('AXES_HELPER : ' + CONFIG.AXES_HELPER, 'SETTINGS', 'grey');
    state.axesHelper.visible = CONFIG.AXES_HELPER;
  },
  ENABLE_DAMPING: (state) => {
    logger.log('ENABLE_DAMPING : ' + CONFIG.ENABLE_DAMPING, 'SETTINGS', 'grey');
    state.controls.enableDamping = CONFIG.ENABLE_DAMPING;
  },
  TRANSFORM_CONTROLS_MODE: (state) => {
    logger.log('TRANSFORM_CONTROLS_MODE : ' + CONFIG.TRANSFORM_CONTROLS_MODE, 'SETTINGS', 'grey');
    state.transformControls.setMode(CONFIG.TRANSFORM_CONTROLS_MODE);
  },
  SNAP_TO_GRID: (state) => {
    logger.log('SNAP_TO_GRID : ' + CONFIG.SNAP_TO_GRID, 'SETTINGS', 'grey');
    CONFIG.SNAP_TO_GRID
      ? (() => {
          state.transformControls.setTranslationSnap(1);
          state.transformControls.setRotationSnap((15 * Math.PI) / 180);
          state.transformControls.setScaleSnap(0.25);
        })()
      : (() => {
          state.transformControls.setTranslationSnap(null);
          state.transformControls.setRotationSnap(null);
          state.transformControls.setScaleSnap(null);
        })();
  },
  TRANSFORM_CONTROLS_ENABLED: (state) => {
    CONFIG.TRANSFORM_CONTROLS_ENABLED
      ? (() => {
          state.transformControls.enabled = true;
          state.transformControls.showX = true;
          state.transformControls.showY = true;
          state.transformControls.showZ = true;
        })()
      : (() => {
          state.transformControls.enabled = false;
          state.transformControls.showX = false;
          state.transformControls.showY = false;
          state.transformControls.showZ = false;
        })();
  },
  LIGHTS_LIGHT_HELPERS_VISIBLE: (state) => {
    CONFIG.LIGHTS_LIGHT_HELPERS_VISIBLE
      ? (() => {
          state.helpers.forEach((helper) => {
            helper.visible = true;
          });
        })()
      : (() => {
          state.helpers.forEach((helper) => {
            helper.visible = false;
          });
        })();
  },
  LIGHTS_SKY_LIGHT_INTENSITY: (state) => {
    logger.log('LIGHTS_SKY_LIGHT_INTENSITY : ' + CONFIG.LIGHTS_SKY_LIGHT_INTENSITY, 'SETTINGS', 'grey');
    state.skyLight.intensity = CONFIG.LIGHTS_SKY_LIGHT_INTENSITY;
  },
  LIGHTS_SKY_LIGHT_COLOR: (state) => {
    logger.log('LIGHTS_SKY_LIGHT_COLOR : ' + CONFIG.LIGHTS_SKY_LIGHT_COLOR, 'SETTINGS', 'grey');
    state.skyLight.color.set(CONFIG.LIGHTS_SKY_LIGHT_COLOR);
  },
  LIGHTS_SKY_LIGHT_GROUND: (state) => {
    logger.log('LIGHTS_SKY_LIGHT_GROUND : ' + CONFIG.LIGHTS_SKY_LIGHT_GROUND, 'SETTINGS', 'grey');
    state.skyLight.groundColor.set(CONFIG.LIGHTS_SKY_LIGHT_GROUND);
  },
};
