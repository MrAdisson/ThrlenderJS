import * as THREE from 'three';
import { CONFIG } from '../utils/config';
const initMenu = (state) => {
  const scene = state.scene;
  const menu = document.createElement('div');
  menu.style.position = 'absolute';
  menu.style.top = '0';
  menu.style.left = '0';
  menu.style.zIndex = '999';
  menu.style.display = 'flex';
  menu.style.flexDirection = 'column';
  menu.style.alignItems = 'center';
  menu.style.justifyContent = 'center';
  menu.style.padding = '10px';
  menu.style.border = '1px solid black';
  menu.style.borderRadius = '5px';
  menu.style.backgroundColor = '#1f1f1f';

  document.body.appendChild(menu);

  const menuSelect = document.createElement('select');
  menuSelect.style.marginTop = '10px';
  menu.appendChild(menuSelect);

  // COLOR OPTION
  const colorOption = document.createElement('input');
  colorOption.type = 'color';
  colorOption.value = '#ffffff';
  colorOption.style.marginTop = '10px';
  menu.appendChild(colorOption);

  const menuButton = document.createElement('button');
  menuButton.innerHTML = 'ADD';
  menuButton.style.marginTop = '10px';
  menu.appendChild(menuButton);

  const objects = [
    { value: 'cube', createGeometry: () => new THREE.BoxGeometry(1, 1, 1), type: 'object' },
    { value: 'sphere', createGeometry: () => new THREE.SphereGeometry(1, 32, 32), type: 'object' },
    { value: 'cylinder', createGeometry: () => new THREE.CylinderGeometry(1, 1, 2, 32), type: 'object' },
    { value: 'cone', createGeometry: () => new THREE.ConeGeometry(1, 2, 32), type: 'object' },
  ];

  const lights = [
    { value: 'pointLight', createLight: () => new THREE.PointLight(colorOption.value, 100, 100), type: 'light' },
    { value: 'spotLight', createLight: () => new THREE.SpotLight(colorOption.value, 100, 100), type: 'light' },
    { value: 'directionalLight', createLight: () => new THREE.DirectionalLight(colorOption.value, 100), type: 'light' },
    { value: 'ambientLight', createLight: () => new THREE.AmbientLight(colorOption.value, 100), type: 'light' },
  ];

  objects.forEach((obj) => {
    const menuOption = document.createElement('option');
    menuOption.innerHTML = obj.value.charAt(0).toUpperCase() + obj.value.slice(1);
    menuOption.value = obj.value;
    menuSelect.appendChild(menuOption);
  });

  lights.forEach((light) => {
    const menuOption = document.createElement('option');
    menuOption.innerHTML = light.value.charAt(0).toUpperCase() + light.value.slice(1);
    menuOption.value = light.value;
    menuSelect.appendChild(menuOption);
  });

  menuButton.addEventListener('click', () => {
    const selectedObject = objects.concat(...lights).find((obj) => obj.value === menuSelect.value);
    if (selectedObject?.type === 'object') {
      const geometry = selectedObject.createGeometry();
      const material = new THREE.MeshLambertMaterial({
        color: colorOption.value,
        wireframe: CONFIG.WIREFRAME_MODE,
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(Math.random() * 10 - 5, Math.random() * 10 - 5, Math.random() * 10 - 5);
      scene.add(mesh);
      state.sceneObjects.push(mesh);
    }
    if (selectedObject?.type === 'light') {
      const light = selectedObject.createLight();
      // ADD HELPER:
      const lightHelper = new THREE.PointLightHelper(light);
      scene.add(lightHelper);
      light.position.set(Math.random() * 10 - 5, Math.random() * 10 - 5, Math.random() * 10 - 5);
      scene.add(light);
      state.lights.push(light);
      state.helpers.push(lightHelper);
    }
    console.log(state);
  });
};

export const MENU = {
  initMenu,
};
