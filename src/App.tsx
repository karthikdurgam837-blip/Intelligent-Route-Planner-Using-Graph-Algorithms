import React, { useState, useEffect, useMemo } from 'react';
import { MapNode, MapEdge, LiveEdgeState, AlgorithmType, BenchmarkMetrics, AlgorithmStep } from './types';
import { CITY_TEMPLATES, getEdgeId } from './graph-data';
import { runDijkstra, runAStar, runBfs, runDfs } from './algorithms';

import MapVisualizer from './components/MapVisualizer';
import ControlPanel from './components/ControlPanel';
import StepVisualizer from './components/StepVisualizer';
import BenchmarkPanel from './components/BenchmarkPanel';
import DevDocs from './components/DevDocs';

import { Navigation, Clock, Network, Layers, BarChart3, HelpCircle, Code, Settings } from 'lucide-react';

export default function App() {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<'playground' | 'playback' | 'benchmarks' | 'portfolio'>('playground');

  // Active City Template State
  const [currentTemplateId, setCurrentTemplateId] = useState<string>('grid-city');
  
  // Weights state for Multi-Criteria
  const [weights, setWeights] = useState({
    tollWeight: 2.0,
    distanceWeight: 1.0,
    timeWeight: 1.5,
    turnPenaltySec: 10,
  });

  // Current graph selection dataset
  const activeTemplate = useMemo(() => {
    return CITY_TEMPLATES.find(t => t.id === currentTemplateId) || CITY_TEMPLATES[0];
  }, [currentTemplateId]);

  const [nodes, setNodes] = useState<MapNode[]>(activeTemplate.nodes);
  const [edges, setEdges] = useState<MapEdge[]>(activeTemplate.edges);
  const [sourceId, setSourceId] = useState<string>(activeTemplate.defaultSource);
  const [destinationId, setDestinationId] = useState<string>(activeTemplate.defaultDestination);

  // Dynamic traffic factor and road blocks records
  const [liveStates, setLiveStates] = useState<{ [edgeId: string]: LiveEdgeState }>({});

  // Active Solver configurations
  const [objective, setObjective] = useState<'time' | 'distance' | 'money' | 'eco' | 'weighted'>('time');
  const [algorithm, setAlgorithm] = useState<AlgorithmType>('dijkstra');

  // Algorithm step index inside playback engine
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);

  // Benchmarking panel state
  const [benchmarkMetrics, setBenchmarkMetrics] = useState<BenchmarkMetrics[]>([]);
  const [isBenchmarking, setIsBenchmarking] = useState<boolean>(false);

  // Vehicle travel simulation trigger
  const [isSimulatingTravel, setIsSimulatingTravel] = useState<boolean>(false);

  // Whenever template transitions, trigger reset
  useEffect(() => {
    setNodes(activeTemplate.nodes);
    setEdges(activeTemplate.edges);
    setSourceId(activeTemplate.defaultSource);
    setDestinationId(activeTemplate.defaultDestination);
    setLiveStates({});
    setCurrentStepIndex(0);
    setBenchmarkMetrics([]);
    setIsSimulatingTravel(false);
  }, [currentTemplateId, activeTemplate]);

  // Handle traffic cycling click
  const handleToggleEdgeTraffic = (edgeId: string) => {
    setLiveStates(prev => {
      const currentState = prev[edgeId] || { traffic_factor: 1.0, is_closed: false };
      let nextFactor = 1.0;

      if (currentState.traffic_factor === 1.0) nextFactor = 1.6; // moderate delays
      else if (currentState.traffic_factor === 1.6) nextFactor = 2.8; // major delays/jams
      else nextFactor = 1.0; // reset clear

      return {
        ...prev,
        [edgeId]: {
          ...currentState,
          traffic_factor: nextFactor,
        }
      };
    });
  };

  // Handle road blockage
  const handleToggleEdgeClosure = (edgeId: string) => {
    setLiveStates(prev => {
      const currentState = prev[edgeId] || { traffic_factor: 1.0, is_closed: false };
      
      return {
        ...prev,
        [edgeId]: {
          ...currentState,
          is_closed: !currentState.is_closed,
        }
      };
    });
  };

  const handleWeightChange = (key: string, value: number) => {
    setWeights(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  // Resolve the path and step-by-step logs for the current selections
  const routeResult = useMemo(() => {
    if (!sourceId || !destinationId) return null;

    try {
      switch (algorithm) {
        case 'astar':
          return runAStar(nodes, edges, sourceId, destinationId, objective, liveStates, weights);
        case 'bfs':
          return runBfs(nodes, edges, sourceId, destinationId, liveStates);
        case 'dfs':
          return runDfs(nodes, edges, sourceId, destinationId, liveStates);
        case 'weighted':
        case 'dijkstra':
        default:
          const finalObjective = algorithm === 'weighted' ? 'weighted' : objective;
          return runDijkstra(nodes, edges, sourceId, destinationId, finalObjective, liveStates, weights);
      }
    } catch (e) {
      console.error('Error running route planner algorithm:', e);
      return null;
    }
  }, [nodes, edges, sourceId, destinationId, objective, algorithm, liveStates, weights]);

  // Fallback metrics extraction
  const metrics = useMemo(() => {
    if (!routeResult) return null;
    return {
      eta_sec: routeResult.time_sec,
      distance_m: routeResult.distance_m,
      toll_cost: routeResult.toll_cost,
    };
  }, [routeResult]);

  const shortestPath = useMemo(() => {
    return routeResult?.path || [];
  }, [routeResult]);

  const steps = useMemo(() => {
    return routeResult?.steps || [];
  }, [routeResult]);

  // Reset algorithm playback steps when steps list updates
  useEffect(() => {
    if (activeTab === 'playback') {
      setCurrentStepIndex(0);
    } else {
      // In dashboard view, keep the simulator map viewing the FULL resolved path (last index)
      setCurrentStepIndex(Math.max(0, steps.length - 1));
    }
  }, [steps, activeTab]);

  // Render nodes for MapVisualizer step highlight based on active playback index
  const activeStepNodes = useMemo(() => {
    if (activeTab !== 'playback' || steps.length === 0) return null;
    const step = steps[currentStepIndex];
    if (!step) return null;

    return {
      activeNodeId: step.activeNodeId,
      visitedNodeIds: step.visitedNodeIds,
      queuedNodeIds: step.queuedNodeIds,
      highlightedEdgeId: step.highlightedEdgeId,
    };
  }, [activeTab, steps, currentStepIndex]);

  // Clean congestion and closures handler
  const handleResetGraph = () => {
    setLiveStates({});
    setIsSimulatingTravel(false);
  };

  // Run benchmark comparative suite
  const runBenchmarkSuite = () => {
    setIsBenchmarking(true);
    
    setTimeout(() => {
      const suite: BenchmarkMetrics[] = [];
      const algs: AlgorithmType[] = ['dijkstra', 'astar', 'bfs', 'dfs'];

      let dijkstraCost = -1;

      algs.forEach(alg => {
        let res;
        try {
          if (alg === 'astar') {
            res = runAStar(nodes, edges, sourceId, destinationId, objective, liveStates, weights);
          } else if (alg === 'bfs') {
            res = runBfs(nodes, edges, sourceId, destinationId, liveStates);
          } else if (alg === 'dfs') {
            res = runDfs(nodes, edges, sourceId, destinationId, liveStates);
          } else {
            res = runDijkstra(nodes, edges, sourceId, destinationId, objective, liveStates, weights);
          }

          const pathFound = res.path.length > 0;
          if (alg === 'dijkstra') dijkstraCost = res.cost;

          let optimalityText = '100% (Optimal)';
          if (alg === 'bfs') {
            optimalityText = pathFound && dijkstraCost > 0 && res.distance_m > dijkstraCost 
              ? `${Math.round((res.distance_m / dijkstraCost) * 100)}% (Suboptimal)` 
              : 'Suboptimal';
          } else if (alg === 'dfs') {
            optimalityText = 'Highly Suboptimal';
          }

          suite.push({
            algorithm: alg === 'astar' ? 'A* Space Search' : alg === 'bfs' ? 'Breadth-First Search' : alg === 'dfs' ? 'Depth-First Search' : "Dijkstra's Shortest Path",
            nodesExpanded: res.steps.filter(s => s.activeNodeId !== null).map(s => s.activeNodeId).filter((v, i, a) => a.indexOf(v) === i).length,
            totalSteps: res.steps.length,
            pathFound,
            totalDistance_m: res.distance_m,
            totalTime_sec: res.time_sec,
            totalTolls: res.toll_cost,
            optimalityRating: pathFound ? optimalityText : 'Unreachable',
          });
        } catch (err) {
          console.error('Error running suite for', alg, err);
        }
      });

      setBenchmarkMetrics(suite);
      setIsBenchmarking(false);
    }, 400); // dynamic loading delay to feel like engine compile
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col selection:bg-indigo-500 selection:text-white">
      
      {/* Premium Header / Bar */}
      <header className="bg-slate-900 border-b border-slate-800 py-3.5 px-6 shadow-md flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Title Block */}
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-tr from-blue-600 to-indigo-600 p-2.5 rounded-xl shadow-lg shadow-indigo-900/20 text-white flex items-center justify-center">
            <Network className="w-5.5 h-5.5 text-white" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-black text-indigo-400 tracking-wider font-mono block">
              DSA Graph Algorithm Course Project
            </span>
            <h1 className="text-lg font-extrabold text-slate-50 tracking-tight flex items-center gap-2">
              Intelligent Route Planner
            </h1>
          </div>
        </div>

        {/* Tab List selectors */}
        <div className="flex bg-slate-950 p-1 border border-slate-800 rounded-xl space-x-1 font-sans">
          {[
            { id: 'playground', label: '🚗 Route Playground', icon: Navigation },
            { id: 'playback', label: '⚡ Playback debug', icon: Layers },
            { id: 'benchmarks', label: '🔬 Benchmarks', icon: BarChart3 },
            { id: 'portfolio', label: '📖 Portfolio Docs', icon: HelpCircle },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-1.5 text-xs font-semibold py-2 px-3.5 rounded-lg border outline-none transition-all cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-indigo-600 to-blue-600 border-indigo-500 text-white font-bold shadow-md shadow-indigo-950/30'
                    : 'text-slate-400 border-transparent hover:text-slate-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Status / Telemetry bar */}
        <div className="flex items-center gap-3 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 font-mono text-[10.5px]">
          <Clock className="w-4 h-4 text-emerald-400" />
          <span className="text-slate-400">Time:</span>
          <span className="font-bold text-slate-200">12:06:07 UTC</span>
        </div>

      </header>

      {/* Main Layout Area */}
      <main className="flex-1 p-5 md:p-6 lg:p-7 max-w-7xl mx-auto w-full flex flex-col">
        
        {/* Dynamic content rendering based on selected Tab */}
        <div className="flex-1 min-h-0">
          
          {/* TAB 1: Route Playground Dashboard */}
          {activeTab === 'playground' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 h-full items-stretch">
              
              {/* Left Column Config: ControlPanel */}
              <div className="lg:col-span-5 h-full">
                <ControlPanel
                  currentTemplateId={currentTemplateId}
                  onSelectTemplate={setCurrentTemplateId}
                  nodes={nodes}
                  sourceId={sourceId}
                  destinationId={destinationId}
                  onSelectSource={setSourceId}
                  onSelectDestination={setDestinationId}
                  objective={objective}
                  onChangeObjective={setObjective}
                  algorithm={algorithm}
                  onChangeAlgorithm={setAlgorithm}
                  weights={weights}
                  onChangeWeights={handleWeightChange}
                  metrics={metrics}
                  onResetGraph={handleResetGraph}
                  onStartTravelSimulation={() => setIsSimulatingTravel(true)}
                  isSimulatingTravel={isSimulatingTravel}
                  canSimulate={shortestPath.length > 1}
                />
              </div>

              {/* Right Column Map visualizer */}
              <div className="lg:col-span-7 h-full min-h-[450px]">
                <MapVisualizer
                  nodes={nodes}
                  edges={edges}
                  sourceId={sourceId}
                  destinationId={destinationId}
                  onSelectSource={setSourceId}
                  onSelectDestination={setDestinationId}
                  liveStates={liveStates}
                  onToggleEdgeTraffic={handleToggleEdgeTraffic}
                  onToggleEdgeClosure={handleToggleEdgeClosure}
                  shortestPath={shortestPath}
                  activeStepNodes={null} // final path visible immediately
                  isSimulatingTravel={isSimulatingTravel}
                  onFinishTravelSimulation={() => setIsSimulatingTravel(false)}
                  weights={weights}
                />
              </div>

            </div>
          )}

          {/* TAB 2: Step-by-Step Playback Studio */}
          {activeTab === 'playback' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 h-full items-stretch">
              
              {/* Left Column Map: Guided by play states */}
              <div className="lg:col-span-6 h-full min-h-[400px]">
                <MapVisualizer
                  nodes={nodes}
                  edges={edges}
                  sourceId={sourceId}
                  destinationId={destinationId}
                  onSelectSource={setSourceId}
                  onSelectDestination={setDestinationId}
                  liveStates={liveStates}
                  onToggleEdgeTraffic={handleToggleEdgeTraffic}
                  onToggleEdgeClosure={handleToggleEdgeClosure}
                  shortestPath={shortestPath}
                  activeStepNodes={activeStepNodes} // step highlights driven by play indices!
                  isSimulatingTravel={false} // simulation turned off during debug
                  onFinishTravelSimulation={() => {}}
                  weights={weights}
                />
              </div>

              {/* Right Column Controller: StepVisualizer */}
              <div className="lg:col-span-6 h-full">
                <StepVisualizer
                  algorithm={algorithm}
                  onChangeAlgorithm={setAlgorithm}
                  steps={steps}
                  currentStepIndex={currentStepIndex}
                  onSetStepIndex={setCurrentStepIndex}
                  objective={objective}
                />
              </div>

            </div>
          )}

          {/* TAB 3: Algorithmic Comparative Benchmarks */}
          {activeTab === 'benchmarks' && (
            <div className="h-full">
              <BenchmarkPanel
                metrics={benchmarkMetrics}
                onRunSuite={runBenchmarkSuite}
                isLoading={isBenchmarking}
              />
            </div>
          )}

          {/* TAB 4: Student Portfolio Prep FAQs & Docs */}
          {activeTab === 'portfolio' && (
            <div className="h-full">
              <DevDocs />
            </div>
          )}

        </div>

      </main>

      {/* Structured Footer / Credits */}
      <footer className="bg-slate-900 border-t border-slate-800 py-3.5 px-6 text-center text-[10.5px] text-slate-500 font-sans">
        <p>Intelligent Route Planner Using Graph Algorithms. Developed under rigorous academic DSA guidelines.</p>
        <p className="mt-1 font-mono">Completed Artifact: Graph G(V,E) | Adjacency lists | Dijkstra | A-star | Custom turn-weight bounds</p>
      </footer>

    </div>
  );
}
