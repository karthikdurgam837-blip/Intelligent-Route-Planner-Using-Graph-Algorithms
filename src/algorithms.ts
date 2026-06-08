import { MapNode, MapEdge, LiveEdgeState, AlgorithmStep, RouteResult } from './types';
import { getEdgeId, calculateBaseDurationSec, calculateStraightLineDistance } from './graph-data';

// Simple priority queue custom implementation for DSA portfolio focus
export class PriorityQueue<T> {
  private elements: { item: T; priority: number }[] = [];

  enqueue(item: T, priority: number): void {
    this.elements.push({ item, priority });
    this.elements.sort((a, b) => a.priority - b.priority); // Sort so smallest priority comes first
  }

  dequeue(): T | undefined {
    return this.elements.shift()?.item;
  }

  isEmpty(): boolean {
    return this.elements.length === 0;
  }

  get items(): T[] {
    return this.elements.map(el => el.item);
  }

  get priorities(): { [key: string]: number } {
    const map: { [key: string]: number } = {};
    this.elements.forEach(el => {
      map[String(el.item)] = el.priority;
    });
    return map;
  }
}

// Calculate angle between two vectors to see if a turn occurred
// P -> U -> V
function isTurn(pNode: MapNode, uNode: MapNode, vNode: MapNode, turnThresholdRad = 0.5): boolean {
  const v1x = uNode.x - pNode.x;
  const v1y = uNode.y - pNode.y;
  const v2x = vNode.x - uNode.x;
  const v2y = vNode.y - uNode.y;

  const len1 = Math.sqrt(v1x * v1x + v1y * v1y);
  const len2 = Math.sqrt(v2x * v2x + v2y * v2y);

  if (len1 === 0 || len2 === 0) return false;

  // Dot product
  const dot = v1x * v2x + v1y * v2y;
  const cosTheta = dot / (len1 * len2);
  
  // Guard clamp
  const angle = Math.acos(Math.max(-1, Math.min(1, cosTheta)));
  
  // Angle above threshold represent a major direction change (turn)
  return angle > turnThresholdRad;
}

// Calculates edge traversal cost based on parameters
export function evaluateEdgeCost(
  edge: MapEdge,
  nodes: MapNode[], 
  previousNodeId: string | null,
  objective: 'time' | 'distance' | 'money' | 'eco' | 'weighted',
  liveStates: { [edgeId: string]: LiveEdgeState },
  weights: { tollWeight: number; distanceWeight: number; timeWeight: number; turnPenaltySec: number }
): { cost: number; actualDistance: number; actualTime: number; actualToll: number } {
  const liveState = liveStates[edge.id] || { traffic_factor: 1.0, is_closed: false };
  
  if (liveState.is_closed) {
    return { cost: 1e9, actualDistance: edge.distance_m, actualTime: 1e9, actualToll: edge.toll_cost };
  }

  const baseDuration = calculateBaseDurationSec(edge);
  const travelTimeSec = baseDuration * liveState.traffic_factor;
  const toll = edge.toll_cost;
  const dist = edge.distance_m;

  // Calculate turn penalty if previous node is available
  let turnPenalty = 0;
  if (previousNodeId) {
    const pNode = nodes.find(n => n.id === previousNodeId);
    const uNode = nodes.find(n => n.id === edge.u);
    const vNode = nodes.find(n => n.id === edge.v);
    if (pNode && uNode && vNode) {
      if (isTurn(pNode, uNode, vNode)) {
        turnPenalty = weights.turnPenaltySec;
      }
    }
  }

  const fullyAdjustedTimeSec = travelTimeSec + turnPenalty;

  let cost = 0;
  switch (objective) {
    case 'distance':
      cost = dist;
      break;
    case 'money':
      // Minimize tolls primarily, then secondary distance/time
      cost = toll * 1000 + dist * 0.1;
      break;
    case 'eco':
      // Primary class roads has lower fuel consumption factor than local roads
      const classFactor = edge.road_class === 'highway' ? 0.8 : (edge.road_class === 'primary' ? 0.9 : 1.15);
      cost = dist * classFactor + (toll * 100); 
      break;
    case 'weighted':
      cost = 
        (weights.timeWeight * fullyAdjustedTimeSec) + 
        (weights.tollWeight * toll * 300) + 
        (weights.distanceWeight * dist);
      break;
    case 'time':
    default:
      cost = fullyAdjustedTimeSec;
      break;
  }

  return {
    cost,
    actualDistance: dist,
    actualTime: fullyAdjustedTimeSec,
    actualToll: toll,
  };
}

