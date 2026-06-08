import { MapNode, MapEdge, LiveEdgeState } from './types';

// Helper to formulate edge ID
export function getEdgeId(u: string, v: string): string {
  return `${u}_to_${v}`;
}

// Map template interface
export interface CityTemplate {
  id: string;
  name: string;
  description: string;
  nodes: MapNode[];
  edges: MapEdge[];
  defaultSource: string;
  defaultDestination: string;
}

// Template 1: Classic Grid City
const gridNodes: MapNode[] = [];
const gridEdges: MapEdge[] = [];
const n = 5;
const spacing = 20; // 0 to 100 percentage layout

// Generate 5x5 grid nodes
for (let i = 0; i < n; i++) {
  for (let j = 0; j < n; j++) {
    const id = `N${i}_${j}`;
    // Make names sound like real intersections
    const rawNames = [
      ['Avenue A & 1st St', 'Avenue A & 2nd St', 'Avenue A & 3rd St', 'Avenue A & 4th St', 'Avenue A & 5th St'],
      ['Broadway & 1st St', 'Broadway & 2nd St', 'Broadway & 3rd St', 'Broadway & 4th St', 'Broadway & 5th St'],
      ['Major Blvd & 1st St', 'Major Blvd & 2nd St', 'Major Blvd & 3rd St', 'Major Blvd & 4th St', 'Major Blvd & 5th St'],
      ['Silicon Rd & 1st St', 'Silicon Rd & 2nd St', 'Silicon Rd & 3rd St', 'Silicon Rd & 4th St', 'Silicon Rd & 5th St'],
      ['Eco Way & 1st St', 'Eco Way & 2nd St', 'Eco Way & 3rd St', 'Eco Way & 4th St', 'Eco Way & 5th St'],
    ];

    const labelNames = [
      ['N00', 'N01', 'N02', 'N03', 'N04'],
      ['N10', 'N11', 'N12', 'N13', 'N14'],
      ['N20', 'N21', 'N22', 'N23', 'N24'],
      ['N30', 'N31', 'N32', 'N33', 'N34'],
      ['N40', 'N41', 'N42', 'N43', 'N44'],
    ];

    // Coordinates mapped from 10% to 90% space
    gridNodes.push({
      id,
      name: rawNames[i]?.[j] || `Intersection ${i}-${j}`,
      x: 12 + j * 19,
      y: 12 + i * 19,
      type: i === 2 ? 'highway' : (i === 1 && j === 3 ? 'landmark' : 'residential'),
      label: labelNames[i]?.[j] || id,
    });
  }
}

// Generate edges for grid
for (let i = 0; i < n; i++) {
  for (let j = 0; j < n; j++) {
    const currentId = `N${i}_${j}`;

    // Right connection
    if (j + 1 < n) {
      const nextId = `N${i}_${j + 1}`;
      const isAvenue = i === 2; // Central avenue is a fast road with a toll
      gridEdges.push({
        id: getEdgeId(currentId, nextId),
        u: currentId,
        v: nextId,
        distance_m: 350,
        speed_kph: isAvenue ? 70 : 35,
        toll_cost: isAvenue ? 1.5 : 0,
        one_way: false,
        road_class: isAvenue ? 'primary' : 'residential',
      });
      gridEdges.push({
        id: getEdgeId(nextId, currentId),
        u: nextId,
        v: currentId,
        distance_m: 350,
        speed_kph: isAvenue ? 70 : 35,
        toll_cost: isAvenue ? 1.5 : 0,
        one_way: false,
        road_class: isAvenue ? 'primary' : 'residential',
      });
    }

    // Down connection
    if (i + 1 < n) {
      const nextId = `N${i + 1}_${j}`;
      const isCentralCross = j === 2; // Central vertical also slightly faster
      gridEdges.push({
        id: getEdgeId(currentId, nextId),
        u: currentId,
        v: nextId,
        distance_m: 300,
        speed_kph: isCentralCross ? 45 : 30,
        toll_cost: 0,
        one_way: false,
        road_class: isCentralCross ? 'primary' : 'residential',
      });
      gridEdges.push({
        id: getEdgeId(nextId, currentId),
        u: nextId,
        v: currentId,
        distance_m: 300,
        speed_kph: isCentralCross ? 45 : 30,
        toll_cost: 0,
        one_way: false,
        road_class: isCentralCross ? 'primary' : 'residential',
      });
    }
  }
}

