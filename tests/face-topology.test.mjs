import assert from 'node:assert/strict';
import { test } from 'node:test';
import { BoxGeometry, BufferGeometry, BufferGeometryLoader, Float32BufferAttribute, PlaneGeometry, Vector3 } from 'three';
import { describeFace, extrudeFace, logicalFaces, triangleVertices } from '../src/FaceTopology.mjs';
import { fbxMeshKey, VertexTopology } from '../src/VertexTopology.mjs';

function extrudeFirst(geometry, distance) {
  const topology = new VertexTopology(geometry);
  const faces = logicalFaces(geometry);
  const face = faces[0];
  const description = describeFace(geometry, topology, faces, face);
  return extrudeFace(geometry, faces, face, description, distance);
}

function edgeCounts(geometry) {
  const topology = new VertexTopology(geometry);
  const byIndex = [];
  topology.groups.forEach((group, vertex) => group.forEach((index) => { byIndex[index] = vertex; }));
  const edges = new Map();
  logicalFaces(geometry).forEach((_, triangle) => {
    const indices = triangleVertices(geometry, triangle).map((index) => byIndex[index]);
    indices.forEach((from, i) => {
      const to = indices[(i + 1) % 3];
      const key = from < to ? `${from},${to}` : `${to},${from}`;
      if (!edges.has(key)) edges.set(key, []);
      edges.get(key).push(from < to ? 1 : -1);
    });
  });
  return [...edges.values()];
}

test('extrudes a logical cube face into a closed oriented surface without an interior cap', () => {
  const cube = new BoxGeometry();
  const faces = logicalFaces(cube);
  assert.equal(new Set(faces).size, 6);
  assert.equal(faces[0], faces[1]);

  assert.equal(extrudeFirst(cube, 0), null);
  assert.equal(extrudeFirst(cube, Number.MIN_VALUE), null);
  assert.equal(extrudeFirst(cube, Number.MAX_VALUE), null);
  const result = extrudeFirst(cube, 2);
  assert.equal(cube.index.count / 3, 12);
  assert.equal(result.index.count / 3, 20);
  assert.equal(new Set(logicalFaces(result)).size, 10);
  assert.equal(new VertexTopology(result).groups.length, 12);
  assert.equal(result.boundingBox.max.x, 2.5);
  for (const uses of edgeCounts(result)) {
    assert.equal(uses.length, 2);
    assert.equal(uses[0] + uses[1], 0);
  }

  const reopened = new BufferGeometryLoader().parse(JSON.parse(JSON.stringify(result)));
  assert.deepEqual(logicalFaces(reopened), logicalFaces(result));
  const topology = new VertexTopology(reopened);
  const vertex = topology.groups.findIndex((_, i) => topology.position(reopened, i).x === 2.5);
  topology.translate(reopened, [vertex], new Vector3(1, 0, 0));
  for (const index of topology.groups[vertex]) assert.equal(reopened.attributes.position.getX(index), 3.5);
  assert.equal(new Set(logicalFaces(extrudeFirst(reopened, 1))).size, 14);
});

test('extrudes a subdivided plane as one face with four walls and an open base', () => {
  const plane = new PlaneGeometry(5, 5, 32);
  assert.equal(new Set(logicalFaces(plane)).size, 1);
  const result = extrudeFirst(plane, 0.75);
  assert.equal(new Set(logicalFaces(result)).size, 5);
  assert.equal(result.index.count / 3, 64 + 2 * 66);
  assert.equal(result.boundingBox.max.z, 0.75);
  assert.equal(edgeCounts(result).filter((uses) => uses.length === 1).length, 66);
});

test('keeps adjacent imported triangles separate and copies authored render attributes', () => {
  const geometry = new BufferGeometry();
  geometry.userData[fbxMeshKey] = true;
  geometry.setIndex([0, 1, 2, 0, 2, 3]);
  geometry.setAttribute('position', new Float32BufferAttribute([0, 0, 0, 1, 0, 0, 1, 1, 0, 0, 1, 0], 3));
  geometry.setAttribute('normal', new Float32BufferAttribute(Array(4).fill([0, 0.6, 0.8]).flat(), 3));
  geometry.setAttribute('color', new Float32BufferAttribute([1, 0, 0, 0, 1, 0, 0, 0, 1, 1, 1, 1], 3));
  const copy = new VertexTopology(geometry).editableCopy(geometry);
  assert.deepEqual(copy.toJSON().data, geometry.toJSON().data);
  assert.deepEqual(logicalFaces(copy), [0, 1]);

  const result = extrudeFirst(copy, 1);
  assert.equal(result.index.count / 3, 8);
  for (const name of ['normal', 'color']) {
    const original = geometry.getAttribute(name).array;
    const expected = [0, 1, 2, 0, 2, 3].flatMap((index) => [...original.slice(index * 3, index * 3 + 3)]);
    assert.deepEqual([...result.getAttribute(name).array.slice(0, 18)], expected);
  }
});
