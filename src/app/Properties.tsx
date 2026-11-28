import { useState } from 'react';
import { Color, Light, Mesh, type Object3D, type Vector3 } from 'three';
import { sceneItemName } from './SceneTree';

export function ColorField({ label, value, change }: {
  label: string;
  value: string;
  change: (value: string) => void;
}) {
  return (
    <label className="color-field">
      <span>{label}</span>
      <span className="color-value">
        <span aria-hidden="true">{value.toUpperCase()}</span>
        <input type="color" aria-label={label} value={value} onChange={(event) => change(event.target.value)} />
      </span>
    </label>
  );
}

function NumberField({ label, value, change, axis }: {
  label: string;
  value: number;
  change: (value: number) => void;
  axis?: string;
}) {
  const [draft, setDraft] = useState<string>();
  return (
    <label className={axis ? 'axis-field' : 'number-field'}>
      {axis ? <span aria-hidden="true">{axis.toUpperCase()}</span> : label}
      <input
        aria-label={label}
        type="number"
        step="any"
        value={draft ?? Number(value.toFixed(6))}
        onBlur={() => setDraft(undefined)}
        onChange={(event) => {
          setDraft(event.currentTarget.value);
          if (Number.isFinite(event.currentTarget.valueAsNumber)) change(event.currentTarget.valueAsNumber);
        }}
      />
    </label>
  );
}

type TransformAxis = 'x' | 'y' | 'z';

function VectorFields({ label, vector, change }: {
  label: string;
  vector: Vector3;
  change: (axis: TransformAxis, value: number) => void;
}) {
  return (
    <fieldset>
      <legend>{label}</legend>
      <div className="vector">
        {(['x', 'y', 'z'] as const).map((axis) => (
          <NumberField key={axis} axis={axis} label={`${label} ${axis.toUpperCase()}`}
            value={vector[axis]} change={(value) => change(axis, value)} />
        ))}
      </div>
    </fieldset>
  );
}

export function Properties({ object, isSceneSky, refresh, setVisible, setTransform, showTransform }: {
  object: Object3D;
  isSceneSky: boolean;
  showTransform: boolean;
  refresh: () => void;
  setTransform: (field: 'position' | 'scale', axis: TransformAxis, value: number) => void;
  setVisible: (visible: boolean) => void;
}) {
  const light = object instanceof Light ? object : undefined;
  const material = object instanceof Mesh && !Array.isArray(object.material) ? object.material : undefined;
  const materialColor = material?.color;
  const name = sceneItemName(object);

  return (
    <>
      <div className="selection-name">{name}</div>
      <label className="type-field">Name
        <input type="text" value={object.userData.thrlenderRenamed ? object.name : name}
          onChange={(event) => {
            object.name = event.currentTarget.value;
            object.userData.thrlenderRenamed = true;
            refresh();
          }} />
      </label>
      <label className="toggle">
        <input type="checkbox" checked={object.visible} onChange={(event) => setVisible(event.currentTarget.checked)} />
        Visible
      </label>
      {showTransform && <fieldset className="property-group">
        <legend>Transform</legend>
        <VectorFields label="Position" vector={object.position} change={(axis, value) => setTransform('position', axis, value)} />
        {!light && <VectorFields label="Scale" vector={object.scale} change={(axis, value) => setTransform('scale', axis, value)} />}
      </fieldset>}
      {materialColor instanceof Color && <fieldset className="property-group">
        <legend>Material</legend>
        <ColorField label="Color" value={'#' + materialColor.getHexString()}
          change={(value) => { materialColor.set(value); refresh(); }} />
      </fieldset>}
      {isSceneSky && <p className="empty-selection">Adjust sky lighting in <strong>Scene Settings</strong>.</p>}
      {light && !isSceneSky && <fieldset className="property-group">
        <legend>Light</legend>
        <ColorField label="Color" value={'#' + light.color.getHexString()}
          change={(value) => { light.color.set(value); refresh(); }} />
        <NumberField label="Intensity" value={light.intensity}
          change={(value) => { light.intensity = value; refresh(); }} />
        {'distance' in light && typeof light.distance === 'number' &&
          <NumberField label="Distance" value={light.distance} change={(value) => { light.distance = value; refresh(); }} />}
        {'decay' in light && typeof light.decay === 'number' &&
          <NumberField label="Decay" value={light.decay} change={(value) => { light.decay = value; refresh(); }} />}
      </fieldset>}
    </>
  );
}
