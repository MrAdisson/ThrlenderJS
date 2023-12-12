import * as THREE from 'three';
import { CONFIG } from '../utils/config';
import { ThrlenderEngine } from '../ThrlenderEngine';
// import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const initMenu = () => {
  const thrlender = ThrlenderEngine.getInstance();
  const menu = document.createElement('div');
  // ID MENU
  menu.id = 'menu';
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
  menu.style.backgroundColor = '#1f1f1f';
  document.body.appendChild(menu);

  // HIDE MENU
  const hideMenuBtn = document.createElement('button');
  hideMenuBtn.innerHTML = 'HIDE MENU';
  hideMenuBtn.style.zIndex = '999';
  hideMenuBtn.style.padding = '10px';
  hideMenuBtn.style.border = '1px solid black';
  hideMenuBtn.style.borderRadius = '5px';
  hideMenuBtn.style.backgroundColor = '#1f1f1f';
  hideMenuBtn.style.color = 'white';
  hideMenuBtn.style.cursor = 'pointer';
  hideMenuBtn.addEventListener('click', () => {
    hideMenu();
  });

  menu.appendChild(hideMenuBtn);
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
    { value: 'plane', createGeometry: () => new THREE.PlaneGeometry(5, 5, 32), type: 'object' },
  ];

  const lights = [
    {
      value: 'pointLight',
      createLight: () => new THREE.PointLight(colorOption.value, 45, 100),
      type: 'light',
      createLightHelper: (light) => new THREE.PointLightHelper(light),
    },
    {
      value: 'spotLight',
      createLight: () => new THREE.SpotLight(colorOption.value, 45, 100),
      type: 'light',
      createLightHelper: (light) => new THREE.SpotLightHelper(light),
    },
    {
      value: 'directionalLight',
      createLight: () => new THREE.DirectionalLight(colorOption.value, 45),
      type: 'light',
      createLightHelper: (light) => new THREE.DirectionalLightHelper(light),
    },
    {
      value: 'ambientLight',
      createLight: () => new THREE.AmbientLight(colorOption.value, 45),
      type: 'light',
    },
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
      mesh.name = selectedObject.value;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.isSelectable = true; // CUSTOM PROPERTY
      thrlender.scene.add(mesh);
    }
    if (selectedObject?.type === 'light') {
      const light = selectedObject.createLight();
      light.position.set(0, 3, 0);
      light.name = selectedObject.value;
      light.castShadow = true;
      thrlender.scene.add(light);
      if (selectedObject.createLightHelper !== undefined) {
        const lightHelper = selectedObject.createLightHelper(light);
        lightHelper.isSelectable = true; // CUSTOM PROPERTY
        lightHelper.isLightHelper = true; // CUSTOM PROPERTY
        lightHelper.name = `${selectedObject.value}Helper`;
        thrlender.scene.add(lightHelper);
      }
    }
  });
};

const hideMenu = () => {
  const menu = document.getElementById('menu');
  menu.style.display = 'none';
  // SHOW BTN TO DISPLAY MENU BACK
  const showMenuBtn = document.createElement('button');
  showMenuBtn.innerHTML = 'SHOW MENU';
  showMenuBtn.style.position = 'absolute';
  showMenuBtn.style.top = '0';
  showMenuBtn.style.left = '0';
  showMenuBtn.style.zIndex = '999';
  showMenuBtn.style.padding = '10px';
  showMenuBtn.style.border = '1px solid black';
  showMenuBtn.style.borderRadius = '5px';
  showMenuBtn.style.backgroundColor = '#1f1f1f';
  showMenuBtn.style.color = 'white';
  showMenuBtn.style.cursor = 'pointer';
  showMenuBtn.addEventListener('click', () => {
    showMenu();
    showMenuBtn.remove();
  });
  document.body.appendChild(showMenuBtn);
};

const showMenu = () => {
  const menu = document.getElementById('menu');
  menu.style.display = 'flex';
};

export const MENU = {
  initMenu,
};
