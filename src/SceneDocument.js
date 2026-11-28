import { HemisphereLight, Scene } from 'three';

export class SceneDocument {
  revision = 0;
  savedRevision = 0;

  /** @param {Scene} scene */
  constructor(scene) {
    this.scene = scene;
  }

  get dirty() {
    return this.revision !== this.savedRevision;
  }

  get skyLight() {
    const light = this.scene.getObjectByName('ThrlenderSkyLight');
    return light instanceof HemisphereLight ? light : undefined;
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