// Add a diagonal one-way shortcut (N0_0 to N1_1 and N1_1 to N2_3)
gridEdges.push({
  id: getEdgeId('N0_0', 'N1_1'),
  u: 'N0_0',
  v: 'N1_1',
  distance_m: 420,
  speed_kph: 55,
  toll_cost: 0,
  one_way: true,
  road_class: 'link',
});
gridEdges.push({
  id: getEdgeId('N1_1', 'N2_3'),
  u: 'N1_1',
  v: 'N2_3',
  distance_m: 510,
  speed_kph: 60,
  toll_cost: 0.5,
  one_way: true,
  road_class: 'link',
});


// Template 2: Bento Hub Ring-Road Highway Layout (Irregular Graph)
const bentoNodes: MapNode[] = [
  { id: 'B_TECH', name: 'Tech Quarter Core', x: 25, y: 35, type: 'commercial', label: 'TCH' },
  { id: 'B_RES_WEST', name: 'Western Green Slopes', x: 12, y: 55, type: 'residential', label: 'WRS' },
  { id: 'B_N_GATE', name: 'North Toll Portal', x: 50, y: 15, type: 'highway', label: 'NGT' },
  { id: 'B_CENTRAL', name: 'Downtown Central Station', x: 50, y: 50, type: 'landmark', label: 'CEN' },
  { id: 'B_S_GATE', name: 'South Transit Plazas', x: 50, y: 85, type: 'highway', label: 'SGT' },
  { id: 'B_E_RIVER', name: 'River Gate East', x: 88, y: 50, type: 'landmark', label: 'RIV' },
  { id: 'B_INNOVATION', name: 'Innovation Tech Park', x: 70, y: 28, type: 'commercial', label: 'INN' },
  { id: 'B_IND_SOUTH', name: 'Aerospace Logistic Zone', x: 75, y: 72, type: 'industrial', label: 'IND' },
];

