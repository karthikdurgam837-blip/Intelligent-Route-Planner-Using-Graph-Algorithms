import React from 'react';
import { MapNode, AlgorithmType } from '../types';
import { CITY_TEMPLATES, CityTemplate } from '../graph-data';
import { Navigation, Compass, Settings, AlertOctagon, RefreshCw, Car, HelpCircle, AlertTriangle } from 'lucide-react';

interface ControlPanelProps {
  currentTemplateId: string;
  onSelectTemplate: (id: string) => void;
  nodes: MapNode[];
  sourceId: string;
  destinationId: string;
  onSelectSource: (id: string) => void;
  onSelectDestination: (id: string) => void;
  objective: 'time' | 'distance' | 'money' | 'eco' | 'weighted';
  onChangeObjective: (objective: 'time' | 'distance' | 'money' | 'eco' | 'weighted') => void;
  algorithm: AlgorithmType;
  onChangeAlgorithm: (alg: AlgorithmType) => void;
  weights: { tollWeight: number; distanceWeight: number; timeWeight: number; turnPenaltySec: number };
  onChangeWeights: (key: string, value: number) => void;
  metrics: {
    eta_sec: number;
    distance_m: number;
    toll_cost: number;
  } | null;
  onResetGraph: () => void;
  onStartTravelSimulation: () => void;
  isSimulatingTravel: boolean;
  canSimulate: boolean;
}

