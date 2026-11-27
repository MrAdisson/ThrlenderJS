import * as THREE from 'three';
import type { ThrlenderEngine } from '../ThrlenderEngine';

const shapes = {
  cube: () => new THREE.BoxGeometry(1, 1, 1),
  sphere: () => new THREE.SphereGeometry(1, 32, 32),
  cylinder: () => new THREE.CylinderGeometry(1, 1, 2, 32),
  cone: () => new THREE.ConeGeometry(1, 2, 32),
  plane: () => new THREE.PlaneGeometry(5, 5, 32),
};

const lights = {
  pointLight: (color: string) => new THREE.PointLight(color, 45, 100),
  spotLight: (color: string) => new THREE.SpotLight(color, 45, 100),
  directionalLight: (color: string) => new THREE.DirectionalLight(color, 45),
  ambientLight: (color: string) => new THREE.AmbientLight(color, 45),
};

export const itemLabels = {
  cube: 'Cube',
  sphere: 'Sphere',
  cylinder: 'Cylinder',
  cone: 'Cone',
  plane: 'Plane',
  pointLight: 'Point light',
  spotLight: 'Spot light',
  directionalLight: 'Directional light',
  ambientLight: 'Ambient light',
};

export type ItemType = keyof typeof itemLabels;

export function addItem(engine: ThrlenderEngine, type: ItemType, color: string) {
  if (type in shapes) {
    const geometry = shapes[type as keyof typeof shapes]();
    const material = new THREE.MeshLambertMaterial({ color, wireframe: engine.config.WIREFRAME_MODE });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = type;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    engine.addObject(mesh);
  } else {
    const light = lights[type as keyof typeof lights](color);
    light.position.set(0, 3, 0);
    light.name = type;
    light.castShadow = true;
    engine.addObject(light);
  }
}
