import { BufferGeometry, BufferAttribute, Vector3 } from 'three';

import { topologyKey } from './VertexTopology.mjs';

const faceKey = 'thrlenderFaces';

export function triangleVertices(geometry, triangle) {
  const offset = triangle * 3;
  return [0, 1, 2].map((i) => geometry.index?.getX(offset + i) ?? offset + i);
}

export function logicalFaces(geometry) {
  const count = (geometry.index ?? geometry.getAttribute('position')).count / 3;
  const saved = geometry.userData[faceKey];
  if (Array.isArray(saved) && saved.length === count &&
      saved.every((id) => Number.isInteger(id) && id >= 0)) return saved;

  // The primitive buffers (including older vertex edits) share render vertices
  // within each side of a cube or across the entire plane.
  const parents = [];
  const root = (triangle) => {
    while (parents[triangle] !== triangle) {
      parents[triangle] = parents[parents[triangle]];
      triangle = parents[triangle];
    }
    return triangle;
  };
  const previous = new Map();
  for (let triangle = 0; triangle < count; triangle++) {
    parents.push(triangle);
    for (const vertex of triangleVertices(geometry, triangle)) {
      if (previous.has(vertex)) parents[root(triangle)] = root(previous.get(vertex));
      previous.set(vertex, triangle);
    }
  }
  return parents.map((_, triangle) => root(triangle));
}

export function describeFace(geometry, topology, faces, face) {
  const logical = [];
  topology.groups.forEach((group, vertex) => {
    for (const index of group) logical[index] = vertex;
  });
  const boundary = new Map();
  const normal = new Vector3();
  const position = geometry.getAttribute('position');
  const a = new Vector3(), b = new Vector3(), c = new Vector3();
  faces.forEach((id, triangle) => {
    if (id !== face) return;
    const indices = triangleVertices(geometry, triangle);
    a.fromBufferAttribute(position, indices[0]);
    b.fromBufferAttribute(position, indices[1]);
    c.fromBufferAttribute(position, indices[2]);
    normal.add(b.sub(a).cross(c.sub(a)));
    indices.forEach((from, i) => {
      const to = indices[(i + 1) % 3];
      const key = [logical[from], logical[to]].sort((x, y) => x - y).join(',');
      if (boundary.has(key)) boundary.delete(key);
      else boundary.set(key, [from, to]);
    });
  });
  return { logical, normal: normal.normalize(), boundary: [...boundary.values()] };
}

export function extrudeFace(geometry, faces, face, description, distance) {
  const { logical, normal, boundary } = description;
  const result = new BufferGeometry();
  const attributes = Object.entries(geometry.attributes).filter(([name]) => name !== 'normal');
  const values = attributes.map(() => []);
  const groups = new Map();
  const base = new Map();
  const cap = new Map();
  const indices = [];
  const nextFaces = [];
  const position = geometry.getAttribute('position');
  const point = new Vector3();
  const capOffset = logical.reduce((max, vertex) => Math.max(max, vertex), -1) + 1;

  function addVertex(source, raised, uv) {
    const index = values[0].length / attributes[0][1].itemSize;
    const vertex = logical[source] + (raised ? capOffset : 0);
    if (!groups.has(vertex)) groups.set(vertex, []);
    groups.get(vertex).push(index);
    attributes.forEach(([name, attribute], i) => {
      if (name === 'position') {
        point.fromBufferAttribute(position, source);
        if (raised) point.addScaledVector(normal, distance);
        values[i].push(...point);
      } else if (name === 'uv' && uv) {
        values[i].push(...uv);
      } else {
        const start = source * attribute.itemSize;
        values[i].push(...attribute.array.subarray(start, start + attribute.itemSize));
      }
    });
    return index;
  }

  function addTriangle(vertices, id, material) {
    if (geometry.groups.length) {
      const group = result.groups.at(-1);
      if (group?.materialIndex === material) group.count += 3;
      else result.addGroup(indices.length, 3, material);
    }
    indices.push(...vertices);
    nextFaces.push(id);
  }

  let sideMaterial = 0;
  let nextId = 0;
  faces.forEach((id, triangle) => {
    const raised = id === face;
    const map = raised ? cap : base;
    const material = geometry.groups.find(({ start, count }) =>
      triangle * 3 >= start && triangle * 3 < start + count)?.materialIndex ?? 0;
    if (raised) sideMaterial = material;
    nextId = Math.max(nextId, id + 1);
    const vertices = triangleVertices(geometry, triangle).map((source) => {
      if (!map.has(source)) map.set(source, addVertex(source, raised));
      return map.get(source);
    });
    addTriangle(vertices, id, material);
  });

  // Treat consecutive collinear boundary segments as a single wall.
  const outgoing = new Map(boundary.map((edge) => [logical[edge[0]], edge]));
  const directions = new Map(boundary.map((edge) => {
    const [from, to] = edge;
    const direction = new Vector3().fromBufferAttribute(position, to)
      .sub(point.fromBufferAttribute(position, from)).normalize();
    return [edge, direction];
  }));
  const walls = new Map();
  function nextAlongWall(edge) {
    const next = outgoing.get(logical[edge[1]]);
    return next && directions.get(edge).dot(directions.get(next)) > 1 - 1e-10 ? next : undefined;
  }
  const continued = new Set(boundary.map(nextAlongWall));
  for (const start of boundary.filter((edge) => !continued.has(edge))) {
    for (let edge = start; edge && !walls.has(edge); edge = nextAlongWall(edge)) {
      walls.set(edge, nextId);
    }
    nextId++;
  }
  for (const edge of boundary) {
    const [from, to] = edge;
    const id = walls.get(edge) ?? nextId++;
    const a = addVertex(from, false, [0, 0]);
    const b = addVertex(to, false, [1, 0]);
    const c = addVertex(to, true, [1, 1]);
    const d = addVertex(from, true, [0, 1]);
    addTriangle([a, b, c], id, sideMaterial);
    addTriangle([a, c, d], id, sideMaterial);
  }

  attributes.forEach(([name, attribute], i) => {
    result.setAttribute(name, new BufferAttribute(
      new attribute.array.constructor(values[i]), attribute.itemSize, attribute.normalized,
    ));
  });
  result.setIndex(indices);
  result.userData = { ...geometry.userData, [faceKey]: nextFaces, [topologyKey]: [...groups.values()] };
  result.computeVertexNormals();
  result.computeBoundingBox();
  result.computeBoundingSphere();
  return result;
}
