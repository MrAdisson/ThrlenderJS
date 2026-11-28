import { useState } from 'react';
import { Color, Light, Mesh, type Object3D, type Vector3 } from 'three';
import { itemLabels, type ItemType } from './addItem';

export function ColorField({ label, value, change, disabled }: {
  label: string;
  value: string;
  change: (value: string) => void;
  disabled?: boolean;
}) {
  return (
    <label className="color-field">
      <span>{label}</span>
      <span className="color-value">
        <span aria-hidden="true">{value.toUpperCase()}</span>
        <input type="color" aria-label={label} value={value} disabled={disabled} onChange={(event) => change(event.target.value)} />
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

function VectorFields({ label, vector, refresh }: { label: string; vector: Vector3; refresh: () => void }) {
  return (
    <fieldset>
      <legend>{label}</legend>
      <div className="vector">
        {(['x', 'y', 'z'] as const).map((axis) => (
          <NumberField key={axis} axis={axis} label={`${label} ${axis.toUpperCase()}`}
            value={vector[axis]} change={(value) => { vector[axis] = value; refresh(); }} />
        ))}
      </div>
    </fieldset>
  );
}

export function Properties({ object, refresh }: {
  object: Object3D;
  refresh: () => void;
}) {
  const light = object instanceof Light ? object : undefined;
  const material = object instanceof Mesh && !Array.isArray(object.material) ? object.material : undefined;
  const color = light?.color ?? material?.color;
  const name = itemLabels[object.name as ItemType] ?? (object.name === 'ThrlenderSkyLight' ? 'Sky light' : object.name);

  return (
    <>
      <div className="selection-name">{name || object.type}</div>
      <VectorFields label="Position" vector={object.position} refresh={refresh} />
      {!light && <VectorFields label="Scale" vector={object.scale} refresh={refresh} />}
      {color instanceof Color && <ColorField label="Color" value={'#' + color.getHexString()}
        change={(value) => { color.set(value); refresh(); }} />}
      {light && <NumberField label="Intensity" value={light.intensity}
        change={(value) => { light.intensity = value; refresh(); }} />}
      {light && 'distance' in light && typeof light.distance === 'number' &&
        <NumberField label="Distance" value={light.distance} change={(value) => { light.distance = value; refresh(); }} />}
      {light && 'decay' in light && typeof light.decay === 'number' &&
        <NumberField label="Decay" value={light.decay} change={(value) => { light.decay = value; refresh(); }} />}
    </>
  );
}