const bentoEdges: MapEdge[] = [
  // Outer Ring Road segments (high speed, some tolls)
  { id: getEdgeId('B_N_GATE', 'B_INNOVATION'), u: 'B_N_GATE', v: 'B_INNOVATION', distance_m: 1200, speed_kph: 90, toll_cost: 0, one_way: false, road_class: 'highway' },
  { id: getEdgeId('B_INNOVATION', 'B_N_GATE'), u: 'B_INNOVATION', v: 'B_N_GATE', distance_m: 1200, speed_kph: 90, toll_cost: 0, one_way: false, road_class: 'highway' },

  { id: getEdgeId('B_INNOVATION', 'B_E_RIVER'), u: 'B_INNOVATION', v: 'B_E_RIVER', distance_m: 1000, speed_kph: 90, toll_cost: 1.0, one_way: false, road_class: 'highway' },
  { id: getEdgeId('B_E_RIVER', 'B_INNOVATION'), u: 'B_E_RIVER', v: 'B_INNOVATION', distance_m: 1000, speed_kph: 90, toll_cost: 1.0, one_way: false, road_class: 'highway' },

  { id: getEdgeId('B_E_RIVER', 'B_IND_SOUTH'), u: 'B_E_RIVER', v: 'B_IND_SOUTH', distance_m: 1100, speed_kph: 80, toll_cost: 0, one_way: false, road_class: 'highway' },
  { id: getEdgeId('B_IND_SOUTH', 'B_E_RIVER'), u: 'B_IND_SOUTH', v: 'B_E_RIVER', distance_m: 1100, speed_kph: 80, toll_cost: 0, one_way: false, road_class: 'highway' },

  { id: getEdgeId('B_IND_SOUTH', 'B_S_GATE'), u: 'B_IND_SOUTH', v: 'B_S_GATE', distance_m: 1400, speed_kph: 85, toll_cost: 0, one_way: false, road_class: 'highway' },
  { id: getEdgeId('B_S_GATE', 'B_IND_SOUTH'), u: 'B_S_GATE', v: 'B_IND_SOUTH', distance_m: 1400, speed_kph: 85, toll_cost: 0, one_way: false, road_class: 'highway' },

  { id: getEdgeId('B_S_GATE', 'B_RES_WEST'), u: 'B_S_GATE', v: 'B_RES_WEST', distance_m: 1500, speed_kph: 75, toll_cost: 0, one_way: false, road_class: 'highway' },
  { id: getEdgeId('B_RES_WEST', 'B_S_GATE'), u: 'B_RES_WEST', v: 'B_S_GATE', distance_m: 1500, speed_kph: 75, toll_cost: 0, one_way: false, road_class: 'highway' },

  { id: getEdgeId('B_RES_WEST', 'B_TECH'), u: 'B_RES_WEST', v: 'B_TECH', distance_m: 900, speed_kph: 60, toll_cost: 0, one_way: false, road_class: 'highway' },
  { id: getEdgeId('B_TECH', 'B_RES_WEST'), u: 'B_TECH', v: 'B_RES_WEST', distance_m: 900, speed_kph: 60, toll_cost: 0, one_way: false, road_class: 'highway' },

  { id: getEdgeId('B_TECH', 'B_N_GATE'), u: 'B_TECH', v: 'B_N_GATE', distance_m: 1300, speed_kph: 80, toll_cost: 2.0, one_way: true, road_class: 'highway' }, // strict one way check node!

  // Arterial Streets piercing into Central Hub
  { id: getEdgeId('B_TECH', 'B_CENTRAL'), u: 'B_TECH', v: 'B_CENTRAL', distance_m: 800, speed_kph: 45, toll_cost: 0, one_way: false, road_class: 'primary' },
  { id: getEdgeId('B_CENTRAL', 'B_TECH'), u: 'B_CENTRAL', v: 'B_TECH', distance_m: 800, speed_kph: 45, toll_cost: 0, one_way: false, road_class: 'primary' },

  { id: getEdgeId('B_N_GATE', 'B_CENTRAL'), u: 'B_N_GATE', v: 'B_CENTRAL', distance_m: 1200, speed_kph: 50, toll_cost: 0, one_way: false, road_class: 'primary' },
  { id: getEdgeId('B_CENTRAL', 'B_N_GATE'), u: 'B_CENTRAL', v: 'B_N_GATE', distance_m: 1200, speed_kph: 50, toll_cost: 0, one_way: false, road_class: 'primary' },

  { id: getEdgeId('B_INNOVATION', 'B_CENTRAL'), u: 'B_INNOVATION', v: 'B_CENTRAL', distance_m: 950, speed_kph: 40, toll_cost: 0, one_way: false, road_class: 'primary' },
  { id: getEdgeId('B_CENTRAL', 'B_INNOVATION'), u: 'B_CENTRAL', v: 'B_INNOVATION', distance_m: 950, speed_kph: 40, toll_cost: 0, one_way: false, road_class: 'primary' },

  { id: getEdgeId('B_S_GATE', 'B_CENTRAL'), u: 'B_S_GATE', v: 'B_CENTRAL', distance_m: 1100, speed_kph: 50, toll_cost: 0, one_way: false, road_class: 'primary' },
  { id: getEdgeId('B_CENTRAL', 'B_S_GATE'), u: 'B_CENTRAL', v: 'B_S_GATE', distance_m: 1100, speed_kph: 50, toll_cost: 0, one_way: false, road_class: 'primary' },

  { id: getEdgeId('B_E_RIVER', 'B_CENTRAL'), u: 'B_E_RIVER', v: 'B_CENTRAL', distance_m: 1350, speed_kph: 40, toll_cost: 0, one_way: false, road_class: 'residential' },
  { id: getEdgeId('B_CENTRAL', 'B_E_RIVER'), u: 'B_CENTRAL', v: 'B_E_RIVER', distance_m: 1350, speed_kph: 40, toll_cost: 0, one_way: false, road_class: 'residential' },

  // A very speedy shortcut bridging Industrial directly to Tech Core, but with a massive $3.50 Tolled Tunnel!
  { id: getEdgeId('B_IND_SOUTH', 'B_TECH'), u: 'B_IND_SOUTH', v: 'B_TECH', distance_m: 1600, speed_kph: 110, toll_cost: 3.5, one_way: false, road_class: 'highway' },
  { id: getEdgeId('B_TECH', 'B_IND_SOUTH'), u: 'B_TECH', v: 'B_IND_SOUTH', distance_m: 1600, speed_kph: 110, toll_cost: 3.5, one_way: false, road_class: 'highway' },
];


