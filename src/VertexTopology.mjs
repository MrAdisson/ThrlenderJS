import { BufferGeometry, Vector3 } from 'three';

export const topologyKey = 'thrlenderVertexGroups';
export const fbxMeshKey = 'thrlenderFbxMesh';

export function vertexEditingUnavailableReason(mesh) {
  const { geometry } = mesh;
  if (mesh.isSkinnedMesh) return 'Edit Mode is unavailable for meshes with a skeleton.';
  if (Object.values(geometry.morphAttributes).some((targets) => targets.length)) {
    return 'Edit Mode is unavailable for meshes with morph targets.';
  }
  const position = geometry.getAttribute('position');
  const corners = geometry.index?.count ?? position?.count;
  if (!mesh.isInstancedMesh && position?.itemSize === 3 && corners >= 3 && corners % 3 === 0 &&
      (geometry.type === 'BoxGeometry' || geometry.type === 'PlaneGeometry' ||
        geometry.userData[fbxMeshKey] || Array.isArray(geometry.userData[topologyKey]) ||
        // Older THRL exports contain FBXLoader's unindexed triangles without an import marker.
        (geometry.type === 'BufferGeometry' && !geometry.index))) return '';
  return 'Select a cube, plane or static FBX mesh to use Edit Mode.';
}

// Map logical vertices to all render vertices at the same local position.
export class VertexTopology {
  constructor(geometry) {
    const position = geometry.getAttribute('position');
    const groups = geometry.userData[topologyKey];
    const indices = Array.isArray(groups) ? groups.flat() : undefined;
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