// Pseudocode definitions to show visually on playback (0-indexed indices match codeLineIndex)
export const PSEUDOCODE_DIJKSTRA = [
  "Initialize tentativeRef = { source: 0, others: ∞ }",
  "Enqueue source into MinPriorityQueue",
  "while PriorityQueue is not empty:",
  "  Extract node U with minimum tentative cost",
  "  if U is destination, route found! Reconstruct path.",
  "  for each outgoing neighbor V of U:",
  "    Calculate edgeCost = weights + tolls + traffic + turn restrictions",
  "    newCost = tentativeCost[U] + edgeCost",
  "    if newCost < tentativeCost[V]:",
  "      Update tentativeCost[V] = newCost, set parent[V] = U",
  "      Enqueue V with newCost priority",
  "  Mark U as permanently visited (Closed set)"
];

export const PSEUDOCODE_ASTAR = [
  "Initialize tentativeRef = { source: 0, others: ∞ }",
  "Enqueue source into MinPriorityQueue with priority = heuristic(source)",
  "while PriorityQueue is not empty:",
  "  Extract node U with minimum (f_score = g_score + heuristic)",
  "  if U is destination, target reached! Reconstruct.",
  "  for each outgoing neighbor V of U:",
  "    Evaluate edgeCost with current metrics",
  "    g_score_temp = g_score[U] + edgeCost",
  "    if g_score_temp < g_score[V]:",
  "      Update g_score[V] & parent[V]",
  "      h_score = straight_line_distance(V, destination) / maxSpeed",
  "      Enqueue/Update V with priority = (g_score_temp + h_score)",
  "  Mark U as visited"
];

export const PSEUDOCODE_TRAVERSAL = [
  "Initialize frontierQueue = [ source ]",
  "frontierQueue.push(source), marked Visited",
  "while frontierQueue is not empty:",
  "  Dequeue U from queue (or Pop for DFS)",
  "  if U is destination, target found!",
  "  for each outgoing neighbor V of U:",
  "    if V has not been visited:",
  "      parent[V] = U, mark V as Visited",
  "      frontierQueue.push(V)",
  "  Mark U as completely processed"
];

// Reconstruct path array and aggregate metrics along the path
function reconstructRoute(
  startId: string,
  endId: string,
  parentTree: { [nodeId: string]: string | null },
  nodes: MapNode[],
  edges: MapEdge[],
  liveStates: { [edgeId: string]: LiveEdgeState },
  objective: 'time' | 'distance' | 'money' | 'eco' | 'weighted',
  weights: { tollWeight: number; distanceWeight: number; timeWeight: number; turnPenaltySec: number }
): { path: string[]; distance_m: number; time_sec: number; toll_cost: number } {
  const path: string[] = [];
  let current: string | null = endId;

  while (current !== null) {
    path.unshift(current);
    current = parentTree[current] || null;
  }

  // If path doesn't start at source, no path exists
  if (path[0] !== startId) {
    return { path: [], distance_m: 0, time_sec: 0, toll_cost: 0 };
  }

  let distance_m = 0;
  let time_sec = 0;
  let toll_cost = 0;

  for (let i = 0; i < path.length - 1; i++) {
    const u = path[i];
    const v = path[i + 1];
    const previous = i > 0 ? path[i - 1] : null;
    const edge = edges.find(e => e.u === u && e.v === v);
    if (edge) {
      const evaluation = evaluateEdgeCost(edge, nodes, previous, objective, liveStates, weights);
      distance_m += evaluation.actualDistance;
      time_sec += evaluation.actualTime;
      toll_cost += evaluation.actualToll;
    }
  }

  return { path, distance_m, time_sec, toll_cost };
}

