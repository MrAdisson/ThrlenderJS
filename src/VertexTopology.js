import { BufferGeometry, Vector3 } from 'three';

const topologyKey = 'thrlenderVertexGroups';

// Map logical vertices to all render vertices at the same local position.
export class VertexTopology {
  constructor(geometry) {
    const position = geometry.getAttribute('position');
    const groups = geometry.userData[topologyKey];
    const indices = groups?.flat?.();
    if (indices?.length === position.count && new Set(indices).size === position.count &&
        indices.every((index) => Number.isInteger(index) && index >= 0 && index < position.count) &&
        groups.every((group) => Array.isArray(group) && group.length)) {
      this.groups = groups;
      return;
    }

    const byPosition = new Map();
    for (let i = 0; i < position.count; i++) {
      const key = [position.getX(i), position.getY(i), position.getZ(i)].join(',');
      if (!byPosition.has(key)) byPosition.set(key, []);
      byPosition.get(key).push(i);
    }
    this.groups = [...byPosition.values()];
  }

  position(geometry, vertex, target = new Vector3()) {
    return target.fromBufferAttribute(geometry.getAttribute('position'), this.groups[vertex][0]);
  }

  editableCopy(geometry) {
    // Parameterized Three.js geometries serialize their constructor inputs rather than their edited buffers.
    const copy = new BufferGeometry().copy(geometry);
    copy.userData = { ...copy.userData, [topologyKey]: this.groups };
    return copy;
  }

  translate(geometry, vertices, delta) {
    const position = geometry.getAttribute('position');
    const point = new Vector3();
    for (const vertex of vertices) {
      this.position(geometry, vertex, point).add(delta);
      for (const index of this.groups[vertex]) position.setXYZ(index, point.x, point.y, point.z);
    }
    position.needsUpdate = true;
    geometry.computeVertexNormals();
    geometry.computeBoundingBox();
    geometry.computeBoundingSphere();
  }
}
