import React, { useState } from 'react';
import {
  ArrowLeft,
  RotateCcw,
  AlertTriangle,
  Play,
  Clock,
  Target,
  Award,
  Code2,
  Sparkles,
  HelpCircle,
  CheckCircle2,
} from 'lucide-react';
import {
  ALL_ALGO_PATTERNS,
  ALGO_PATTERN_META,
  type AlgoAdaptiveState,
  type AlgoPatternId,
} from '../algo/types';

export interface AlgoStatsViewProps {
  state: AlgoAdaptiveState;
  onSelectPattern: (patternId: AlgoPatternId) => void;
  onReset: () => void;
  onBack: () => void;
}

export const AlgoStatsView: React.FC<AlgoStatsViewProps> = ({
  state,
  onSelectPattern,
  onReset,
  onBack,
}) => {
  const [confirmReset, setConfirmReset] = useState(false);

  // Overall totals across all 8 patterns
  const totalAttempts = ALL_ALGO_PATTERNS.reduce(
    (acc, id) => acc + (state.patterns[id]?.attempts || 0),
    0,
  );
  const totalAutonomous = ALL_ALGO_PATTERNS.reduce(
    (acc, id) => acc + (state.patterns[id]?.autonomousCorrect || 0),
    0,
  );
  const totalGuided = ALL_ALGO_PATTERNS.reduce(
    (acc, id) => acc + (state.patterns[id]?.guidedCorrect || 0),
    0,
  );

  const overallAutonomyPct =
    totalAttempts > 0 ? Math.round((totalAutonomous / totalAttempts) * 100) : 0;

  const totalTimeWeighted = ALL_ALGO_PATTERNS.reduce(
    (acc, id) =>
      acc +
      (state.patterns[id]?.avgTimeMs || 0) * (state.patterns[id]?.attempts || 0),
    0,
  );
  const overallAvgTime =
    totalAttempts > 0
      ? `${(totalTimeWeighted / totalAttempts / 1000).toFixed(1)}s`
      : '--';

  const handleResetConfirm = () => {
    onReset();
    setConfirmReset(false);
  };

  const renderPatternCard = (patternId: AlgoPatternId) => {
    const meta = ALGO_PATTERN_META[patternId];
    const stats = state.patterns[patternId] || {
      patternId,
      attempts: 0,
      autonomousCorrect: 0,
      guidedCorrect: 0,
      avgTimeMs: 0,
      cooldown: 0,
      retestPending: false,
      lastSeenRound: 0,
    };

    const autonomyRate =
      stats.attempts > 0
        ? Math.round((stats.autonomousCorrect / stats.attempts) * 100)
        : null;
    const avgTime =
      stats.avgTimeMs > 0 ? `${(stats.avgTimeMs / 1000).toFixed(1)}s` : '--';

    return (
      <div
        key={patternId}
        className="bg-zinc-900/80 border border-zinc-800 hover:border-zinc-700/80 rounded-2xl p-4 transition-all duration-150 flex flex-col gap-3 shadow-sm"
      >
        {/* Header: Label, Signal & Retest badge */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col min-w-0">
            <span className="font-semibold text-zinc-100 text-base leading-tight truncate">
              {meta.label}
            </span>
            <span className="text-xs text-zinc-400 mt-0.5 line-clamp-2">
              {meta.signalSummary}
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {stats.retestPending && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-medium rounded-full">
                <AlertTriangle className="w-3 h-3" />
                <span>Re-teste</span>
              </span>
            )}
          </div>
        </div>

        {/* Autonomy Bar indicator */}
        <div className="flex flex-col gap-1">
          <div className="flex justify-between items-center text-[11px] text-zinc-400">
            <span>Autonomia</span>
            <span className="font-mono font-medium text-zinc-300">
              {autonomyRate !== null ? `${autonomyRate}%` : 'Sem tentativas'}
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-800 flex">
            {stats.attempts > 0 ? (
              <>
                <div
                  className="bg-emerald-400 transition-all duration-300"
                  style={{
                    width: `${(stats.autonomousCorrect / stats.attempts) * 100}%`,
                  }}
                  title={`Autônomo: ${stats.autonomousCorrect}`}
                />
                <div
                  className="bg-cyan-500/70 transition-all duration-300"
                  style={{
                    width: `${(stats.guidedCorrect / stats.attempts) * 100}%`,
                  }}
                  title={`Guiado: ${stats.guidedCorrect}`}
                />
              </>
            ) : (
              <div className="w-full bg-zinc-800" />
            )}
          </div>
        </div>

        {/* Stats Grid: Autônomo, Guiado, Tempo Médio */}
        <div className="grid grid-cols-3 gap-2 py-1 text-center bg-zinc-950/40 rounded-xl border border-zinc-850 p-2">
          {/* Autônomo */}
          <div className="flex flex-col items-center justify-center">
            <span className="text-[10px] text-zinc-400 uppercase tracking-wider flex items-center gap-0.5">
              <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
              Autônomo
            </span>
            <span className="text-sm font-bold font-mono text-emerald-400">
              {stats.autonomousCorrect}
            </span>
            <span className="text-[10px] text-zinc-500">sem erros</span>
          </div>

          {/* Guiado */}
          <div className="flex flex-col items-center justify-center border-x border-zinc-800/60">
            <span className="text-[10px] text-zinc-400 uppercase tracking-wider flex items-center gap-0.5">
              <HelpCircle className="w-2.5 h-2.5 text-cyan-400" />
              Guiado
            </span>
            <span className="text-sm font-bold font-mono text-cyan-400">
              {stats.guidedCorrect}
            </span>
            <span className="text-[10px] text-zinc-500">c/ dica/erro</span>
          </div>

          {/* Tempo Médio */}
          <div className="flex flex-col items-center justify-center">
            <span className="text-[10px] text-zinc-400 uppercase tracking-wider flex items-center gap-0.5">
              <Clock className="w-2.5 h-2.5 text-zinc-400" />
              Tempo
            </span>
            <span className="text-sm font-bold font-mono text-zinc-200">
              {avgTime}
            </span>
            <span className="text-[10px] text-zinc-500">médio</span>
          </div>
        </div>

        {/* Action Button: Treinar padrão */}
        <button
          type="button"
          onClick={() => onSelectPattern(patternId)}
          className="w-full py-2 px-3 rounded-xl bg-zinc-800/80 hover:bg-cyan-500/10 hover:border-cyan-500/40 border border-zinc-700/60 text-zinc-200 hover:text-cyan-300 font-semibold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all duration-100 active:scale-98 cursor-pointer"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>Treinar padrão</span>
        </button>
      </div>
    );
  };

  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col gap-6 p-4 sm:p-6 pb-12">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-4 border-b border-zinc-850 pb-4">
        <button
          type="button"
          onClick={onBack}
          className="p-2 -ml-2 rounded-xl text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900 border border-transparent hover:border-zinc-800 transition-all flex items-center gap-1.5 cursor-pointer"
          aria-label="Voltar"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm font-medium">Voltar</span>
        </button>

        <h1 className="text-lg sm:text-xl font-bold text-zinc-100 flex items-center gap-2">
          <Code2 className="w-5 h-5 text-cyan-400" />
          Progresso dos 8 Padrões
        </h1>

        <div className="w-16" />
      </div>

      {/* Global Summary Cards */}
      <div className="grid grid-cols-3 gap-3">
        {/* Total Rodadas */}
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-3.5 sm:p-4 flex flex-col items-center justify-center text-center shadow-sm">
          <Target className="w-5 h-5 text-cyan-400 mb-1" />
          <span className="text-[11px] sm:text-xs text-zinc-400 uppercase tracking-wider font-medium">
            Desafios
          </span>
          <span className="text-xl sm:text-2xl font-bold font-mono text-zinc-100 mt-0.5">
            {state.totalRounds}
          </span>
          <span className="text-[10px] text-zinc-500">
            {totalAttempts} resoluções
          </span>
        </div>

        {/* Autonomia Geral */}
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-3.5 sm:p-4 flex flex-col items-center justify-center text-center shadow-sm">
          <Award className="w-5 h-5 text-emerald-400 mb-1" />
          <span className="text-[11px] sm:text-xs text-zinc-400 uppercase tracking-wider font-medium">
            Autonomia
          </span>
          <span
            className={`text-xl sm:text-2xl font-bold font-mono mt-0.5 ${
              totalAttempts === 0
                ? 'text-zinc-500'
                : overallAutonomyPct >= 70
                  ? 'text-emerald-400'
                  : 'text-cyan-400'
            }`}
          >
            {totalAttempts > 0 ? `${overallAutonomyPct}%` : '--'}
          </span>
          <span className="text-[10px] text-zinc-500">
            {totalAttempts > 0
              ? `${totalAutonomous} autônomos · ${totalGuided} guiados`
              : '0 resoluções'}
          </span>
        </div>

        {/* Tempo Médio Geral */}
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-3.5 sm:p-4 flex flex-col items-center justify-center text-center shadow-sm">
          <Clock className="w-5 h-5 text-amber-400 mb-1" />
          <span className="text-[11px] sm:text-xs text-zinc-400 uppercase tracking-wider font-medium">
            Tempo Médio
          </span>
          <span className="text-xl sm:text-2xl font-bold font-mono text-zinc-100 mt-0.5">
            {overallAvgTime}
          </span>
          <span className="text-[10px] text-zinc-500">por algoritmo</span>
        </div>
      </div>

      {/* Grid of 8 Patterns */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2 px-1">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">
            Arsenal de Padrões Algorítmicos (8)
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {ALL_ALGO_PATTERNS.map(renderPatternCard)}
        </div>
      </div>

      {/* Danger Zone: Reset Progress with Two-Step Confirmation */}
      <div className="mt-4 pt-6 border-t border-zinc-850 flex flex-col items-center justify-center gap-3">
        {!confirmReset ? (
          <button
            type="button"
            onClick={() => setConfirmReset(true)}
            className="px-4 py-2.5 rounded-xl bg-zinc-900/60 hover:bg-red-500/10 text-zinc-400 hover:text-red-400 border border-zinc-800 hover:border-red-500/30 text-xs sm:text-sm font-medium flex items-center gap-2 transition-all cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Zerar progresso dos algoritmos</span>
          </button>
        ) : (
          <div className="flex flex-col items-center gap-2.5 bg-red-950/20 border border-red-500/30 rounded-2xl p-4 w-full max-w-sm text-center">
            <span className="text-xs text-red-300 font-medium">
              Tem certeza? Todo o histórico de autonomia e re-testes será resetado.
            </span>
            <div className="flex items-center gap-2 w-full">
              <button
                type="button"
                onClick={() => setConfirmReset(false)}
                className="flex-1 py-2 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleResetConfirm}
                className="flex-1 py-2 px-3 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-lg shadow-red-950/50 transition-all cursor-pointer"
              >
                Confirmar reset
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};