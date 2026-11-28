import assert from 'node:assert/strict';
import { test } from 'node:test';
import { BufferGeometry, BufferGeometryLoader, Float32BufferAttribute, PlaneGeometry, Vector3 } from 'three';
import { VertexTopology } from '../src/VertexTopology.mjs';

test('welds a non-indexed mesh by position and preserves vertex identity across serialization', () => {
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute([
    0, 0, 0, 1, 0, 0, 0, 1, 0,
    1, 0, 0, 0, 0, 0, 0, -1, 0,
  ], 3));
  geometry.setAttribute('uv', new Float32BufferAttribute([0, 0, 1, 0, 1, 1, 0, 0, 1, 0, 0, 1], 2));
  const topology = new VertexTopology(geometry);
  assert.deepEqual(topology.groups, [[0, 4], [1, 3], [2], [5]]);
  const copy = topology.editableCopy(geometry);
  topology.translate(copy, [0], new Vector3(1, 0, 0));
  assert.deepEqual(Array.from(copy.getAttribute('uv').array), Array.from(geometry.getAttribute('uv').array));
  assert.equal(geometry.getAttribute('position').getX(0), 0);
  assert.equal(copy.getAttribute('position').getX(0), 1);
  assert.equal(copy.getAttribute('position').getX(4), 1);

  const reopened = new BufferGeometryLoader().parse(JSON.parse(JSON.stringify(copy)));
  const reloadedTopology = new VertexTopology(reopened);
  assert.deepEqual(reloadedTopology.groups, topology.groups);
  reloadedTopology.translate(reopened, [1], new Vector3(0, 0, 2));
  assert.deepEqual([0, 4, 1, 3].map((index) => reopened.getAttribute('position').getZ(index)), [0, 0, 2, 2]);
});

test('edits a plane while retaining its index, UVs and updated bounds', () => {
  const geometry = new PlaneGeometry(5, 5, 32);
  const topology = new VertexTopology(geometry);
  assert.equal(topology.groups.length, 33 * 2);
  const copy = topology.editableCopy(geometry);
  topology.translate(copy, [0, 32], new Vector3(0, 0, 2));
  assert.deepEqual(copy.index.array, geometry.index.array);
  assert.deepEqual(copy.getAttribute('uv').array, geometry.getAttribute('uv').array);
  assert.equal(copy.boundingBox.max.z, 2);
  assert.ok(copy.boundingSphere.radius > 0);
  assert.equal(copy.getAttribute('normal').count, topology.groups.length);
  assert.equal(copy.toJSON().data.attributes.position.array[2], 2);
});
