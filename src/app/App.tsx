import { useEffect, useReducer, useRef, useState } from 'react';
import { Color, HemisphereLight } from 'three';
import type { ThrlenderEngine } from '../ThrlenderEngine';
import { mountEditor } from './mountEditor';
import { addItem, itemLabels, type ItemType } from './addItem';
import { ColorField, Properties } from './Properties';

const modes = [
  { value: 'translate', label: 'Move', key: 'T' },
  { value: 'rotate', label: 'Rotate', key: 'R' },
  { value: 'scale', label: 'Scale', key: 'S' },
];

function Toggle({ label, checked, change }: {
  label: string;
  checked: boolean;
  change: (checked: boolean) => void;
}) {
  return <label className="toggle"><input type="checkbox" checked={checked}
    onChange={(event) => change(event.target.checked)} />{label}</label>;
}

function EditorControls({ engine, refresh }: { engine: ThrlenderEngine; refresh: () => void }) {
  const [addVisible, setAddVisible] = useState(true);
  const [item, setItem] = useState<ItemType>('cube');
  const [color, setColor] = useState('#ffffff');
  const { config, selectedObject } = engine;
  const colorHex = (value: string) => '#' + new Color(value).getHexString();

  function setConfig<K extends keyof typeof config>(key: K, value: typeof config[K]) {
    config[key] = value;
    refresh();
  }

  function editSelection() {
    engine.updateSelectedHelper();
    if (selectedObject instanceof HemisphereLight && selectedObject === engine.skyLight) {
      config.LIGHTS_SKY_LIGHT_INTENSITY = selectedObject.intensity;
      config.LIGHTS_SKY_LIGHT_COLOR = '#' + selectedObject.color.getHexString();
    }
    refresh();
  }

  return (
    <>
      <header className="editor-bar">
        <h1><span className="brand-mark" aria-hidden="true">◇</span> Thrlender</h1>
        <nav className="editor-menus" aria-label="Scene commands">
          <details className="command-menu" name="scene-command">
            <summary>File</summary>
            <div className="menu-panel">
              <button onClick={() => engine.load()}>Open THRL</button>
              <button onClick={() => engine.save()}>Save THRL</button>
              <button onClick={() => engine.loadFbx()}>Import FBX</button>
            </div>
          </details>
          <details className="command-menu" name="scene-command">
            <summary>View</summary>
            <div className="menu-panel">
              <Toggle label="Show grid" checked={config.GRID_VISIBLE} change={(value) => setConfig('GRID_VISIBLE', value)} />
              <ColorField label="Grid color" value={colorHex(config.GRID_COLOR)} change={(value) => setConfig('GRID_COLOR', value)} />
              <Toggle label="Show axes" checked={config.AXES_HELPER} change={(value) => setConfig('AXES_HELPER', value)} />
              <Toggle label="Wireframe" checked={config.WIREFRAME_MODE} change={(value) => setConfig('WIREFRAME_MODE', value)} />
              <Toggle label="Camera damping" checked={config.ENABLE_DAMPING} change={(value) => setConfig('ENABLE_DAMPING', value)} />
            </div>
          </details>
          <details className="command-menu" name="scene-command">
            <summary>Lighting</summary>
            <div className="menu-panel lighting-menu">
              <Toggle label="Show light helpers" checked={config.LIGHTS_LIGHT_HELPERS_VISIBLE}
                change={(value) => setConfig('LIGHTS_LIGHT_HELPERS_VISIBLE', value)} />
              <label className="range-field">
                <span>Sky intensity <span aria-hidden="true">{config.LIGHTS_SKY_LIGHT_INTENSITY.toFixed(2)}</span></span>
                <input type="range" aria-label="Sky intensity" min="0" max="2" step="0.01"
                  value={config.LIGHTS_SKY_LIGHT_INTENSITY} disabled={!engine.skyLight}
                  onChange={(event) => setConfig('LIGHTS_SKY_LIGHT_INTENSITY', event.currentTarget.valueAsNumber)} />
              </label>
              <ColorField label="Sky color" value={colorHex(config.LIGHTS_SKY_LIGHT_COLOR)} disabled={!engine.skyLight}
                change={(value) => setConfig('LIGHTS_SKY_LIGHT_COLOR', value)} />
              <ColorField label="Ground color" value={colorHex(config.LIGHTS_SKY_LIGHT_GROUND)} disabled={!engine.skyLight}
                change={(value) => setConfig('LIGHTS_SKY_LIGHT_GROUND', value)} />
            </div>
          </details>
        </nav>
        <div className="transform-tools" role="group" aria-label="Transform tools">
          <div className="mode-buttons">
            {modes.map(({ value, label, key }) => <button key={value}
              aria-pressed={config.TRANSFORM_CONTROLS_MODE === value}
              onClick={() => setConfig('TRANSFORM_CONTROLS_MODE', value)}>{label} <kbd>{key}</kbd></button>)}
          </div>
          <Toggle label="Gizmo" checked={config.TRANSFORM_CONTROLS_ENABLED}
            change={(value) => setConfig('TRANSFORM_CONTROLS_ENABLED', value)} />
          <Toggle label="Snap" checked={config.SNAP_TO_GRID} change={(value) => setConfig('SNAP_TO_GRID', value)} />
        </div>
      </header>
      <aside className="add-panel panel" aria-label="Add to scene">
        <div className="panel-heading">
          <h2>Add to scene</h2>
          <button className="compact" aria-expanded={addVisible} aria-controls="add-controls"
            onClick={() => setAddVisible(!addVisible)}>{addVisible ? 'Hide' : 'Show'}</button>
        </div>
        <div id="add-controls" className="panel-body" hidden={!addVisible}>
          <label className="type-field">Item type
            <select value={item} onChange={(event) => setItem(event.target.value as ItemType)}>
              <optgroup label="Shapes">
                {(['cube', 'sphere', 'cylinder', 'cone', 'plane'] as const).map((type) =>
                  <option key={type} value={type}>{itemLabels[type]}</option>)}
              </optgroup>
              <optgroup label="Lights">
                {(['pointLight', 'spotLight', 'directionalLight', 'ambientLight'] as const).map((type) =>
                  <option key={type} value={type}>{itemLabels[type]}</option>)}
              </optgroup>
            </select>
          </label>
          <ColorField label="Add color" value={color} change={setColor} />
          <button className="primary" onClick={() => addItem(engine, item, color)}>Add</button>
        </div>
      </aside>
      <aside className="properties-panel panel" aria-labelledby="properties-heading">
        <div className="panel-heading"><h2 id="properties-heading">Properties</h2></div>
        <div className="panel-body">
          {selectedObject
            ? <Properties key={selectedObject.uuid} object={selectedObject} refresh={editSelection}
                remove={() => engine.removeSelectedObject()} />
            : <p className="empty-selection">Select an item in the viewport to edit its properties.</p>}
        </div>
      </aside>
    </>
  );
}

export function App() {
  const editorHost = useRef<HTMLDivElement>(null);
  const [engine, setEngine] = useState<ThrlenderEngine>();
  const [, refresh] = useReducer((revision: number) => revision + 1, 0);

  useEffect(() => {
    const host = editorHost.current;
    if (!host) return;
    const editor = mountEditor(host, refresh);
    setEngine(editor.engine);
    return editor.dispose;
  }, []);

  return (
    <main className="editor">
      <div className="editor-host" ref={editorHost} />
      {engine && <EditorControls engine={engine} refresh={refresh} />}
    </main>
  );
}
