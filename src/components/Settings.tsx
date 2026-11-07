import React, { useState } from 'react';
import {
  SlidersHorizontal,
  RotateCcw,
  CheckCircle2,
  Volume2,
  VolumeX,
  Play,
  Zap,
  Info,
  ShieldCheck
} from 'lucide-react';
import { useAirport } from '../context/AirportContext';
import { INITIAL_WEIGHTS } from '../utils/sampleData';
import { SchedulingWeights } from '../types';

export const Settings: React.FC = () => {
  const {
    weights,
    updateWeights,
    autoScheduling,
    setAutoScheduling,
    audioAlertsEnabled,
    setAudioAlertsEnabled,
    simSpeed,
    setSimSpeed,
    resetSimulation
  } = useAirport();

  const [localWeights, setLocalWeights] = useState<SchedulingWeights>(weights);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Sample flight calculation preview
  const sampleWait = 12; // 12 mins
  const sampleFuel = 18; // 18% fuel
  const sampleTermAlpha = localWeights.alpha * sampleWait;
  const sampleTermBeta = localWeights.beta * (100 / Math.max(5, sampleFuel)) / 2;
  const sampleP2Score = (sampleTermAlpha + sampleTermBeta + localWeights.gammaP2).toFixed(1);
  const sampleP1Score = (sampleTermAlpha + sampleTermBeta + localWeights.gammaP1 + 450).toFixed(1);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateWeights(localWeights);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleResetWeights = () => {
    setLocalWeights(INITIAL_WEIGHTS);
    updateWeights(INITIAL_WEIGHTS);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-5 h-5 text-cyan-400" />
              <h2 className="text-base font-bold text-white uppercase tracking-wider font-mono">
                ATC SYSTEM CONFIGURATION & ALGORITHM TUNING
              </h2>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-1">
              WEIGHT PARAMETERS · SIMULATION CLOCK TICKS · PREEMPTION THRESHOLDS
            </p>
          </div>

          <button
            onClick={resetSimulation}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-mono"
            title="Reset flight data and schedules to initial baseline"
          >
            <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
            <span>Reset Demo Baseline</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 font-mono text-xs">
        {/* Left Column: Priority Scoring Weights Form (7 cols) */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-white uppercase">
                1. PRIORITY SCORING COEFFICIENT TUNING
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Adjust scoring weights to balance fuel emergency safety vs queue fairness.
              </p>
            </div>
            <button
              onClick={handleResetWeights}
              className="text-[11px] text-cyan-400 hover:text-cyan-300"
            >
              Reset to Defaults
            </button>
          </div>

          {saveSuccess && (
            <div className="p-2.5 rounded-lg bg-emerald-950 border border-emerald-800 text-emerald-200 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Weights updated and queue re-calculated!</span>
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-4">
            {/* Alpha (Wait Time Weight) */}
            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-2">
              <div className="flex justify-between items-center">
                <label className="font-bold text-cyan-300">
                  Alpha (α) - Waiting Time Multiplier:
                </label>
                <span className="font-bold text-white text-sm tabular-nums">
                  {localWeights.alpha}
                </span>
              </div>
              <input
                type="range"
                min={0.1}
                max={5.0}
                step={0.1}
                value={localWeights.alpha}
                onChange={e =>
                  setLocalWeights({ ...localWeights, alpha: parseFloat(e.target.value) || 1.5 })
                }
                className="w-full accent-cyan-400 cursor-pointer"
              />
              <p className="text-[10px] text-slate-400">
                Increases score per minute waiting. High values prioritize flights delayed in holding patterns.
              </p>
            </div>

            {/* Beta (Fuel Urgency Factor) */}
            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-2">
              <div className="flex justify-between items-center">
                <label className="font-bold text-yellow-300">
                  Beta (β) - Fuel Urgency Factor:
                </label>
                <span className="font-bold text-white text-sm tabular-nums">
                  {localWeights.beta}
                </span>
              </div>
              <input
                type="range"
                min={10}
                max={200}
                step={5}
                value={localWeights.beta}
                onChange={e =>
                  setLocalWeights({ ...localWeights, beta: parseFloat(e.target.value) || 80 })
                }
                className="w-full accent-yellow-400 cursor-pointer"
              />
              <p className="text-[10px] text-slate-400">
                Scales inversely with remaining fuel percentage. Drastically boosts flights as fuel falls below 20%.
              </p>
            </div>

            {/* Gamma Base Weights for Classes */}
            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-3">
              <label className="font-bold text-white block">
                Gamma (γ) - Class Priority Offsets:
              </label>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <span className="text-[11px] text-red-400 block mb-1">γ_P1 (Emergency):</span>
                  <input
                    type="number"
                    min={200}
                    max={1000}
                    step={50}
                    value={localWeights.gammaP1}
                    onChange={e =>
                      setLocalWeights({ ...localWeights, gammaP1: parseInt(e.target.value, 10) || 600 })
                    }
                    className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 text-center text-white font-bold"
                  />
                </div>

                <div>
                  <span className="text-[11px] text-blue-400 block mb-1">γ_P2 (Landing):</span>
                  <input
                    type="number"
                    min={20}
                    max={200}
                    step={10}
                    value={localWeights.gammaP2}
                    onChange={e =>
                      setLocalWeights({ ...localWeights, gammaP2: parseInt(e.target.value, 10) || 70 })
                    }
                    className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 text-center text-white font-bold"
                  />
                </div>

                <div>
                  <span className="text-[11px] text-emerald-400 block mb-1">γ_P3 (Takeoff):</span>
                  <input
                    type="number"
                    min={5}
                    max={100}
                    step={5}
                    value={localWeights.gammaP3}
                    onChange={e =>
                      setLocalWeights({ ...localWeights, gammaP3: parseInt(e.target.value, 10) || 20 })
                    }
                    className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 text-center text-white font-bold"
                  />
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="px-5 py-2 bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold rounded-lg shadow-md transition-colors"
              >
                Apply Weight Adjustments
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Live Formula Calculation Sandbox & Global Toggles (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Live Formula Preview Sandbox */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-3">
            <h3 className="text-sm font-bold text-white uppercase flex items-center gap-2">
              <Zap className="w-4 h-4 text-yellow-400" />
              LIVE FORMULA SCORING PREVIEW
            </h3>
            <p className="text-[11px] text-slate-400">
              Simulating an inbound flight with 18% fuel waiting 12 minutes:
            </p>

            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-2 text-[11px]">
              <div className="flex justify-between border-b border-slate-800 pb-1">
                <span className="text-slate-400">Wait Term (α × 12m):</span>
                <span className="text-cyan-400 font-bold">+{sampleTermAlpha.toFixed(1)}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-1">
                <span className="text-slate-400">Fuel Term [β × (100 / 18)]:</span>
                <span className="text-yellow-400 font-bold">+{sampleTermBeta.toFixed(1)}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-1">
                <span className="text-slate-400">Normal P2 Score:</span>
                <span className="text-blue-300 font-bold text-xs">{sampleP2Score}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-red-400 font-bold">If Mayday P1 Declared:</span>
                <span className="text-red-400 font-bold text-sm">{sampleP1Score} (Top Heap)</span>
              </div>
            </div>
          </div>

          {/* Global Operational Toggles */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
            <h3 className="text-sm font-bold text-white uppercase">
              2. AIRPORT SCHEDULING PREFERENCES
            </h3>

            {/* Auto Scheduling Toggle */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-950 border border-slate-800">
              <div>
                <div className="font-bold text-white text-xs">Automatic Dynamic Rescheduling</div>
                <div className="text-[10px] text-slate-400">
                  Instantly re-evaluate runway assignments when aircraft state changes.
                </div>
              </div>
              <input
                type="checkbox"
                checked={autoScheduling}
                onChange={e => setAutoScheduling(e.target.checked)}
                className="w-4 h-4 accent-cyan-400 cursor-pointer"
              />
            </div>

            {/* Audio Alert Chimes */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-950 border border-slate-800">
              <div>
                <div className="font-bold text-white text-xs">ATC Audio Tone Notifications</div>
                <div className="text-[10px] text-slate-400">
                  Synthesize audible beeps during emergency alerts and runway touch downs.
                </div>
              </div>
              <button
                onClick={() => setAudioAlertsEnabled(!audioAlertsEnabled)}
                className={`p-2 rounded-lg border transition-colors ${
                  audioAlertsEnabled ? 'text-cyan-400 border-cyan-800 bg-cyan-950/40' : 'text-slate-500 border-slate-800'
                }`}
              >
                {audioAlertsEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>
            </div>

            {/* Simulation Speed Selector */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-950 border border-slate-800">
              <div>
                <div className="font-bold text-white text-xs">Simulation Speed Multiplier</div>
                <div className="text-[10px] text-slate-400">
                  Accelerate flight progression and fuel burn rate.
                </div>
              </div>
              <div className="flex items-center gap-1">
                {[1, 2, 5, 10].map(s => (
                  <button
                    key={s}
                    onClick={() => setSimSpeed(s)}
                    className={`px-2 py-1 rounded text-[11px] font-bold ${
                      simSpeed === s ? 'bg-cyan-500 text-slate-950' : 'bg-slate-900 text-slate-400 hover:text-white'
                    }`}
                  >
                    {s}x
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