// BFS Implementation with step-by-step recording
export function runBfs(
  nodes: MapNode[],
  edges: MapEdge[],
  startId: string,
  endId: string,
  liveStates: { [edgeId: string]: LiveEdgeState }
): RouteResult {
  const steps: AlgorithmStep[] = [];
  const parentTree: { [nodeId: string]: string | null } = {};
  const visited: string[] = [];
  const distances: { [nodeId: string]: number } = {};
  const queue: string[] = [];

  // Init
  nodes.forEach(n => {
    parentTree[n.id] = null;
    distances[n.id] = n.id === startId ? 0 : Infinity;
  });

  queue.push(startId);
  visited.push(startId);

  steps.push({
    activeNodeId: null,
    visitedNodeIds: [],
    queuedNodeIds: [startId],
    shortestPathTree: { ...parentTree },
    tentativeDistances: { ...distances },
    highlightedEdgeId: null,
    explanation: `Breadth-First Search: Initialized queue at local start node ${startId}.`,
    codeLineIndex: 1,
  });

  let targetFound = false;

  while (queue.length > 0) {
    const current = queue.shift()!;
    
    // Highlight extraction
    steps.push({
      activeNodeId: current,
      visitedNodeIds: [...visited],
      queuedNodeIds: [...queue],
      shortestPathTree: { ...parentTree },
      tentativeDistances: { ...distances },
      highlightedEdgeId: null,
      explanation: `Extracted node ${current} from front of Queue level.`,
      codeLineIndex: 3,
    });

    if (current === endId) {
      targetFound = true;
      steps.push({
        activeNodeId: current,
        visitedNodeIds: [...visited],
        queuedNodeIds: [...queue],
        shortestPathTree: { ...parentTree },
        tentativeDistances: { ...distances },
        highlightedEdgeId: null,
        explanation: `Destination reached! Terminating hops traversal.`,
        codeLineIndex: 4,
      });
      break;
    }

    // Get neighbors
    const outgoingEdges = edges.filter(e => e.u === current);
    for (const edge of outgoingEdges) {
      const v = edge.v;
      const liveState = liveStates[edge.id] || { traffic_factor: 1.0, is_closed: false };
      
      if (liveState.is_closed) continue;

      if (!visited.includes(v) && !queue.includes(v)) {
        parentTree[v] = current;
        distances[v] = distances[current] + 1; // hop count
        queue.push(v);
        visited.push(v);

        steps.push({
          activeNodeId: current,
          visitedNodeIds: [...visited],
          queuedNodeIds: [...queue],
          shortestPathTree: { ...parentTree },
          tentativeDistances: { ...distances },
          highlightedEdgeId: edge.id,
          explanation: `Discovered unvisited node ${v} from ${current}. Set parent, add to queue.`,
          codeLineIndex: 8,
        });
      }
    }

    steps.push({
      activeNodeId: current,
      visitedNodeIds: [...visited],
      queuedNodeIds: [...queue],
      shortestPathTree: { ...parentTree },
      tentativeDistances: { ...distances },
      highlightedEdgeId: null,
      explanation: `Finished exploring outgoing edges from node ${current}.`,
      codeLineIndex: 10,
    });
  }

  const { path, distance_m, time_sec, toll_cost } = reconstructRoute(
    startId,
    endId,
    parentTree,
    nodes,
    edges,
    liveStates,
    'distance', // simple hop-proxy is fine
    { tollWeight: 0, distanceWeight: 1, timeWeight: 0, turnPenaltySec: 0 }
  );

  return {
    path,
    cost: distances[endId] === Infinity ? -1 : distances[endId],
    distance_m,
    time_sec,
    toll_cost,
    steps,
  };
}

