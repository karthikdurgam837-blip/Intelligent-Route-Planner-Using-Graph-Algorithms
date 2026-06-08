import React from 'react';
import { BenchmarkMetrics } from '../types';
import { Zap, Play, BarChart2, CheckCircle2, TrendingUp, AlertTriangle } from 'lucide-react';

interface BenchmarkPanelProps {
  metrics: BenchmarkMetrics[];
  onRunSuite: () => void;
  isLoading: boolean;
}

export default function BenchmarkPanel({ metrics, onRunSuite, isLoading }: BenchmarkPanelProps) {
  
  const getOptimalityColor = (rating: string) => {
    if (rating.includes('100%') || rating.includes('Optimal')) return 'text-emerald-400 bg-emerald-950/60 border border-emerald-500/20';
    if (rating.includes('Suboptimal')) return 'text-amber-400 bg-amber-950/60 border border-amber-500/20';
    return 'text-red-400 bg-red-950/60 border border-red-500/20';
  };

  const formatDistance = (m: number) => {
    if (m >= 1000) return `${(m / 1000).toFixed(2)} km`;
    return `${m} m`;
  };

  const formatTime = (secs: number) => {
    if (secs === Infinity || secs < 0) return '∞';
    const mins = Math.floor(secs / 60);
    const s = Math.round(secs % 60);
    if (mins > 0) return `${mins}m ${s}s`;
    return `${s}s`;
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-white flex flex-col h-full font-sans">
      
      {/* Panel header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pb-4 border-b border-slate-800">
        <div>
          <h4 className="text-sm font-semibold flex items-center gap-1.5 text-blue-400">
            <BarChart2 className="w-5 h-5 text-blue-400" /> DSA Algorithmic Benchmarks & Comparisons
          </h4>
          <p className="text-xs text-slate-400">
            Compare traversal densities, time complexities, and path optimalities under current traffic.
          </p>
        </div>

        {/* Run Suite Button */}
        <button
          onClick={onRunSuite}
          disabled={isLoading}
          className={`flex items-center justify-center gap-1.5 text-xs font-bold py-2 px-4 rounded-lg cursor-pointer select-none transition-all active:scale-[0.98] ${
            isLoading
              ? 'bg-slate-850 hover:bg-slate-850 text-slate-500 border border-slate-800 cursor-not-allowed'
              : 'bg-emerald-600 hover:bg-emerald-700 hover:shadow-lg hover:shadow-emerald-900/30 text-white border border-emerald-500'
          }`}
        >
          <Zap className="w-4 h-4 fill-white" /> {isLoading ? 'Compiling Metrics...' : 'Compute Comparison Suite'}
        </button>
      </div>

      {metrics.length > 0 ? (
        <div className="space-y-4">
          
          {/* Table Comparison Grid */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="text-[10px] uppercase text-slate-500 tracking-wider border-b border-slate-800">
                <tr>
                  <th className="pb-2.5 font-bold">Algorithms Verified</th>
                  <th className="pb-2.5 font-bold text-center">Nodes Visited (Visited Set)</th>
                  <th className="pb-2.5 font-bold text-center">Step Cycles Expanded</th>
                  <th className="pb-2.5 font-bold text-center">Final Distance (m)</th>
                  <th className="pb-2.5 font-bold text-center">Calculated ETA (Duration)</th>
                  <th className="pb-2.5 font-bold text-center">Toll Cost ($)</th>
                  <th className="pb-2.5 font-bold text-right">Path Quality Rating</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 bg-slate-950/20">
                {metrics.map((row, index) => (
                  <tr key={row.algorithm} className="hover:bg-slate-900/40">
                    <td className="py-3 font-semibold text-slate-200 capitalize font-sans flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span> {row.algorithm}
                    </td>
                    <td className="py-3 text-center text-slate-100 font-mono font-bold">{row.nodesExpanded}</td>
                    <td className="py-3 text-center text-slate-100 font-mono font-semibold">{row.totalSteps}</td>
                    <td className="py-3 text-center font-mono">
                      {row.pathFound ? formatDistance(row.totalDistance_m) : 'Unreachable'}
                    </td>
                    <td className="py-3 text-center font-mono text-blue-400 font-bold">
                      {row.pathFound ? formatTime(row.totalTime_sec) : '∞'}
                    </td>
                    <td className="py-3 text-center font-mono text-amber-500">
                      {row.pathFound ? `$${row.totalTolls.toFixed(2)}` : 'N/A'}
                    </td>
                    <td className="py-3 text-right">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${getOptimalityColor(row.optimalityRating)}`}>
                        {row.optimalityRating}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Analytical Deep Dive summary */}
          <div className="bg-slate-950/60 border border-slate-800/80 p-4 rounded-xl space-y-3 mt-1 text-xs text-slate-300 leading-relaxed font-sans">
            <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest block flex items-center gap-1">
              <TrendingUp className="w-4 h-4 text-indigo-400" /> Core Insights from Benchmark Compile
            </span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 leading-snug">
              <div className="bg-slate-900/55 p-3 rounded-lg border border-slate-850">
                <span className="text-[10px] font-bold text-slate-400 block mb-1">⚡ Search Pruning (Dijkstra vs A*)</span>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Notice that **A* expanded fewer nodes** than **Dijkstra** to reach the exact same optimal destination. This is because A* employs an admissible spatial straight-line distance heuristic to bias the search toward the direction of the target, pruning unnecessary branch expansions in the opposite direction.
                </p>
              </div>

              <div className="bg-slate-900/55 p-3 rounded-lg border border-slate-850">
                <span className="text-[10px] font-bold text-slate-400 block mb-1">🚀 Unweighted Traversal (BFS & DFS)</span>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  **BFS** simply finds the shortest hop route (minimal edge layers), which can yield massive time block bottlenecking. **DFS** traverses paths in a deep backtracking stack pattern, resulting in highly suboptimal paths. This establishes why **priority-weighted grid models (Dijkstra/A*) are essential for spatial navigation**.
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 p-2 bg-blue-950/30 rounded border border-blue-500/20 text-slate-300">
              <CheckCircle2 className="w-4.5 h-4.5 text-blue-400 flex-shrink-0" />
              <span className="text-[10.5px]">
                Both Dijkstra and A* are **mathematically proven to find the absolute shortest path** in non-negative weighted graphs (100% path optimality is guaranteed).
              </span>
            </div>
          </div>
          
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center py-10 text-center text-slate-500">
          <Zap className="w-10 h-10 text-slate-600 mb-2.5" />
          <p className="text-xs max-w-sm mb-3">
            Push the button above to run the comparative benchmarks. It dynamically evaluates all algorithms side-by-side using the current map state.
          </p>
          <button
            onClick={onRunSuite}
            className="text-[11px] bg-slate-950 hover:bg-slate-850 text-slate-300 px-3 py-1.5 rounded-lg border border-slate-800 font-bold active:scale-95 transition-all cursor-pointer"
          >
            Run Suite Now
          </button>
        </div>
      )}

    </div>
  );
}
