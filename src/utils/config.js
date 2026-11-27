import { logger } from './logger';

export const createConfig = () => ({
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
});

export const selectionnableObjectsTypes = [
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
  'FBX_Object',
];

/** @param {import('../ThrlenderEngine').ThrlenderEngine} thrlender */
export const getConfigCallbacks = (thrlender) => {
  const config = thrlender.config;
  return {
    WIREFRAME_MODE: () => {
      thrlender?.scene?.children?.forEach((obj) => {
        if (!obj?.material) return;
        if (obj?.type?.includes('Light')) return;
        if (obj?.type?.includes('Helper')) return;
        obj.material.wireframe = config.WIREFRAME_MODE;
      });
      logger.log('WIREFRAME_MODE : ' + config.WIREFRAME_MODE, 'SETTINGS', 'grey');
    },
    GRID_VISIBLE: () => {
      thrlender.gridHelper.visible = config.GRID_VISIBLE;
      logger.log('GRID_VISIBLE : ' + config.GRID_VISIBLE, 'SETTINGS', 'grey');
    },
    GRID_COLOR: () => {
      thrlender.gridHelper.material.color.set(config.GRID_COLOR);
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
      thrlender.transformControls.setMode(config.TRANSFORM_CONTROLS_MODE);
      logger.log('TRANSFORM_CONTROLS_MODE : ' + config.TRANSFORM_CONTROLS_MODE, 'SETTINGS', 'grey');
    },
    SNAP_TO_GRID: () => {
      config.SNAP_TO_GRID
        ? (() => {
            thrlender.transformControls.setTranslationSnap(1);
            thrlender.transformControls.setRotationSnap((15 * Math.PI) / 180);
            thrlender.transformControls.setScaleSnap(0.25);
          })()
        : (() => {
            thrlender.transformControls.setTranslationSnap(null);
            thrlender.transformControls.setRotationSnap(null);
            thrlender.transformControls.setScaleSnap(null);
          })();
      logger.log('SNAP_TO_GRID : ' + config.SNAP_TO_GRID, 'SETTINGS', 'grey');
    },
    TRANSFORM_CONTROLS_ENABLED: () => {
      config.TRANSFORM_CONTROLS_ENABLED
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
      // GET ALL LIGHT HELPERS IN SCENE.CHILDREN
      const helpers = thrlender.scene.children.filter((obj) => obj.type.includes('LightHelper'));
      config.LIGHTS_LIGHT_HELPERS_VISIBLE
        ? (() => {
            helpers.forEach((helper) => {
              helper.visible = true;
            });
          })()
        : (() => {
            helpers.forEach((helper) => {
              helper.visible = false;
            });
          })();
    },
    LIGHTS_SKY_LIGHT_INTENSITY: () => {
      if (!thrlender.skyLight) return;
      thrlender.skyLight.intensity = config.LIGHTS_SKY_LIGHT_INTENSITY;
      logger.log('LIGHTS_SKY_LIGHT_INTENSITY : ' + config.LIGHTS_SKY_LIGHT_INTENSITY, 'SETTINGS', 'grey');
    },
    LIGHTS_SKY_LIGHT_COLOR: () => {
      logger.log('LIGHTS_SKY_LIGHT_COLOR : ' + config.LIGHTS_SKY_LIGHT_COLOR, 'SETTINGS', 'grey');
      thrlender.skyLight?.color.set(config.LIGHTS_SKY_LIGHT_COLOR);
    },
    LIGHTS_SKY_LIGHT_GROUND: () => {
      logger.log('LIGHTS_SKY_LIGHT_GROUND : ' + config.LIGHTS_SKY_LIGHT_GROUND, 'SETTINGS', 'grey');
      thrlender.skyLight?.groundColor.set(config.LIGHTS_SKY_LIGHT_GROUND);
    },
  };
};