// DFS Implementation with step-by-step recording
export function runDfs(
  nodes: MapNode[],
  edges: MapEdge[],
  startId: string,
  endId: string,
  liveStates: { [edgeId: string]: LiveEdgeState }
): RouteResult {
  const steps: AlgorithmStep[] = [];
  const parentTree: { [nodeId: string]: string | null } = {};
  const visited: string[] = [];
  const distances: { [nodeId: string]: number } = {};
  const stack: string[] = [];

  // Init
  nodes.forEach(n => {
    parentTree[n.id] = null;
    distances[n.id] = n.id === startId ? 0 : Infinity;
  });

  stack.push(startId);

  steps.push({
    activeNodeId: null,
    visitedNodeIds: [],
    queuedNodeIds: [startId],
    shortestPathTree: { ...parentTree },
    tentativeDistances: { ...distances },
    highlightedEdgeId: null,
    explanation: `Depth-First Search: Initialized traversal stack with source node ${startId}.`,
    codeLineIndex: 1,
  });

  let targetFound = false;

  while (stack.length > 0) {
    const current = stack.pop()!;
    
    if (!visited.includes(current)) {
      visited.push(current);
    }

    steps.push({
      activeNodeId: current,
      visitedNodeIds: [...visited],
      queuedNodeIds: [...stack],
      shortestPathTree: { ...parentTree },
      tentativeDistances: { ...distances },
      highlightedEdgeId: null,
      explanation: `Popped node ${current} from DFS Stack.`,
      codeLineIndex: 3,
    });

    if (current === endId) {
      targetFound = true;
      steps.push({
        activeNodeId: current,
        visitedNodeIds: [...visited],
        queuedNodeIds: [...stack],
        shortestPathTree: { ...parentTree },
        tentativeDistances: { ...distances },
        highlightedEdgeId: null,
        explanation: `Destination reached under DFS flow!`,
        codeLineIndex: 4,
      });
      break;
    }

    // Get neighbors of current node
    const outgoingEdges = edges.filter(e => e.u === current);
    for (const edge of outgoingEdges) {
      const v = edge.v;
      const liveState = liveStates[edge.id] || { traffic_factor: 1.0, is_closed: false };
      
      if (liveState.is_closed) continue;

      if (!visited.includes(v)) {
        parentTree[v] = current;
        distances[v] = (distances[current] === Infinity ? 0 : distances[current]) + 1;
        stack.push(v);

        steps.push({
          activeNodeId: current,
          visitedNodeIds: [...visited],
          queuedNodeIds: [...stack],
          shortestPathTree: { ...parentTree },
          tentativeDistances: { ...distances },
          highlightedEdgeId: edge.id,
          explanation: `Discovered unvisited node ${v}. Push onto stack and set tentative parent to ${current}.`,
          codeLineIndex: 8,
        });
      }
    }
  }

  const { path, distance_m, time_sec, toll_cost } = reconstructRoute(
    startId,
    endId,
    parentTree,
    nodes,
    edges,
    liveStates,
    'distance',
    { tollWeight: 0, distanceWeight: 1, timeWeight: 0, turnPenaltySec: 0 }
  );

  return {
    path,
    cost: distances[endId] === Infinity ? -1 : distances[endId],
    distance_m,
    time_sec,
    toll_cost,
    steps,
  };
}

