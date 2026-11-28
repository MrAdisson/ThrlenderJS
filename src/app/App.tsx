import { useEffect, useReducer, useRef, useState, type MouseEvent } from 'react';
import { Color } from 'three';
import type { ThrlenderEngine } from '../ThrlenderEngine';
import { mountEditor } from './mountEditor';
import { addItem, itemLabels, type ItemType } from './addItem';
import { ColorField, Properties } from './Properties';

const tools = [
  { value: 'translate', label: 'Move', shortcut: 'T', icon: 'M12 2v20M2 12h20M9 5l3-3 3 3M9 19l3 3 3-3M5 9l-3 3 3 3m14-6 3 3-3 3' },
  { value: 'rotate', label: 'Rotate', shortcut: 'R', icon: 'M20 11a8 8 0 1 0-2 6M20 5v6h-6' },
  { value: 'scale', label: 'Scale', shortcut: 'S', icon: 'M10 4h10v10M20 4 10 14M4 14h6v6H4z' },
  { value: 'gizmo', label: 'Gizmo', shortcut: 'Space', icon: 'M12 3v9l8 5M12 12l-8 5M9 6l3-3 3 3m3 7 2 4-4 1M6 13l-2 4 4 1' },
  { value: 'snap', label: 'Snap', icon: 'M4 4h5v9a3 3 0 0 0 6 0V4h5v9a8 8 0 0 1-16 0zM4 8h5m6 0h5' },
];

function closeMenu(menu: HTMLDetailsElement | null) {
  if (!menu) return;
  menu.open = false;
  menu.querySelector('summary')?.focus();
}

function Toggle({ label, checked, change }: {
  label: string;
  checked: boolean;
  change: (checked: boolean) => void;
}) {
  return <label className="toggle"><input type="checkbox" checked={checked}
    onChange={(event) => change(event.target.checked)} />{label}</label>;
}