export default function ControlPanel({
  currentTemplateId,
  onSelectTemplate,
  nodes,
  sourceId,
  destinationId,
  onSelectSource,
  onSelectDestination,
  objective,
  onChangeObjective,
  algorithm,
  onChangeAlgorithm,
  weights,
  onChangeWeights,
  metrics,
  onResetGraph,
  onStartTravelSimulation,
  isSimulatingTravel,
  canSimulate,
}: ControlPanelProps) {
  
  const activeTemplate = CITY_TEMPLATES.find(t => t.id === currentTemplateId) || CITY_TEMPLATES[0];

  const formatDistance = (m: number) => {
    if (m >= 1000) return `${(m / 1000).toFixed(2)} km`;
    return `${m} m`;
  };

  const formatTime = (secs: number) => {
    if (secs === Infinity || secs < 0) return '∞';
    const hrs = Math.floor(secs / 3600);
    const mins = Math.floor((secs % 3600) / 60);
    const s = Math.round(secs % 60);
    
    if (hrs > 0) return `${hrs}h ${mins}m ${s}s`;
    if (mins > 0) return `${mins}m ${s}s`;
    return `${s}s`;
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-white h-full flex flex-col font-sans">
      
      {/* City Template Section */}
      <div className="mb-4">
        <label className="text-xs uppercase font-semibold text-slate-400 tracking-wider flex items-center gap-1 mb-2">
          <Compass className="w-4.5 h-4.5 text-blue-400" /> Choose Map Network
        </label>
        <select
          value={currentTemplateId}
          onChange={(e) => onSelectTemplate(e.target.value)}
          className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 transition-all font-medium text-slate-200"
        >
          {CITY_TEMPLATES.map(t => (
            <option key={t.id} value={t.id}>
              📌 {t.name}
            </option>
          ))}
        </select>
        <p className="text-slate-400 text-[10.5px] mt-1.5 leading-relaxed leading-snug">
          {activeTemplate.description}
        </p>
      </div>

      <hr className="border-slate-800 my-3" />

      {/* Origin & Destination Nodes */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <label className="text-[11px] uppercase text-slate-400 font-bold tracking-wider mb-1.5 block">
            📍 Source Origin
          </label>
          <select
            value={sourceId}
            onChange={(e) => onSelectSource(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-blue-500 text-slate-200 font-mono"
          >
            {nodes.map(n => (
              <option key={n.id} value={n.id}>
                ({n.label}) {n.name.split(' & ')[0]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-[11px] uppercase text-slate-400 font-bold tracking-wider mb-1.5 block">
            🏁 Destination Target
          </label>
          <select
            value={destinationId}
            onChange={(e) => onSelectDestination(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-rose-500 text-slate-200 font-mono"
          >
            {nodes.map(n => (
              <option key={n.id} value={n.id}>
                ({n.label}) {n.name.split(' & ')[0]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <hr className="border-slate-800 my-3" />

      {/* Optimization Objective Selector */}
      <div className="mb-4">
        <label className="text-xs uppercase font-semibold text-slate-400 tracking-wider flex items-center gap-1 mb-2">
          <Settings className="w-4.5 h-4.5 text-indigo-400" /> Routing Objective
        </label>
        <div className="grid grid-cols-5 bg-slate-950 p-1 border border-slate-800 rounded-lg text-center gap-1">
          {[
            { value: 'time', label: 'Fastest', tip: 'Travel Time' },
            { value: 'distance', label: 'Shortest', tip: 'Physical Metres' },
            { value: 'money', label: 'Cheapest', tip: 'Minimize Tolls' },
            { value: 'eco', label: 'Eco', tip: 'Low Fuel Proxy' },
            { value: 'weighted', label: 'Custom', tip: 'Weighted Sum' },
          ].map(opt => (
            <button
              key={opt.value}
              onClick={() => onChangeObjective(opt.value as any)}
              className={`text-[10px] py-2 px-1 rounded-md transition-all font-semibold outline-none ${
                objective === opt.value
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
              }`}
              title={opt.tip}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Multi-Criteria Sliders (Only show if 'weighted' is selected) */}
      {objective === 'weighted' && (
        <div className="bg-slate-950 border border-slate-800 p-3.5 rounded-lg mb-4 space-y-3 animate-fade-in">
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-400 font-medium">Weighted Ratio Parameters:</span>
            <span className="text-[10px] bg-slate-800 text-indigo-300 font-bold px-1.5 py-0.5 rounded">Multi-Criteria Active</span>
          </div>

          <div>
            <div className="flex justify-between text-[11px] mb-1">
              <span className="text-slate-300">Time Bias</span>
              <span className="text-indigo-400 font-mono font-bold">{(weights.timeWeight).toFixed(1)}x</span>
            </div>
            <input
              type="range"
              min="0"
              max="5"
              step="0.5"
              value={weights.timeWeight}
              onChange={(e) => onChangeWeights('timeWeight', parseFloat(e.target.value))}
              className="w-full accent-indigo-500 h-1 bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-[11px] mb-1">
              <span className="text-slate-300">Toll Discomfort Cost</span>
              <span className="text-indigo-400 font-mono font-bold">{(weights.tollWeight).toFixed(1)}x</span>
            </div>
            <input
              type="range"
              min="0"
              max="5"
              step="0.5"
              value={weights.tollWeight}
              onChange={(e) => onChangeWeights('tollWeight', parseFloat(e.target.value))}
              className="w-full accent-indigo-500 h-1 bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-[11px] mb-1">
              <span className="text-slate-300">Distance Bias (km)</span>
              <span className="text-indigo-400 font-mono font-bold">{(weights.distanceWeight).toFixed(1)}x</span>
            </div>
            <input
              type="range"
              min="0"
              max="5"
              step="0.5"
              value={weights.distanceWeight}
              onChange={(e) => onChangeWeights('distanceWeight', parseFloat(e.target.value))}
              className="w-full accent-indigo-500 h-1 bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>
        </div>
      )}

      {/* Turn Penalty Modifier (Applicable to time, weighted) */}
      {(objective === 'time' || objective === 'weighted') && (
        <div className="mb-4 bg-slate-950/40 border border-slate-800/80 p-3 rounded-lg flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-300 font-medium block">Sharp Turn Penalty</span>
            <span className="text-[10px] text-slate-400 block leading-tight">Time added per heavy corner turns.</span>
          </div>
          <div className="flex items-center gap-1.5">
            <input
              type="number"
              min="0"
              max="60"
              value={weights.turnPenaltySec}
              onChange={(e) => onChangeWeights('turnPenaltySec', Math.max(0, parseInt(e.target.value) || 0))}
              className="w-14 bg-slate-950 border border-slate-700 text-center text-xs py-1 rounded text-emerald-400 font-mono font-bold outline-none"
            />
            <span className="text-xs text-slate-400">sec</span>
          </div>
        </div>
      )}

      {/* Output / Calculated Route Summary box */}
      <div className="mt-auto bg-gradient-to-br from-slate-950 to-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col shadow-inner">
        <span className="text-xs uppercase text-slate-400 tracking-wider font-bold mb-3 block flex items-center justify-between">
          📊 Active Path Telemetry
          {metrics && metrics.eta_sec > 1e7 && (
            <span className="font-sans text-xs bg-red-950 text-red-400 px-1.5 py-0.5 rounded border border-red-500/20 animate-pulse flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> Blocked/Disconnected
            </span>
          )}
        </span>

        {metrics && metrics.eta_sec < 1e7 ? (
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-slate-900/80 p-2 border border-slate-800/50 rounded-lg">
              <span className="text-[10px] uppercase text-slate-500 block font-medium">Est. Duration</span>
              <span className="text-sm font-bold text-blue-400 font-mono block mt-1">{formatTime(metrics.eta_sec)}</span>
            </div>
            
            <div className="bg-slate-900/80 p-2 border border-slate-800/50 rounded-lg">
              <span className="text-[10px] uppercase text-slate-500 block font-medium">Total Odometre</span>
              <span className="text-sm font-bold text-emerald-400 font-mono block mt-1">{formatDistance(metrics.distance_m)}</span>
            </div>

            <div className="bg-slate-900/80 p-2 border border-slate-800/50 rounded-lg">
              <span className="text-[10px] uppercase text-slate-500 block font-medium">Tolls Gathered</span>
              <span className="text-sm font-bold text-amber-500 font-mono block mt-1">
                {metrics.toll_cost > 0 ? `$${metrics.toll_cost.toFixed(2)}` : 'Free'}
              </span>
            </div>
          </div>
        ) : (
          <div className="bg-slate-900/60 text-slate-500 text-xs py-5 rounded-lg border border-dashed border-slate-800 text-center px-4 leading-normal">
            {metrics?.eta_sec && metrics.eta_sec > 1e7 ? (
              <span className="text-red-400/90 flex flex-col items-center gap-1.5">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                No path exists under current road block/closure constraints. Try opening roads or clearing traffic blocks on local grids.
              </span>
            ) : (
              'Set start & destination nodes to calculate optimal path metrics.'
            )}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 mt-4">
          {/* Reset button */}
          <button
            onClick={onResetGraph}
            className="flex items-center justify-center gap-1.5 bg-slate-950 border border-slate-700 hover:bg-slate-900 text-slate-300 text-xs font-semibold py-2 px-3 rounded-lg cursor-pointer transition-all active:scale-[0.98]"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Clear Congestion
          </button>

          {/* Travel Simulation button */}
          <button
            onClick={onStartTravelSimulation}
            disabled={!canSimulate || isSimulatingTravel}
            className={`flex items-center justify-center gap-1.5 text-xs font-bold py-2 px-3 rounded-lg transition-all active:scale-[0.98] cursor-pointer ${
              !canSimulate || isSimulatingTravel
                ? 'bg-slate-800 text-slate-500 border border-slate-800 cursor-not-allowed opacity-55'
                : 'bg-blue-600 hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-900/30 text-white border border-blue-500'
            }`}
          >
            <Car className="w-4 h-4" /> {isSimulatingTravel ? 'Driving...' : 'Simulate Drive'}
          </button>
        </div>
      </div>

    </div>
  );
}