// Template 3: One-Way Downtown Maze
const mazeNodes: MapNode[] = [
  { id: 'M_A1', name: '1st Ave & Ampere St', x: 20, y: 20, type: 'residential', label: 'A1' },
  { id: 'M_A2', name: '2nd Ave & Ampere St', x: 50, y: 20, type: 'residential', label: 'A2' },
  { id: 'M_A3', name: '3rd Ave & Ampere St', x: 80, y: 20, type: 'residential', label: 'A3' },
  { id: 'M_B1', name: '1st Ave & Bell St', x: 20, y: 50, type: 'landmark', label: 'B1' },
  { id: 'M_B2', name: '2nd Ave & Bell St', x: 50, y: 50, type: 'commercial', label: 'B2' },
  { id: 'M_B3', name: '3rd Ave & Bell St', x: 80, y: 50, type: 'landmark', label: 'B3' },
  { id: 'M_C1', name: '1st Ave & Curie St', x: 20, y: 80, type: 'residential', label: 'C1' },
  { id: 'M_C2', name: '2nd Ave & Curie St', x: 50, y: 80, type: 'residential', label: 'C2' },
  { id: 'M_C3', name: '3rd Ave & Curie St', x: 80, y: 80, type: 'residential', label: 'C3' },
];

const mazeEdges: MapEdge[] = [
  // Horizontal Rows (Strict alternates: East-bound row, West-bound row)
  // Row A runs strictly West-to-East
  { id: getEdgeId('M_A1', 'M_A2'), u: 'M_A1', v: 'M_A2', distance_m: 250, speed_kph: 45, toll_cost: 0, one_way: true, road_class: 'primary' },
  { id: getEdgeId('M_A2', 'M_A3'), u: 'M_A2', v: 'M_A3', distance_m: 250, speed_kph: 45, toll_cost: 0, one_way: true, road_class: 'primary' },
  // Row B runs East-to-West
  { id: getEdgeId('M_B3', 'M_B2'), u: 'M_B3', v: 'M_B2', distance_m: 250, speed_kph: 40, toll_cost: 0.5, one_way: true, road_class: 'primary' },
  { id: getEdgeId('M_B2', 'M_B1'), u: 'M_B2', v: 'M_B1', distance_m: 250, speed_kph: 40, toll_cost: 0, one_way: true, road_class: 'primary' },
  // Row C runs West-to-East
  { id: getEdgeId('M_C1', 'M_C2'), u: 'M_C1', v: 'M_C2', distance_m: 250, speed_kph: 35, toll_cost: 0, one_way: true, road_class: 'primary' },
  { id: getEdgeId('M_C2', 'M_C3'), u: 'M_C2', v: 'M_C3', distance_m: 250, speed_kph: 35, toll_cost: 0, one_way: true, road_class: 'primary' },

  // Vertical Columns (North-bound col, South-bound col)
  // Col 1 runs South-to-North
  { id: getEdgeId('M_C1', 'M_B1'), u: 'M_C1', v: 'M_B1', distance_m: 200, speed_kph: 35, toll_cost: 0, one_way: true, road_class: 'residential' },
  { id: getEdgeId('M_B1', 'M_A1'), u: 'M_B1', v: 'M_A1', distance_m: 200, speed_kph: 35, toll_cost: 0, one_way: true, road_class: 'residential' },
  // Col 2 runs North-to-South
  { id: getEdgeId('M_A2', 'M_B2'), u: 'M_A2', v: 'M_B2', distance_m: 200, speed_kph: 40, toll_cost: 0, one_way: true, road_class: 'residential' },
  { id: getEdgeId('M_B2', 'M_C2'), u: 'M_B2', v: 'M_C2', distance_m: 200, speed_kph: 40, toll_cost: 0, one_way: true, road_class: 'residential' },
  // Col 3 runs South-to-North
  { id: getEdgeId('M_C3', 'M_B3'), u: 'M_C3', v: 'M_B3', distance_m: 200, speed_kph: 35, toll_cost: 1.0, one_way: true, road_class: 'residential' },
  { id: getEdgeId('M_B3', 'M_A3'), u: 'M_B3', v: 'M_A3', distance_m: 200, speed_kph: 35, toll_cost: 0, one_way: true, road_class: 'residential' },

  // Add 1 fast diagonal backlink allowing loops
  { id: getEdgeId('M_B2', 'M_A1'), u: 'M_B2', v: 'M_A1', distance_m: 280, speed_kph: 50, toll_cost: 0, one_way: true, road_class: 'link' },
  { id: getEdgeId('M_C3', 'M_B2'), u: 'M_C3', v: 'M_B2', distance_m: 280, speed_kph: 50, toll_cost: 0, one_way: true, road_class: 'link' },
];

