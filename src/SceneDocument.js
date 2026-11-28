import { HemisphereLight, Scene } from 'three';

export class SceneDocument {
  revision = 0;
  savedRevision = 0;

  /** @param {Scene} scene */
  constructor(scene) {
    this.scene = scene;
    const skyLights = [];
    scene.traverse((object) => {
      if (object instanceof HemisphereLight) skyLights.push(object);
    });
    this.skyLight = skyLights.find((light) => light.userData.thrlenderSkyLight) ??
      skyLights.find((light) => light.name === 'ThrlenderSkyLight' && !light.userData.thrlenderRenamed);
    if (this.skyLight) this.skyLight.userData.thrlenderSkyLight = true;
  }

  get dirty() {
    return this.revision !== this.savedRevision;
  }

  static create() {
    const scene = new Scene();
    const skyLight = new HemisphereLight('#ffffff', '#333333', 0.2);
    skyLight.position.set(0, 20, 0);
    skyLight.name = 'ThrlenderSkyLight';
    scene.add(skyLight);
    return new SceneDocument(scene);
  }
}