// Dijkstra Shortest Path Implementation with step recording
export function runDijkstra(
  nodes: MapNode[],
  edges: MapEdge[],
  startId: string,
  endId: string,
  objective: 'time' | 'distance' | 'money' | 'eco' | 'weighted',
  liveStates: { [edgeId: string]: LiveEdgeState },
  weights: { tollWeight: number; distanceWeight: number; timeWeight: number; turnPenaltySec: number }
): RouteResult {
  const steps: AlgorithmStep[] = [];
  const parentTree: { [nodeId: string]: string | null } = {};
  const visited: string[] = [];
  const tentativeDistances: { [nodeId: string]: number } = {};
  const pq = new PriorityQueue<string>();

  // Initialize
  nodes.forEach(node => {
    parentTree[node.id] = null;
    tentativeDistances[node.id] = node.id === startId ? 0 : Infinity;
  });

  pq.enqueue(startId, 0);

  steps.push({
    activeNodeId: null,
    visitedNodeIds: [],
    queuedNodeIds: [startId],
    shortestPathTree: { ...parentTree },
    tentativeDistances: { ...tentativeDistances },
    highlightedEdgeId: null,
    explanation: `Dijkstra: Set initial cost of ${startId} to 0, all other nodes to ∞. Enqueued start.`,
    codeLineIndex: 0,
  });

  while (!pq.isEmpty()) {
    const current = pq.dequeue()!;
    
    // Skip if visited already
    if (visited.includes(current)) continue;

    steps.push({
      activeNodeId: current,
      visitedNodeIds: [...visited],
      queuedNodeIds: [...pq.items],
      shortestPathTree: { ...parentTree },
      tentativeDistances: { ...tentativeDistances },
      highlightedEdgeId: null,
      explanation: `Extracted node ${current} with lowest tentative cost (${tentativeDistances[current].toFixed(1)}).`,
      codeLineIndex: 3,
    });

    if (current === endId) {
      steps.push({
        activeNodeId: current,
        visitedNodeIds: [...visited, current],
        queuedNodeIds: [...pq.items],
        shortestPathTree: { ...parentTree },
        tentativeDistances: { ...tentativeDistances },
        highlightedEdgeId: null,
        explanation: `Destination node ${current} is pulled from queue! Perfect path found.`,
        codeLineIndex: 4,
      });
      visited.push(current);
      break;
    }

    visited.push(current);

    // Scan neighbors
    const outgoingEdges = edges.filter(e => e.u === current);
    for (const edge of outgoingEdges) {
      const v = edge.v;
      if (visited.includes(v)) continue;

      const previousNodeId = parentTree[current];
      const evaluation = evaluateEdgeCost(edge, nodes, previousNodeId, objective, liveStates, weights);
      
      // If edge is closed, skip
      if (evaluation.cost >= 1e8) continue;

      const newCost = tentativeDistances[current] + evaluation.cost;
      
      steps.push({
        activeNodeId: current,
        visitedNodeIds: [...visited],
        queuedNodeIds: [...pq.items],
        shortestPathTree: { ...parentTree },
        tentativeDistances: { ...tentativeDistances },
        highlightedEdgeId: edge.id,
        explanation: `Inspecting road to ${v}. Segment cost: ${evaluation.cost.toFixed(1)} (Base: ${edge.distance_m}m at ${edge.speed_kph}kph).`,
        codeLineIndex: 6,
      });

      if (newCost < tentativeDistances[v]) {
        parentTree[v] = current;
        tentativeDistances[v] = newCost;
        pq.enqueue(v, newCost);

        steps.push({
          activeNodeId: current,
          visitedNodeIds: [...visited],
          queuedNodeIds: [...pq.items],
          shortestPathTree: { ...parentTree },
          tentativeDistances: { ...tentativeDistances },
          highlightedEdgeId: edge.id,
          explanation: `New cheaper path found for ${v}! Set tentative distance to ${newCost.toFixed(1)}, set parent to ${current}.`,
          codeLineIndex: 9,
        });
      }
    }

    steps.push({
      activeNodeId: current,
      visitedNodeIds: [...visited],
      queuedNodeIds: [...pq.items],
      shortestPathTree: { ...parentTree },
      tentativeDistances: { ...tentativeDistances },
      highlightedEdgeId: null,
      explanation: `Completed relaxation of neighbor edges for node ${current}. Marked visited.`,
      codeLineIndex: 11,
    });
  }

  const { path, distance_m, time_sec, toll_cost } = reconstructRoute(
    startId,
    endId,
    parentTree,
    nodes,
    edges,
    liveStates,
    objective,
    weights
  );

  return {
    path,
    cost: tentativeDistances[endId] === Infinity ? -1 : tentativeDistances[endId],
    distance_m,
    time_sec,
    toll_cost,
    steps,
  };
}