export const CITY_TEMPLATES: CityTemplate[] = [
  {
    id: 'grid-city',
    name: 'Smart Grid Metropolitan',
    description: 'A structured 5x5 urban grid containing standard routes, high-speed Central Boulevard with toll gates, and custom diagonal freeway bypass links. Perfect for comparing Dijkstra and A* heuristics.',
    nodes: gridNodes,
    edges: gridEdges,
    defaultSource: 'N0_0',
    defaultDestination: 'N4_4',
  },
  {
    id: 'bento-hub',
    name: 'Arterial Ring-Road Campus',
    description: 'An irregular ring-road highway system spanning 8 major suburban clusters. Contains a speedway bypass with heavy tolls, radial local conduits to downtown, and a complex topology testing multi-criteria routes.',
    nodes: bentoNodes,
    edges: bentoEdges,
    defaultSource: 'B_RES_WEST',
    defaultDestination: 'B_IND_SOUTH',
  },
  {
    id: 'one-way-maze',
    name: 'Grid Iron Downtown Maze',
    description: 'A densely packed 3x3 block showing one-way alternating streets, tight geometry, tolls, and extreme path limitations. Great for verifying turning restrictions and handling deadlocks.',
    nodes: mazeNodes,
    edges: mazeEdges,
    defaultSource: 'M_C1',
    defaultDestination: 'M_A3',
  },
];

// Reusable edge evaluation helpers
export function calculateBaseDurationSec(edge: MapEdge): number {
  const mps = (edge.speed_kph * 1000) / 3600; // Translate kph to m/s
  return Math.round((edge.distance_m / mps) * 10) / 10;
}

// Haversine / straight-line Euclidean distance helper
export function calculateStraightLineDistance(nodes: MapNode[], uId: string, vId: string): number {
  const u = nodes.find(n => n.id === uId);
  const v = nodes.find(n => n.id === vId);
  if (!u || !v) return 0;
  
  // Custom spatial model (treating grid percentage as physical coordinate x, y)
  // Let 1% = 100 meters
  const dx = (u.x - v.x) * 100;
  const dy = (u.y - v.y) * 100;
  return Math.sqrt(dx * dx + dy * dy);
}
