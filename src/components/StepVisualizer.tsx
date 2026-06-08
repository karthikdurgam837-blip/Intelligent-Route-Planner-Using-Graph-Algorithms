import React, { useState, useEffect, useRef } from 'react';
import { AlgorithmType, AlgorithmStep } from '../types';
import {
  PSEUDOCODE_DIJKSTRA,
  PSEUDOCODE_ASTAR,
  PSEUDOCODE_TRAVERSAL,
} from '../algorithms';
import { Play, Pause, SkipForward, SkipBack, RotateCcw, ListCollapse, ChevronRight, Binary } from 'lucide-react';

interface StepVisualizerProps {
  algorithm: AlgorithmType;
  onChangeAlgorithm: (alg: AlgorithmType) => void;
  steps: AlgorithmStep[];
  currentStepIndex: number;
  onSetStepIndex: React.Dispatch<React.SetStateAction<number>>;
  objective: 'time' | 'distance' | 'money' | 'eco' | 'weighted';
}

export default function StepVisualizer({
  algorithm,
  onChangeAlgorithm,
  steps,
  currentStepIndex,
  onSetStepIndex,
  objective,
}: StepVisualizerProps) {
  
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(300); // 300ms default interval
  const playbackTimer = useRef<number | null>(null);

  // Pick pseudocode based on selection
  const getPseudocode = () => {
    if (algorithm === 'dijkstra' || algorithm === 'weighted') return PSEUDOCODE_DIJKSTRA;
    if (algorithm === 'astar') return PSEUDOCODE_ASTAR;
    return PSEUDOCODE_TRAVERSAL; // BFS/DFS share basic Queue/Stack logic
  };

  const getPseudocodeTitle = () => {
    if (algorithm === 'dijkstra') return 'Dijkstra Single-Objective Shortest Path';
    if (algorithm === 'astar') return `A-Star Spatial Search (H-weight: ${objective})`;
    if (algorithm === 'bfs') return 'BFS Queue Level-Order Traversal';
    if (algorithm === 'dfs') return 'DFS Stack Pathing Traversal';
    return 'Dijkstra Multi-Criteria Cost relaxation';
  };

  // Playback timer effects
  useEffect(() => {
    if (isPlaying) {
      if (playbackTimer.current) clearInterval(playbackTimer.current);

      playbackTimer.current = window.setInterval(() => {
        onSetStepIndex(prev => {
          if (prev + 1 >= steps.length) {
            setIsPlaying(false);
            if (playbackTimer.current) clearInterval(playbackTimer.current);
            return prev;
          }
          return prev + 1;
        });
      }, playbackSpeed);
    } else {
      if (playbackTimer.current) {
        clearInterval(playbackTimer.current);
        playbackTimer.current = null;
      }
    }

    return () => {
      if (playbackTimer.current) clearInterval(playbackTimer.current);
    };
  }, [isPlaying, steps, playbackSpeed]);

  const togglePlay = () => {
    // If we're at the very end, reset to index 0 on play click
    if (currentStepIndex >= steps.length - 1) {
      onSetStepIndex(0);
    }
    setIsPlaying(!isPlaying);
  };

  const handleStepForward = () => {
    setIsPlaying(false);
    if (currentStepIndex < steps.length - 1) {
      onSetStepIndex(currentStepIndex + 1);
    }
  };

  const handleStepBackward = () => {
    setIsPlaying(false);
    if (currentStepIndex > 0) {
      onSetStepIndex(currentStepIndex - 1);
    }
  };

  const handleReset = () => {
    setIsPlaying(false);
    onSetStepIndex(0);
  };

  const activeStep: AlgorithmStep | undefined = steps[currentStepIndex];
  const codeLines = getPseudocode();

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-white flex flex-col h-full font-sans">
      
      {/* Top Selector row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h4 className="text-sm font-semibold flex items-center gap-1.5 text-blue-400">
            <Binary className="w-5 h-5 text-blue-400" /> Playback Control Room
          </h4>
          <p className="text-xs text-slate-400">Step details of graph compilation inside Memory Stack.</p>
        </div>

        {/* Algorithm Type Tabs */}
        <div className="flex bg-slate-950 p-1 border border-slate-800 rounded-lg gap-1 font-sans">
          {[
            { value: 'dijkstra', label: 'Dijkstra' },
            { value: 'astar', label: 'A* Heuristic' },
            { value: 'bfs', label: 'BFS Hops' },
            { value: 'dfs', label: 'DFS Stack' },
          ].map(opt => (
            <button
              key={opt.value}
              onClick={() => {
                setIsPlaying(false);
                onChangeAlgorithm(opt.value as AlgorithmType);
              }}
              className={`text-xs py-1 px-3.5 rounded font-bold transition-all border outline-none ${
                algorithm === opt.value
                  ? 'bg-blue-600 border-blue-500 text-white font-bold shadow'
                  : 'text-slate-400 border-transparent hover:text-slate-200'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Playback Controls widget */}
      <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl mb-4 flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Buttons cluster */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleReset}
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 transition-all cursor-pointer outline-none"
            title="Reset step index to start"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          
          <button
            onClick={handleStepBackward}
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 transition-all cursor-pointer outline-none"
            title="Step back One iteration"
          >
            <SkipBack className="w-4 h-4" />
          </button>
          
          <button
            onClick={togglePlay}
            className={`p-3 rounded-xl transition-all cursor-pointer outline-none shadow-md ${
              isPlaying
                ? 'bg-amber-600 border-amber-500 text-white hover:bg-amber-700'
                : 'bg-emerald-600 border-emerald-500 text-white hover:bg-emerald-700'
            }`}
            title={isPlaying ? 'Pause compilation' : 'Auto run step-by-step'}
          >
            {isPlaying ? <Pause className="w-5 h-5 fill-white" /> : <Play className="w-5 h-5 fill-white" />}
          </button>
          
          <button
            onClick={handleStepForward}
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 transition-all cursor-pointer outline-none"
            title="Step forward One iteration"
          >
            <SkipForward className="w-4 h-4" />
          </button>
        </div>

        {/* Dynamic timeline slider */}
        <div className="flex-1 w-full flex items-center gap-3">
          <span className="text-xs text-slate-400 font-mono">
            {String(currentStepIndex).padStart(2, '0')}/{String(Math.max(0, steps.length - 1)).padStart(2, '0')}
          </span>
          <input
            type="range"
            min="0"
            max={Math.max(0, steps.length - 1)}
            value={currentStepIndex}
            onChange={(e) => {
              setIsPlaying(false);
              onSetStepIndex(parseInt(e.target.value) || 0);
            }}
            className="flex-1 accent-blue-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
          />
        </div>

        {/* Speed Dial Slider */}
        <div className="flex items-center gap-2 w-full md:w-36">
          <span className="text-[10px] uppercase text-slate-500 font-bold">Speed:</span>
          <input
            type="range"
            min="50"
            max="1200"
            step="50"
            // Inverse mathematically: closer to 50 = lower timeout = faster
            value={1250 - playbackSpeed}
            onChange={(e) => {
              const speedVal = parseInt(e.target.value);
              setPlaybackSpeed(1250 - speedVal);
            }}
            className="flex-1 accent-blue-400 h-1 bg-slate-800 rounded-lg cursor-pointer"
          />
          <span className="text-[10px] font-mono text-blue-400 font-bold w-10 text-right">
            {((1000 / playbackSpeed).toFixed(1))}Hz
          </span>
        </div>
      </div>

      {/* Main Double layout (Step logs + Priority Queue on left, Pseudocode highlight on right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 min-h-[280px]">
        
        {/* Left pane: Active Step Explanation & Priority Queue Visualizer */}
        <div className="lg:col-span-7 flex flex-col justify-between gap-3 h-full">
          
          {/* Active explanation bubble box */}
          <div className="bg-slate-950 border border-slate-800 p-3.5 rounded-xl flex-1 flex flex-col justify-center shadow-inner min-h-[90px]">
            <span className="text-[10px] text-blue-400 uppercase tracking-widest font-bold mb-1.5 block">
              💡 Process Logger
            </span>
            <p className="text-slate-200 text-xs md:text-sm leading-relaxed">
              {activeStep ? activeStep.explanation : 'Initializing algorithmic stack... Choose an algorithm above and slide play indicator.'}
            </p>
          </div>

          {/* Core heap / Frontier queue values visualizer */}
          <div className="bg-slate-950 border border-slate-800 p-3.5 rounded-xl">
            <span className="text-[10px] text-indigo-400 uppercase tracking-widest font-bold mb-2 block flex items-center justify-between">
              🌐 Frontier Graph Memory (Priority Queue / Stack)
              <span className="bg-indigo-950/80 border border-indigo-500/20 text-indigo-300 font-mono px-1.5 py-0.5 rounded text-[9px]">
                {algorithm === 'bfs' ? 'FIFO Queue' : algorithm === 'dfs' ? 'LIFO Stack' : 'Min-Priority Heap'}
              </span>
            </span>

            {activeStep && activeStep.queuedNodeIds && activeStep.queuedNodeIds.length > 0 ? (
              <div className="flex flex-wrap gap-1.5 h-auto max-h-[85px] overflow-y-auto pr-1">
                {activeStep.queuedNodeIds.map((nodeId, idx) => {
                  const distVal = activeStep.tentativeDistances[nodeId];
                  const rawDistTxt = distVal === Infinity ? '∞' : distVal.toFixed(1);

                  return (
                    <div
                      key={nodeId}
                      className="flex items-center gap-1 bg-slate-900 border border-slate-800 px-2 py-1 rounded text-xs font-mono"
                    >
                      <span className="text-slate-500 text-[10px]">#{idx + 1}</span>
                      <span className="text-slate-100 font-semibold">{nodeId}</span>
                      <span className="text-indigo-400 font-bold bg-indigo-950/40 px-1 rounded text-[10px]">
                        {algorithm === 'bfs' || algorithm === 'dfs' ? 'Hop' : `C:${rawDistTxt}`}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-slate-600 text-xs py-3 border border-dashed border-slate-900 rounded text-center">
                Frontier Heap is empty (traversal finalized or awaiting reset).
              </div>
            )}
          </div>
        </div>

        {/* Right pane: Pseudocode Highlighting container */}
        <div className="lg:col-span-5 bg-slate-950 border border-slate-850 rounded-xl p-4 flex flex-col justify-between overflow-hidden">
          <div>
            <span className="text-[10px] text-amber-500 uppercase tracking-wider font-bold block mb-2.5">
              📜 Trace Program: {getPseudocodeTitle()}
            </span>

            <div className="space-y-1 font-mono text-[10px] md:text-xs">
              {codeLines.map((line, idx) => {
                const isLineActive = activeStep?.codeLineIndex === idx;

                return (
                  <div
                    key={idx}
                    className={`flex items-center px-2 py-0.5 rounded transition-all duration-150 ${
                      isLineActive
                        ? 'bg-amber-950/75 border-l-2 border-amber-500 text-amber-200 font-medium'
                        : 'text-slate-400 hover:text-slate-300'
                    }`}
                  >
                    <span className="w-5 text-slate-600 block flex-shrink-0 text-right pr-2">
                      {idx + 1}
                    </span>
                    <span className="truncate block" title={line}>
                      {line}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
          
          <div className="text-[9.5px] text-slate-500 flex items-center gap-1 mt-3.5 pt-2 border-t border-slate-900">
            <ListCollapse className="w-3.5 h-3.5" />
            <span>Trace shows step-by-step code execution.</span>
          </div>
        </div>

      </div>

    </div>
  );
}