function EditorControls({ engine, refresh }: { engine: ThrlenderEngine; refresh: () => void }) {
  const menus = useRef<HTMLElement>(null);
  const [inspectorOpen, setInspectorOpen] = useState(true);
  const [item, setItem] = useState<ItemType>('cube');
  const [color, setColor] = useState('#ffffff');
  useEffect(() => {
    function dismissOutside(event: PointerEvent) {
      if (event.target instanceof Node && !menus.current?.contains(event.target)) {
        const openMenu = menus.current?.querySelector<HTMLDetailsElement>('details[open]');
        if (openMenu) openMenu.open = false;
      }
    }
    function resetAddFields() {
      setItem('cube');
      setColor('#ffffff');
    }
    document.addEventListener('pointerdown', dismissOutside);
    engine.addEventListener('document-replaced', resetAddFields);
    return () => {
      document.removeEventListener('pointerdown', dismissOutside);
      engine.removeEventListener('document-replaced', resetAddFields);
    };
  }, [engine]);
  const { activeDocument, config, selectedObject, skyLight, transformSettings } = engine;
  const colorHex = (value: string) => '#' + new Color(value).getHexString();

  function setConfig<K extends keyof typeof config>(key: K, value: typeof config[K]) {
    config[key] = value;
    refresh();
  }

  function editSky(change: (light: NonNullable<typeof skyLight>) => void) {
    if (!skyLight) return;
    change(skyLight);
    engine.updateLightHelper(skyLight);
    engine.markDocumentChanged();
  }

  function command(action: () => void) {
    return (event: MouseEvent<HTMLButtonElement>) => {
      closeMenu(event.currentTarget.closest('details'));
      action();
    };
  }

  function changeTool(value: string) {
    if (value === 'gizmo') transformSettings.TRANSFORM_CONTROLS_ENABLED = !transformSettings.TRANSFORM_CONTROLS_ENABLED;
    else if (value === 'snap') transformSettings.SNAP_TO_GRID = !transformSettings.SNAP_TO_GRID;
    else transformSettings.TRANSFORM_CONTROLS_MODE = value;
    refresh();
  }

  return (
    <>
      <header className="editor-bar">
        <h1><span className="brand-mark" aria-hidden="true">◇</span> Thrlender</h1>
        <nav ref={menus} className="editor-menus" aria-label="Scene commands"
          onKeyDown={(event) => {
            if (event.key === 'Escape' && event.target instanceof Element) {
              closeMenu(event.target.closest('details[open]'));
            }
          }}
          onBlur={(event) => {
            const menu = event.target.closest<HTMLDetailsElement>('details[open]');
            if (menu && event.relatedTarget && !menu.contains(event.relatedTarget)) menu.open = false;
          }}>
          <details className="command-menu" name="scene-command">
            <summary>File</summary>
            <div className="menu-panel">
              <button onClick={command(() => engine.newScene())}>New Scene</button>
              <button onClick={command(() => engine.load())}>Open THRL</button>
              <button onClick={command(() => {
                try {
                  engine.save();
                } catch {
                  window.alert('The THRL download could not be started.');
                }
              })}>Save THRL</button>
              <button onClick={command(() => engine.loadFbx())}>Import FBX</button>
            </div>
          </details>
          <details className="command-menu" name="scene-command">
            <summary>Edit</summary>
            <div className="menu-panel">
              <button disabled={!selectedObject} onClick={command(() => {
                if (window.confirm('Delete the selected item from the scene?')) engine.removeSelectedObject();
              })}>Delete selection</button>
            </div>
          </details>
          <details className="command-menu" name="scene-command">
            <summary>Add</summary>
            <div className="menu-panel">
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
              <button className="primary" onClick={command(() => addItem(engine, item, color))}>Add to scene</button>
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
              <button disabled={!selectedObject} onClick={command(() => engine.focusSelection())}>
                Focus selection <kbd>F</kbd>
              </button>
              <Toggle label="Show inspector" checked={inspectorOpen} change={setInspectorOpen} />
              <div className="menu-section">Lighting</div>
              <Toggle label="Show light helpers" checked={config.LIGHTS_LIGHT_HELPERS_VISIBLE}
                change={(value) => setConfig('LIGHTS_LIGHT_HELPERS_VISIBLE', value)} />
              <label className="range-field">
                <span>Sky intensity <span aria-hidden="true">{(skyLight?.intensity ?? 0).toFixed(2)}</span></span>
                <input type="range" aria-label="Sky intensity" min="0" max="2" step="0.01"
                  value={skyLight?.intensity ?? 0} disabled={!skyLight}
                  onChange={(event) => editSky((light) => { light.intensity = event.currentTarget.valueAsNumber; })} />
              </label>
              <ColorField label="Sky color" value={skyLight ? '#' + skyLight.color.getHexString() : '#ffffff'} disabled={!skyLight}
                change={(value) => editSky((light) => light.color.set(value))} />
              <ColorField label="Ground color" value={skyLight ? '#' + skyLight.groundColor.getHexString() : '#333333'} disabled={!skyLight}
                change={(value) => editSky((light) => light.groundColor.set(value))} />
            </div>
          </details>
        </nav>
        <span className="scene-status" role="status">{activeDocument.dirty ? 'Unsaved changes' : ''}</span>
      </header>
      <div className="transform-tools panel" role="group" aria-label="Transform tools">
        {tools.map(({ value, label, shortcut, icon }) => (
          <button key={value} type="button" className="tool-button"
            aria-label={label}
            aria-keyshortcuts={shortcut}
            aria-pressed={value === 'gizmo' ? transformSettings.TRANSFORM_CONTROLS_ENABLED :
              value === 'snap' ? transformSettings.SNAP_TO_GRID : transformSettings.TRANSFORM_CONTROLS_MODE === value}
            onClick={() => changeTool(value)}>
            <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d={icon} />
            </svg>
            <span className="tool-tooltip" aria-hidden="true">{label}{shortcut && <> <kbd>{shortcut}</kbd></>}</span>
          </button>
        ))}
      </div>
      <aside className="properties-panel panel" hidden={!inspectorOpen} aria-labelledby="properties-heading">
        <div className="panel-heading"><h2 id="properties-heading">Inspector</h2></div>
        <div className="panel-body">
          {selectedObject
            ? <Properties key={selectedObject.uuid} object={selectedObject} refresh={engine.editSelection} />
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
