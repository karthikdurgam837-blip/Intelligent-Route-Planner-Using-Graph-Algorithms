import React, { useState, useEffect, useRef } from 'react';
import { MapNode, MapEdge, LiveEdgeState } from '../types';
import { getEdgeId } from '../graph-data';
import { Play, RotateCcw, AlertTriangle, HelpCircle, TrafficCone, ShieldAlert } from 'lucide-react';

interface MapVisualizerProps {
  nodes: MapNode[];
  edges: MapEdge[];
  sourceId: string;
  destinationId: string;
  onSelectSource: (id: string) => void;
  onSelectDestination: (id: string) => void;
  liveStates: { [edgeId: string]: LiveEdgeState };
  onToggleEdgeTraffic: (edgeId: string) => void;
  onToggleEdgeClosure: (edgeId: string) => void;
  shortestPath: string[];
  activeStepNodes: {
    activeNodeId: string | null;
    visitedNodeIds: string[];
    queuedNodeIds: string[];
    highlightedEdgeId: string | null;
  } | null;
  isSimulatingTravel: boolean;
  onFinishTravelSimulation: () => void;
  weights: { tollWeight: number; distanceWeight: number; timeWeight: number; turnPenaltySec: number };
}

export default function MapVisualizer({
  nodes,
  edges,
  sourceId,
  destinationId,
  onSelectSource,
  onSelectDestination,
  liveStates,
  onToggleEdgeTraffic,
  onToggleEdgeClosure,
  shortestPath,
  activeStepNodes,
  isSimulatingTravel,
  onFinishTravelSimulation,
  weights,
}: MapVisualizerProps) {
  // Simulating travel state
  const [carCoords, setCarCoords] = useState<{ x: number; y: number } | null>(null);
  const [carPathIndex, setCarPathIndex] = useState<number>(0);
  const simulationTimer = useRef<number | null>(null);

  // Stop simulation if shortest path changes or reset
  useEffect(() => {
    if (!isSimulatingTravel) {
      if (simulationTimer.current) {
        clearInterval(simulationTimer.current);
        simulationTimer.current = null;
      }
      setCarCoords(null);
      setCarPathIndex(0);
    } else {
      startCarSimulation();
    }
    return () => {
      if (simulationTimer.current) clearInterval(simulationTimer.current);
    };
  }, [isSimulatingTravel, shortestPath]);

  const startCarSimulation = () => {
    if (shortestPath.length < 2) {
      onFinishTravelSimulation();
      return;
    }

    setCarPathIndex(0);
    const firstNode = nodes.find(n => n.id === shortestPath[0]);
    if (firstNode) {
      setCarCoords({ x: firstNode.x, y: firstNode.y });
    }

    let currentIndex = 0;
    if (simulationTimer.current) clearInterval(simulationTimer.current);

    simulationTimer.current = window.setInterval(() => {
      currentIndex += 1;
      if (currentIndex >= shortestPath.length) {
        if (simulationTimer.current) {
          clearInterval(simulationTimer.current);
          simulationTimer.current = null;
        }
        onFinishTravelSimulation();
        return;
      }

      const nextNode = nodes.find(n => n.id === shortestPath[currentIndex]);
      if (nextNode) {
        setCarPathIndex(currentIndex);
        setCarCoords({ x: nextNode.x, y: nextNode.y });
      }
    }, 700); // 700ms step-by-step driving interval
  };

  // Determine node visual state
  const getNodeColor = (nodeId: string) => {
    if (nodeId === sourceId) return '#3b82f6'; // Bright Blue for Start
    if (nodeId === destinationId) return '#f43f5e'; // Rose Pink for Destination
    
    // If we have step playback states active, use them
    if (activeStepNodes) {
      if (nodeId === activeStepNodes.activeNodeId) return '#fbbf24'; // Golden active expander
      if (activeStepNodes.visitedNodeIds.includes(nodeId)) return '#10b981'; // Emerald visited
      if (activeStepNodes.queuedNodeIds.includes(nodeId)) return '#818cf8'; // Indigo queue/frontier
    } else {
      // Idle shortest path highlights
      if (shortestPath.includes(nodeId)) return '#5e60ce'; // Purple route node
    }

    return '#475569'; // Standard slate node
  };

  const getNodeBorder = (nodeId: string) => {
    if (nodeId === sourceId) return 'rgba(59, 130, 246, 0.4)';
    if (nodeId === destinationId) return 'rgba(244, 63, 94, 0.4)';
    if (activeStepNodes && nodeId === activeStepNodes.activeNodeId) return 'rgba(251, 191, 36, 0.6)';
    return 'rgba(255, 255, 255, 0.1)';
  };

  // Determine edge visual properties
  const getEdgeStyle = (edge: MapEdge) => {
    const liveState = liveStates[edge.id] || { traffic_factor: 1.0, is_closed: false };
    const stepHighlighted = activeStepNodes?.highlightedEdgeId === edge.id;
    
    // Check if the edge is part of the final shortest path
    let isPathEdge = false;
    if (!activeStepNodes && shortestPath.length > 2) {
      for (let i = 0; i < shortestPath.length - 1; i++) {
        if (
          (shortestPath[i] === edge.u && shortestPath[i + 1] === edge.v) ||
          (!edge.one_way && shortestPath[i] === edge.v && shortestPath[i + 1] === edge.u)
        ) {
          isPathEdge = true;
          break;
        }
      }
    }

    let color = '#334155'; // Default dark grid lines
    let width = 3;
    let dasharray = undefined;

    if (liveState.is_closed) {
      color = '#ef4444'; // Closed road
      width = 3.5;
      dasharray = '5,5';
    } else if (stepHighlighted) {
      color = '#eab308'; // Active inspection orange/golden
      width = 5;
    } else if (isPathEdge) {
      color = '#6366f1'; // Glowing royal indigo route highlight
      width = 5.5;
    } else {
      // Traffic colors
      if (liveState.traffic_factor >= 2.5) {
        color = '#dc2626'; // Heavy dynamic congestion
        width = 4;
      } else if (liveState.traffic_factor >= 1.5) {
        color = '#b45309'; // Moderate congestion
        width = 3.5;
      } else if (edge.road_class === 'highway') {
        color = '#4b5563'; // Major expressway lines
        width = 4.5;
      } else if (edge.road_class === 'primary') {
        color = '#374151'; // Primary conduit lines
        width = 3.5;
      } else if (edge.road_class === 'link') {
        color = '#1e293b';
        width = 2.5;
        dasharray = '3,3';
      }
    }

    return { color, width, dasharray, isPathEdge };
  };

  // Context values
  const getTrafficStatusText = (f: number) => {
    if (f >= 2.5) return 'Severe Jam (30% Speed)';
    if (f >= 1.5) return 'Busy Traffic (60% Speed)';
    return 'Free Flow (100% Speed)';
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col h-full relative font-sans">
      {/* Header and Quick Legend */}
      <div className="flex flex-wrap justify-between items-center mb-3 gap-2">
        <div>
          <h3 className="text-white font-semibold text-sm flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Urban Telematics Engine Loop
          </h3>
          <p className="text-xs text-slate-400">
            Click nodes to toggle Start/Target. Click roads to apply traffic or close.
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2 text-[10px]">
          <span className="flex items-center gap-1 text-slate-300 bg-slate-800 px-1.5 py-0.5 rounded">
            <span className="w-2.5 h-2.5 rounded bg-blue-500 border border-blue-400"></span> Start
          </span>
          <span className="flex items-center gap-1 text-slate-300 bg-slate-800 px-1.5 py-0.5 rounded">
            <span className="w-2.5 h-2.5 rounded bg-rose-500 border border-rose-400"></span> Target
          </span>
          <span className="flex items-center gap-1 text-slate-300 bg-slate-800 px-1.5 py-0.5 rounded">
            <span className="w-2.5 h-2.5 rounded bg-amber-400 animate-pulse"></span> Expanding
          </span>
          <span className="flex items-center gap-1 text-slate-300 bg-slate-800 px-1.5 py-0.5 rounded">
            <span className="w-2.5 h-2.5 rounded bg-emerald-500"></span> Closed/Visited
          </span>
          <span className="flex items-center gap-1 text-slate-300 bg-slate-800 px-1.5 py-0.5 rounded">
            <span className="w-2.5 h-2.5 rounded bg-[#6366f1]"></span> Shortest Route
          </span>
        </div>
      </div>

      {/* Main Canvas SVG Layer */}
      <div className="flex-1 bg-slate-950 border border-slate-800 rounded-lg relative overflow-hidden select-none min-h-[360px]">
        
        {/* Subtle decorative grid lines representing spatial coordinates */}
        <div className="absolute inset-0 pointer-events-none opacity-5 bg-[linear-gradient(to_right,#334155_1px,transparent_1px),linear-gradient(to_bottom,#334155_1px,transparent_1px)] bg-[size:30px_30px]"></div>

        <svg className="w-full h-full relative" style={{ minHeight: '360px' }}>
          {/* Outermost markers for arrowheads */}
          <defs>
            <marker id="arrow" viewBox="0 0 10 10" refX="18" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#475569" className="opacity-70" />
            </marker>
            <marker id="arrow-path" viewBox="0 0 10 10" refX="18" refY="5" markerWidth="6.5" markerHeight="6.5" orient="auto-start-reverse">
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#818cf8" />
            </marker>
          </defs>

          {/* BACKGROUND ROAD EDGES */}
          {edges.map(edge => {
            const uNode = nodes.find(n => n.id === edge.u);
            const vNode = nodes.find(n => n.id === edge.v);
            if (!uNode || !vNode) return null;

            const { color, width, dasharray, isPathEdge } = getEdgeStyle(edge);
            const isClosed = liveStates[edge.id]?.is_closed;

            // Direct line vector calculations
            const x1 = `${uNode.x}%`;
            const y1 = `${uNode.y}%`;
            const x2 = `${vNode.x}%`;
            const y2 = `${vNode.y}%`;

            return (
              <g key={edge.id}>
                {/* Invisible thicker interaction buffer lines for easier clicking */}
                <line
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="transparent"
                  strokeWidth="12"
                  className="cursor-pointer hover:stroke-slate-700/20 transition-all duration-150"
                  onClick={(e) => {
                    e.stopPropagation();
                    // Left click: Toggle closure or traffic
                    if (e.shiftKey) {
                      onToggleEdgeClosure(edge.id);
                    } else {
                      onToggleEdgeTraffic(edge.id);
                    }
                  }}
                  title={`Road class: ${edge.road_class}, Distance: ${edge.distance_m}m. Click to cycle traffic, Shift+Click to close/open.`}
                />

                {/* Visible Physical Edge Line */}
                <line
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={color}
                  strokeWidth={width}
                  strokeDasharray={dasharray}
                  markerEnd={edge.one_way ? (isPathEdge ? 'url(#arrow-path)' : 'url(#arrow)') : undefined}
                  className="transition-all duration-300 pointer-events-none"
                />

                {/* Tiny Toll Indicator ($) on roads if applicable */}
                {edge.toll_cost > 0 && !isClosed && (
                  <g transform={`translate(${(uNode.x + vNode.x) / 2}, ${(uNode.y + vNode.y) / 2})`}>
                    <line x1="-3%" y1="-3%" x2="3%" y2="3%" stroke="transparent" /> {/* safeguard spacing */}
                    <circle r="6" fill="#15803d" stroke="#4ade80" strokeWidth="0.5" />
                    <text
                      textAnchor="middle"
                      dy="2"
                      fill="#ffffff"
                      fontSize="7"
                      fontWeight="bold"
                    >
                      $
                    </text>
                  </g>
                )}
              </g>
            );
          })}

          {/* ACTIVE TRAVEL SIMULATION: MOVING CAR ICON */}
          {carCoords && (
            <g className="transition-all duration-500 ease-out">
              {/* Ripple Ring Effect around vehicle */}
              <circle
                cx={`${carCoords.x}%`}
                cy={`${carCoords.y}%`}
                r="18"
                fill="transparent"
                stroke="#60a5fa"
                strokeWidth="1.5"
                className="animate-ping opacity-40 pointer-events-none"
              />
              {/* Outer Glow */}
              <circle
                cx={`${carCoords.x}%`}
                cy={`${carCoords.y}%`}
                r="10"
                fill="#3b82f6"
                className="opacity-20 pointer-events-none"
              />
              {/* Vehicle Indicator */}
              <circle
                cx={`${carCoords.x}%`}
                cy={`${carCoords.y}%`}
                r="6.5"
                fill="#3b82f6"
                stroke="#ffffff"
                strokeWidth="2"
                className="shadow-lg pointer-events-none"
                filter="drop-shadow(0px 2px 4px rgba(0,0,0,0.5))"
              />
              <text
                x={`${carCoords.x}%`}
                y={`${carCoords.y}%`}
                textAnchor="middle"
                dy="2.5"
                fontSize="7"
                fontWeight="black"
                fill="#ffffff"
                className="pointer-events-none select-none"
              >
                🚗
              </text>
            </g>
          )}

          {/* ACTIVE NODES LAYER */}
          {nodes.map(node => {
            const isStart = node.id === sourceId;
            const isTarget = node.id === destinationId;
            const nodeCol = getNodeColor(node.id);
            const ringCol = getNodeBorder(node.id);
            const isEdgeActive = activeStepNodes?.activeNodeId === node.id;

            return (
              <g key={node.id} className="cursor-pointer select-none">
                {/* Active expansion ripple pulse */}
                {isEdgeActive && (
                  <circle
                    cx={`${node.x}%`}
                    cy={`${node.y}%`}
                    r="16"
                    fill="transparent"
                    stroke="#fbbf24"
                    strokeWidth="2"
                    className="animate-ping opacity-60"
                  />
                )}

                {/* Hover Buffer & Outer border ring */}
                <circle
                  cx={`${node.x}%`}
                  cy={`${node.y}%`}
                  r="12"
                  fill="transparent"
                  stroke={ringCol}
                  strokeWidth="2"
                  className="hover:stroke-white/40 transition-all duration-150"
                  onClick={() => {
                    if (isStart) return; // avoid duplicate
                    if (isTarget) {
                      // Clicked target, toggle so we select start or something else
                      onSelectSource(node.id);
                    } else {
                      // Normal toggle: sets start first, next node clicked (which isn't start) becomes target!
                      if (!sourceId || (sourceId && destinationId)) {
                        onSelectSource(node.id);
                      } else {
                        onSelectDestination(node.id);
                      }
                    }
                  }}
                />

                {/* Inner Core Solid Circle */}
                <circle
                  cx={`${node.x}%`}
                  cy={`${node.y}%`}
                  r={isStart || isTarget ? '7.5' : '5'}
                  fill={nodeCol}
                  stroke="#1e293b"
                  strokeWidth="1.5"
                />

                {/* Node Label tag */}
                <g transform={`translate(${node.x}%, ${node.y}%)`}>
                  <rect
                    x="-9"
                    y="10"
                    width="18"
                    height="9"
                    rx="1.5"
                    fill="#0f172a"
                    stroke="#334155"
                    strokeWidth="0.5"
                    opacity="0.85"
                  />
                  <text
                    x="0"
                    y="16.5"
                    textAnchor="middle"
                    fill="#f1f5f9"
                    fontSize="6"
                    fontWeight="bold"
                    fontFamily="monospace"
                  >
                    {node.label}
                  </text>
                </g>
              </g>
            );
          })}
        </svg>

        {/* Dynamic interactive pop-up overlay */}
        {isSimulatingTravel && (
          <div className="absolute top-2 left-2 bg-slate-900/95 border border-blue-500/30 px-3 py-1.5 rounded shadow text-white flex items-center gap-2 text-xs">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse"></span>
            <span>Simulating drive on shortest route: Node <b>{shortestPath[carPathIndex]}</b> selected.</span>
          </div>
        )}
      </div>

      {/* Manual Interface Keys instruction */}
      <div className="bg-slate-950/80 border border-slate-800 p-2.5 rounded-lg mt-3 text-xs text-slate-300 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        <div className="flex items-center gap-2">
          <TrafficCone className="w-4 h-4 text-amber-500 flex-shrink-0" />
          <span><b>Click Roads</b> to cycle through Traffic Densities (increases time cost).</span>
        </div>
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-red-500 flex-shrink-0" />
          <span><b>Shift + Click Roads</b> to Close/De-authorize lines completely.</span>
        </div>
        <div className="flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-blue-400 flex-shrink-0" />
          <span><b>Hover roads</b> to inspect limits, standard speeds & indices.</span>
        </div>
      </div>
    </div>
  );
}
