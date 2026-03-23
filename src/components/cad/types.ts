export type Plane = 'xy' | 'yz' | 'xz';

export interface SketchPoint {
  id: string;
  x: number;
  y: number;
}

export interface SketchLine {
  id: string;
  p1: string; // SketchPoint id
  p2: string;
}

export interface SketchCircle {
  id: string;
  cx: number;
  cy: number;
  r: number;
  isHole?: boolean; // cut-out this circle from containing shapes
}

export interface Sketch {
  plane: Plane;
  points: SketchPoint[];
  lines: SketchLine[];
  circles: SketchCircle[];
  holeLoopSigs?: string[]; // sorted point IDs joined with ',' — identifies hole loops
}

// Ordered list of point IDs forming a closed polygon
export type ClosedLoop = string[];

export interface ExtrudeFeature {
  height: number;
  loops: ClosedLoop[];    // from closed sketch lines
  circleIds: string[];    // from sketch circles
}

export interface CadPart {
  id: string;
  name: string;
  sketch: Sketch | null;
  extrude: ExtrudeFeature | null;
}

// Instance placed in the assembly scene
export interface PlacedInstance {
  instanceId: string;
  partId: string;
  position: [number, number, number];
  rotX: number; // rotation around X axis (radians)
  links: AssemblyLink[];
}

export interface AssemblyLink {
  myEdgeId: string;
  targetInstanceId: string;
  targetEdgeId: string;
}

// Computed edge info for a part (used for assembly)
export interface EdgeInfo {
  id: string;
  kind: 'circle' | 'polygon-edge';
  metric: number;   // radius for circle, length for polygon-edge
  localY: number;   // y in part local space
  side: 'top' | 'bottom';
  cx?: number;      // circle center x
  cz?: number;      // circle center z
}
