import { useEffect, useState } from 'react';
import type { Object3D } from 'three';
import type { ThrlenderEngine } from '../ThrlenderEngine';
import { itemLabels, type ItemType } from './addItem';

export function sceneItemName(object: Object3D) {
  if (object.userData.thrlenderRenamed) return object.name || object.type;
  if (object.userData.thrlenderSkyLight) return 'Sky light';
  if (Object.hasOwn(itemLabels, object.name)) return itemLabels[object.name as ItemType];
  return object.name || object.type;
}

export function SceneTree({ engine }: { engine: ThrlenderEngine }) {
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());
  const { activeDocument, selectedObject: selected } = engine;

  useEffect(() => setExpanded(new Set()), [activeDocument]);

  useEffect(() => {
    if (!selected?.parent || selected.parent === engine.scene) return;
    setExpanded((previous) => {
      const next = new Set(previous);
      for (let parent = selected.parent; parent && parent !== engine.scene; parent = parent.parent) {
        next.add(parent.uuid);
      }
      return next;
    });
  }, [engine, selected]);

  function toggleBranch(id: string) {
    setExpanded((previous) => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function renderItems(objects: Object3D[]) {
    return (
      <ul className="scene-items">
        {objects.map((object) => {
          const name = sceneItemName(object);
          const children = engine.sceneItems(object);
          const open = expanded.has(object.uuid);
          return (
            <li key={object.uuid}>
              <div className="scene-item">
                {children.length > 0 && <button type="button" className="scene-expand"
                  aria-label={`${open ? 'Collapse' : 'Expand'} ${name}`} aria-expanded={open}
                  onClick={() => toggleBranch(object.uuid)}>{open ? '▾' : '▸'}</button>}
                <button type="button" className="scene-select" aria-pressed={object === selected}
                  data-hidden={!engine.isVisible(object)} title={name}
                  onClick={() => engine.setSelectedObject(object)}>{name}</button>
              </div>
              {open && children.length > 0 && renderItems(children)}
            </li>
          );
        })}
      </ul>
    );
  }

  const items = engine.sceneItems();
  return (
    <section aria-labelledby="scene-heading">
      <div className="panel-heading"><h2 id="scene-heading">Scene</h2></div>
      <div className="scene-list">
        {items.length ? renderItems(items) : <p className="empty-selection">No scene items.</p>}
      </div>
    </section>
  );
}
