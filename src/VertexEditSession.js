import { BufferGeometry, Color, Float32BufferAttribute, Object3D, Points, PointsMaterial, Vector3 } from 'three';
import { VertexTopology } from './VertexTopology.js';

export class VertexEditSession {
  selected = new Set();
  pivot = new Object3D();
  previousPosition = new Vector3();
  edited = false;

  constructor(mesh, scene) {
    this.mesh = mesh;
    this.topology = new VertexTopology(mesh.geometry);
    const size = this.topology.groups.length * 3;
    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new Float32BufferAttribute(new Float32Array(size), 3));
    geometry.setAttribute('color', new Float32BufferAttribute(new Float32Array(size), 3));
    this.points = new Points(geometry, new PointsMaterial({
      size: 7, sizeAttenuation: false, vertexColors: true, depthTest: false, depthWrite: false,
    }));
    this.points.renderOrder = 1;
    this.points.frustumCulled = false;
    this.points.matrixAutoUpdate = false;
    scene.add(this.points, this.pivot);
    this.syncPoints();
    this.syncColors();
  }

  dispose() {
    this.pivot.removeFromParent();
    this.points.removeFromParent();
    this.points.geometry.dispose();
    this.points.material.dispose();
  }

  syncPoints() {
    const position = this.points.geometry.getAttribute('position');
    const point = new Vector3();
    this.topology.groups.forEach((_, i) => {
      this.topology.position(this.mesh.geometry, i, point);
      position.setXYZ(i, point.x, point.y, point.z);
    });
    position.needsUpdate = true;
  }

  syncColors() {
    const colors = this.points.geometry.getAttribute('color');
    const selected = new Color('#ffae49');
    const unselected = new Color('#76d9ff');
    this.topology.groups.forEach((_, i) => {
      const { r, g, b } = this.selected.has(i) ? selected : unselected;
      colors.setXYZ(i, r, g, b);
    });
    colors.needsUpdate = true;
  }

  syncMatrix() {
    this.mesh.updateWorldMatrix(true, false);
    const parent = this.points.parent;
    this.points.matrix.copy(parent.matrixWorld).invert().multiply(this.mesh.matrixWorld);
    this.points.matrixWorldNeedsUpdate = true;
  }

  pick(x, y, bounds, camera, extend) {
    const point = new Vector3();
    let nearest;
    let bestDistance = 9 ** 2;
    let bestDepth = Infinity;
    camera.updateMatrixWorld();
    this.mesh.updateWorldMatrix(true, false);
    this.topology.groups.forEach((_, i) => {
      this.topology.position(this.mesh.geometry, i, point).applyMatrix4(this.mesh.matrixWorld).project(camera);
      if (Math.abs(point.z) > 1) return;
      const dx = (point.x + 1) * bounds.width / 2 - x;
      const dy = (1 - point.y) * bounds.height / 2 - y;
      const distance = dx * dx + dy * dy;
      if (distance < bestDistance || (distance === bestDistance && point.z < bestDepth)) {
        nearest = i;
        bestDistance = distance;
        bestDepth = point.z;
      }
    });
    if (!extend) this.selected.clear();
    if (nearest !== undefined) {
      if (this.selected.has(nearest)) this.selected.delete(nearest);
      else this.selected.add(nearest);
    }
    this.syncColors();
    this.syncPivot();
  }

  syncPivot() {
    if (!this.selected.size) return;
    const center = new Vector3();
    for (const vertex of this.selected) center.add(this.topology.position(this.mesh.geometry, vertex));
    center.divideScalar(this.selected.size);
    this.pivot.position.copy(this.pivot.parent.worldToLocal(this.mesh.localToWorld(center)));
    this.previousPosition.copy(this.pivot.position);
  }

  translateSelection(prepareGeometry) {
    if (this.pivot.position.equals(this.previousPosition)) return false;
    const toMesh = (point) => this.mesh.worldToLocal(this.pivot.parent.localToWorld(point.clone()));
    const delta = toMesh(this.pivot.position).sub(toMesh(this.previousPosition));
    this.previousPosition.copy(this.pivot.position);
    if (delta.lengthSq() === 0) return false;
    if (!this.edited) {
      prepareGeometry(this.topology.editableCopy(this.mesh.geometry));
      this.edited = true;
    }
    this.topology.translate(this.mesh.geometry, this.selected, delta);
    this.syncPoints();
    return true;
  }
}
