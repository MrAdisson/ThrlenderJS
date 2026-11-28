# Thrlender

Thrlender is a browser based 3D scene editor inspired by Blender. It uses Three.js to render and edit a scene in a single page. The interface is in English.

## Features

- Add cubes, spheres, cylinders, cones and planes, choosing their color.
- Add point, spot, directional and ambient lights.
- Select items in the viewport or in the **Scene** hierarchy. Expand imported groups to select their children.
- Move, rotate or scale the selection with the transform controls. Use **Inspector** to rename items, change visibility and edit their properties. Use **Edit** to duplicate a selected mesh or delete the selection.
- Switch a cube, plane or static FBX mesh to **Edit Mode** to move vertices or extrude a face. Select an individual imported mesh in **Scene**. Each imported triangle is selectable as a face. Meshes with a skeleton or morph targets can be imported and stay in **Object Mode**. Edited geometry is saved with the THRL scene.
- Orbit around the scene with the camera controls. Adjust the grid, axes and wireframe display in **View**. Use **Snap** in the transform toolbar to toggle snapping and **Move snap step** in **View** to choose the move increment. Adjust the built-in sky light in **Scene Settings**.
- Create a new scene, save it by downloading a `.thrl` file, or open a local `.thrl` file. New Scene and Open THRL ask before discarding unsaved changes. Names, visibility and sky lighting are saved with the scene.
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

With Node.js 20 or newer, run `npm test` to check the bundles and editor behavior. The editor tests use an existing Chromium installation. Set `CHROME_PATH` to its executable, or use a Chromium already installed for Playwright 1.64.1.

## Controls

- Drag with the mouse to orbit the camera; use the mouse wheel to zoom.
- Click a scene item to select it and use the on-screen gizmo to transform it.
- In **Edit Mode**, click a vertex, Shift-click to add or remove vertices, then drag the **Move** gizmo. Switch back to **Object Mode** to clear the edit selection.
- In **Edit Mode**, choose **Faces**, click a face and choose **Extrude**. Set a positive **Distance** in mesh-local units. Choose **Apply** to keep the result or **Cancel** to restore the original shape.
- `T`, `R` and `S` switch the gizmo to translate, rotate and scale.
- `Space` enables or disables the transform gizmo; `G` toggles the grid, `A` toggles the axes and `W` toggles wireframe display.
- `F` or **View → Focus selection** moves the camera to frame the selected item.
- When the viewport has focus, **Tab** selects the nearest eligible item and moves focus to the editor controls.
- Use **Edit → Undo** and **Edit → Redo** for object additions (including FBX imports), deletions, duplications, transforms, vertex moves and applied extrusions. With the viewport focused, use **Ctrl/Cmd+Z** and **Ctrl/Cmd+Shift+Z** or **Ctrl+Y** to redo. Opening or creating a scene clears its history.
- Use **Add** to choose a shape or light and its color. Use **View** to toggle the Inspector and adjust viewport settings. Open **Scene Settings** to edit the built-in sky light without selecting it.
- Use **File** to create, open or save a THRL scene or import an FBX model.

## License

The package manifest specifies ISC, but this repository does not currently include a license file.