// A* Implementation with step recording and straight-line distance heuristics
export function runAStar(
  nodes: MapNode[],
  edges: MapEdge[],
  startId: string,
  endId: string,
  objective: 'time' | 'distance' | 'money' | 'eco' | 'weighted',
  liveStates: { [edgeId: string]: LiveEdgeState },
  weights: { tollWeight: number; distanceWeight: number; timeWeight: number; turnPenaltySec: number }
): RouteResult {
  const steps: AlgorithmStep[] = [];
  const parentTree: { [nodeId: string]: string | null } = {};
  const visited: string[] = [];
  const gScores: { [nodeId: string]: number } = {}; // exact path cost from start to node U
  const fScores: { [nodeId: string]: number } = {}; // gScore + heuristic of node U
  const pq = new PriorityQueue<string>();

  // Optimistic Speed represents high speed to form an admissible heuristic (doesn't overestimate cost)
  const maxVelocityKph = 110;
  const maxVelocityMps = (maxVelocityKph * 1000) / 3600;

  function heuristic(nodeId: string): number {
    const straightDist = calculateStraightLineDistance(nodes, nodeId, endId);
    
    switch (objective) {
      case 'distance':
        // Straight line distance in meters is admissible (straight line <= actual path)
        return straightDist;
      case 'money':
        // Admissible is 0 (as we might hit 0 tolls)
        return 0;
      case 'eco':
        // Admissible factor (distance is linear)
        return straightDist * 0.8;
      case 'weighted':
        // Combine weights in an optimistic manner
        const travelTimeOptimisticSec = straightDist / maxVelocityMps;
        return (weights.timeWeight * travelTimeOptimisticSec) + (weights.distanceWeight * straightDist);
      case 'time':
      default:
        // Duration = straight line distance / optimistic max speed (secs)
        return straightDist / maxVelocityMps;
    }
  }

  // Initialize scores
  nodes.forEach(node => {
    parentTree[node.id] = null;
    gScores[node.id] = node.id === startId ? 0 : Infinity;
    fScores[node.id] = node.id === startId ? heuristic(startId) : Infinity;
  });

  pq.enqueue(startId, fScores[startId]);

  steps.push({
    activeNodeId: null,
    visitedNodeIds: [],
    queuedNodeIds: [startId],
    shortestPathTree: { ...parentTree },
    tentativeDistances: { ...gScores },
    highlightedEdgeId: null,
    explanation: `A*: Set start g_score = 0. Heuristic straight-line cost to target is ${heuristic(startId).toFixed(1)}. Enqueued start with estimated total f_score = ${fScores[startId].toFixed(1)}.`,
    codeLineIndex: 0,
  });

  while (!pq.isEmpty()) {
    const current = pq.dequeue()!;

    if (visited.includes(current)) continue;

    steps.push({
      activeNodeId: current,
      visitedNodeIds: [...visited],
      queuedNodeIds: [...pq.items],
      shortestPathTree: { ...parentTree },
      tentativeDistances: { ...gScores },
      highlightedEdgeId: null,
      explanation: `Extracted node ${current} with lowest total estimated f_score (${fScores[current].toFixed(1)}). g_score (actual travel) is ${gScores[current].toFixed(1)}.`,
      codeLineIndex: 3,
    });

    if (current === endId) {
      steps.push({
        activeNodeId: current,
        visitedNodeIds: [...visited, current],
        queuedNodeIds: [...pq.items],
        shortestPathTree: { ...parentTree },
        tentativeDistances: { ...gScores },
        highlightedEdgeId: null,
        explanation: `Destination node reached! Optimality of path is guaranteed by the admissible straight-line heuristic.`,
        codeLineIndex: 4,
      });
      visited.push(current);
      break;
    }

    visited.push(current);

    // Expand neighbors
    const outgoingEdges = edges.filter(e => e.u === current);
    for (const edge of outgoingEdges) {
      const v = edge.v;
      if (visited.includes(v)) continue;

      const previousNodeId = parentTree[current];
      const evaluation = evaluateEdgeCost(edge, nodes, previousNodeId, objective, liveStates, weights);

      // closed path exit
      if (evaluation.cost >= 1e8) continue;

      const tentativeG = gScores[current] + evaluation.cost;

      steps.push({
        activeNodeId: current,
        visitedNodeIds: [...visited],
        queuedNodeIds: [...pq.items],
        shortestPathTree: { ...parentTree },
        tentativeDistances: { ...gScores },
        highlightedEdgeId: edge.id,
        explanation: `Evaluating path from ${current} to neighbor ${v}. Actual cost G increase: +${evaluation.cost.toFixed(1)}.`,
        codeLineIndex: 6,
      });

      if (tentativeG < gScores[v]) {
        parentTree[v] = current;
        gScores[v] = tentativeG;
        
        const hVal = heuristic(v);
        fScores[v] = tentativeG + hVal;
        pq.enqueue(v, fScores[v]);

        steps.push({
          activeNodeId: current,
          visitedNodeIds: [...visited],
          queuedNodeIds: [...pq.items],
          shortestPathTree: { ...parentTree },
          tentativeDistances: { ...gScores },
          highlightedEdgeId: edge.id,
          explanation: `Updated cheaper path to ${v}! g_score = ${gScores[v].toFixed(1)}. Heuristic H = ${hVal.toFixed(1)}. Estimated total F = ${fScores[v].toFixed(1)}. Enqueuing V.`,
          codeLineIndex: 11,
        });
      }
    }

    steps.push({
      activeNodeId: current,
      visitedNodeIds: [...visited],
      queuedNodeIds: [...pq.items],
      shortestPathTree: { ...parentTree },
      tentativeDistances: { ...gScores },
      highlightedEdgeId: null,
      explanation: `Completed relaxation of node ${current}'s edges. Marked node visited.`,
      codeLineIndex: 12,
    });
  }

  const { path, distance_m, time_sec, toll_cost } = reconstructRoute(
    startId,
    endId,
    parentTree,
    nodes,
    edges,
    liveStates,
    objective,
    weights
  );

  return {
    path,
    cost: gScores[endId] === Infinity ? -1 : gScores[endId],
    distance_m,
    time_sec,
    toll_cost,
    steps,
  };
}
