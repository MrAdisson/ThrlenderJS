# Thrlender

Thrlender is a browser based 3D scene editor inspired by Blender. It uses Three.js to render and edit a scene in a single page. The interface is in English.

## Features

- Add cubes, spheres, cylinders, cones and planes, choosing their color.
- Add point, spot, directional and ambient lights.
- Select scene items and move, rotate or scale them with the transform controls. Edit position, scale, color and light properties in the settings panel, or remove the selection.
- Orbit around the scene with the camera controls. Adjust the grid, axes, wireframe display, transform snapping and sky light in the settings panel.
- Save a scene by downloading a `.thrl` file, or load a `.thrl` file to replace the current scene.
- Import a local `.fbx` model into the current scene.

## Getting started

### Requirements

- Node.js
- npm
- A browser with WebGL support

### Install and run

```sh
git clone https://github.com/MrAdisson/ThrlenderJS.git
cd ThrlenderJS
npm install
npm run dev
```

Open the local URL printed by Vite in your browser. To create the static production build, run:

```sh
npm run build
```

The build is written to `dist/` and uses `/ThrlenderJS/` as its base path. `npm run deploy` builds with the production configuration and a `/` base path. Both build commands check TypeScript before bundling. Run `npm run typecheck` to check the types independently.

## Controls

- Drag with the mouse to orbit the camera; use the mouse wheel to zoom.
- Click a scene item to select it and use the on-screen gizmo to transform it.
- `T`, `R` and `S` switch the gizmo to translate, rotate and scale.
- `Space` enables or disables the transform gizmo; `G` toggles the grid, `A` toggles the axes and `W` toggles wireframe display.
- `F` points the camera controls at the selected item.
- Use **HIDE MENU** / **SHOW MENU** to collapse or restore the add menu.

## License

The package manifest specifies ISC, but this repository does not currently include a license file.
