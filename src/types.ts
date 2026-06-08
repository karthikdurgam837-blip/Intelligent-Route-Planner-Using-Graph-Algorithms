export interface MapNode {
  id: string;
  name: string;
  x: number; // 0 to 100 (percentage of map container)
  y: number; // 0 to 100 (percentage of map container)
  type: 'residential' | 'commercial' | 'highway' | 'industrial' | 'landmark';
  label: string;
}

export interface MapEdge {
  id: string;
  u: string; // Source Node ID
  v: string; // Destination Node ID
  distance_m: number;
  speed_kph: number;
  toll_cost: number; // Toll amount in $
  one_way: boolean;
  road_class: 'residential' | 'primary' | 'highway' | 'link';
}

export interface LiveEdgeState {
  traffic_factor: number; // 1.0 = Clear, 1.5 = Moderate, 2.5 = Heavy, 999.0 = Closed
  is_closed: boolean;
}

export type AlgorithmType = 'dijkstra' | 'astar' | 'bfs' | 'dfs' | 'weighted';

export interface AlgorithmStep {
  activeNodeId: string | null;
  visitedNodeIds: string[];
  queuedNodeIds: string[]; // Node IDs currently in the queue/frontier
  shortestPathTree: { [nodeId: string]: string | null }; // node -> parent node
  tentativeDistances: { [nodeId: string]: number }; // node -> distance/cost
  highlightedEdgeId: string | null; // the edge being inspected right now
  explanation: string;
  codeLineIndex: number; // which line in pseudocode is active
}

export interface RouteResult {
  path: string[];
  cost: number;
  distance_m: number;
  time_sec: number;
  toll_cost: number;
  steps: AlgorithmStep[];
}

export interface BenchmarkMetrics {
  algorithm: string;
  nodesExpanded: number;
  totalSteps: number;
  pathFound: boolean;
  totalDistance_m: number;
  totalTime_sec: number;
  totalTolls: number;
  optimalityRating: string; // e.g. "100% (Optimal)" or "115% (Suboptimal)"
}
