import { BufferGeometry, Color, Float32BufferAttribute, DoubleSide, Mesh, MeshBasicMaterial, Object3D, Points, PointsMaterial, Raycaster, Vector2, Vector3 } from 'three';
import { describeFace, extrudeFace, logicalFaces, triangleVertices } from './FaceTopology.mjs';
import { VertexTopology } from './VertexTopology.mjs';

export class VertexEditSession {
  selected = new Set();
  pivot = new Object3D();
  previousPosition = new Vector3();
  selectionMode = 'vertices';
  selectedFace = undefined;
  faceDescription = null;
  preview = null;
  previewing = false;

  constructor(mesh, scene) {
    this.mesh = mesh;
    this.topology = new VertexTopology(mesh.geometry);
    this.faces = logicalFaces(mesh.geometry);
    this.faceHighlight = new Mesh(new BufferGeometry(), new MeshBasicMaterial({
      color: '#ffae49', side: DoubleSide, transparent: true, opacity: 0.45,
      depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1,
    }));
    this.faceHighlight.visible = false;
    this.faceHighlight.matrixAutoUpdate = false;
    scene.add(this.faceHighlight, this.pivot);
    this.createPoints(scene);
  }

  createPoints(scene) {
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
    scene.add(this.points);
    this.points.visible = this.selectionMode === 'vertices';
    this.syncPoints();
    this.syncColors();
  }

  dispose() {
    this.preview?.dispose();
    this.faceHighlight.removeFromParent();
    this.faceHighlight.geometry.dispose();
    this.faceHighlight.material.dispose();
    this.pivot.removeFromParent();
    this.disposePoints();
  }

  disposePoints() {
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
    this.faceHighlight.matrix.copy(this.points.matrix);
    this.faceHighlight.matrixWorldNeedsUpdate = true;
  }

  pick(x, y, bounds, camera, extend) {
    if (this.previewing) return;
    if (this.selectionMode === 'faces') {
      camera.updateMatrixWorld();
      this.mesh.updateWorldMatrix(true, false);
      const raycaster = new Raycaster();
      raycaster.setFromCamera(new Vector2(2 * x / bounds.width - 1, 1 - 2 * y / bounds.height), camera);
      const hit = raycaster.intersectObject(this.mesh, false)[0];
      this.selectedFace = hit ? this.faces[hit.faceIndex] : undefined;
      this.faceDescription = hit
        ? describeFace(this.mesh.geometry, this.topology, this.faces, this.selectedFace)
        : null;
      this.syncFaceHighlight();
      return;
    }
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

  setSelectionMode(mode) {
    if (mode === this.selectionMode) return;
    this.endPreview();
    this.selectionMode = mode;
    this.selectedFace = undefined;
    this.faceDescription = null;
    this.selected.clear();
    this.points.visible = mode === 'vertices';
    this.syncColors();
    this.syncFaceHighlight();
  }

  syncFaceHighlight() {
    this.faceHighlight.visible = this.selectedFace !== undefined;
    if (!this.faceHighlight.visible) return;
    const geometry = this.preview ?? this.mesh.geometry;
    const position = geometry.getAttribute('position');
    const points = [];
    const point = new Vector3();
    this.faces.forEach((id, triangle) => {
      if (id !== this.selectedFace) return;
      for (const index of triangleVertices(geometry, triangle)) {
        points.push(...point.fromBufferAttribute(position, index));
      }
    });
    this.faceHighlight.geometry.dispose();
    this.faceHighlight.geometry = new BufferGeometry();
    this.faceHighlight.geometry.setAttribute('position', new Float32BufferAttribute(points, 3));
  }

  get canExtrude() {
    return !!this.faceDescription?.normal.lengthSq() && !!this.faceDescription.boundary.length;
  }

  previewExtrusion(distance) {
    if (!this.canExtrude) return;
    this.previewing = true;
    this.preview?.dispose();
    this.preview = extrudeFace(this.mesh.geometry, this.faces, this.selectedFace, this.faceDescription, distance);
    this.syncFaceHighlight();
  }

  endPreview() {
    this.preview?.dispose();
    this.preview = null;
    this.previewing = false;
    this.syncFaceHighlight();
  }

  commitExtrusion() {
    if (!this.preview) return false;
    const geometry = this.preview;
    this.preview = null;
    this.previewing = false;
    this.mesh.geometry = geometry;
    this.faces = logicalFaces(geometry);
    this.topology = new VertexTopology(geometry);
    this.faceDescription = describeFace(geometry, this.topology, this.faces, this.selectedFace);
    this.disposePoints();
    this.createPoints(this.pivot.parent);
    this.syncFaceHighlight();
    return true;
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
    prepareGeometry();
    this.topology.translate(this.mesh.geometry, this.selected, delta);
    this.syncPoints();
    return true;
  }
}
