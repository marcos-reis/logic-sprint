import React, { useState } from 'react';
import {
  ArrowLeft,
  Server,
  Database,
  Gauge,
  Network,
  Cpu,
  Flame,
  Clock,
  Target,
  RotateCcw,
  AlertTriangle,
  Play,
  Award,
  Zap,
} from 'lucide-react';
import {
  ALL_SYSDESIGN_SKILLS,
  SYSDESIGN_SKILL_META,
  type SysDesignAdaptiveState,
  type SysDesignSkillId,
} from '../sysdesign/types';

export interface SysDesignStatsViewProps {
  state: SysDesignAdaptiveState;
  onSelectSkill: (skillId: SysDesignSkillId) => void;
  onReset: () => void;
  onBack: () => void;
}

const SKILL_ICONS: Record<SysDesignSkillId, React.FC<{ className?: string }>> = {
  traffic_rps: Gauge,
  read_write_little: Server,
  storage: Database,
  cache: Cpu,
  bandwidth: Network,
};

export const SysDesignStatsView: React.FC<SysDesignStatsViewProps> = ({
  state,
  onSelectSkill,
  onReset,
  onBack,
}) => {
  const [confirmReset, setConfirmReset] = useState(false);

  // Computed overall statistics
  const totalAttempts = ALL_SYSDESIGN_SKILLS.reduce(
    (acc, id) => acc + (state.skills[id]?.attempts || 0),
    0,
  );
  const totalCorrect = ALL_SYSDESIGN_SKILLS.reduce(
    (acc, id) => acc + (state.skills[id]?.correct || 0),
    0,
  );
  const overallAccuracy =
    totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0;

  const totalTimeWeighted = ALL_SYSDESIGN_SKILLS.reduce(
    (acc, id) =>
      acc + (state.skills[id]?.avgTimeMs || 0) * (state.skills[id]?.attempts || 0),
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

  const renderSkillCard = (skillId: SysDesignSkillId) => {
    const meta = SYSDESIGN_SKILL_META[skillId];
    const stats = state.skills[skillId] || {
      skillId,
      level: 1,
      attempts: 0,
      correct: 0,
      streak: 0,
      avgTimeMs: 0,
      cooldown: 0,
      retestPending: false,
      lastSeenRound: 0,
    };

    const accuracy =
      stats.attempts > 0 ? Math.round((stats.correct / stats.attempts) * 100) : 0;
    const avgTime =
      stats.avgTimeMs > 0 ? `${(stats.avgTimeMs / 1000).toFixed(1)}s` : '--';
    const IconComponent = SKILL_ICONS[skillId] || Server;

    return (
      <div
        key={skillId}
        className="bg-zinc-900/80 border border-zinc-800 hover:border-zinc-700/80 rounded-2xl p-4 transition-all duration-150 flex flex-col gap-3 shadow-sm"
      >
        {/* Header: Name, Icon, Description & Retest badge */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-3 min-w-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400 mt-0.5">
              <IconComponent className="h-4 w-4" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-semibold text-zinc-100 text-base leading-tight truncate">
                {meta.label}
              </span>
              <span className="text-xs text-zinc-400 mt-0.5 line-clamp-2">
                {meta.description}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {stats.retestPending && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-medium rounded-full">
                <AlertTriangle className="w-3 h-3" />
                <span className="hidden sm:inline">Re-teste agendado</span>
                <span className="sm:hidden">Re-teste</span>
              </span>
            )}

            {/* Level indicator */}
            <div className="flex items-center gap-1 px-2 py-0.5 bg-zinc-800/80 border border-zinc-700/60 rounded-lg text-xs font-bold text-zinc-300">
              <Award className="w-3.5 h-3.5 text-cyan-400" />
              <span>Nv {stats.level}</span>
            </div>
          </div>
        </div>

        {/* Level progression pips */}
        <div className="flex items-center gap-1">
          {[1, 2, 3].map((lvl) => (
            <div
              key={lvl}
              className={`h-1.5 flex-1 rounded-full transition-all ${
                lvl <= stats.level
                  ? 'bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.4)]'
                  : 'bg-zinc-800'
              }`}
            />
          ))}
        </div>

        {/* Stats Grid: Accuracy, Time, Streak */}
        <div className="grid grid-cols-3 gap-2 py-1 text-center bg-zinc-950/40 rounded-xl border border-zinc-850 p-2">
          {/* Accuracy */}
          <div className="flex flex-col items-center justify-center">
            <span className="text-[10px] text-zinc-400 uppercase tracking-wider">
              Acurácia
            </span>
            <span
              className={`text-sm font-bold font-mono ${
                stats.attempts === 0
                  ? 'text-zinc-500'
                  : accuracy >= 80
                    ? 'text-emerald-400'
                    : accuracy >= 60
                      ? 'text-cyan-400'
                      : 'text-amber-400'
              }`}
            >
              {stats.attempts > 0 ? `${accuracy}%` : '--'}
            </span>
            <span className="text-[10px] text-zinc-400">
              {stats.correct}/{stats.attempts}
            </span>
          </div>

          {/* Avg Time */}
          <div className="flex flex-col items-center justify-center border-x border-zinc-800/60">
            <span className="text-[10px] text-zinc-400 uppercase tracking-wider flex items-center gap-0.5">
              <Clock className="w-2.5 h-2.5 text-zinc-400" />
              Tempo
            </span>
            <span className="text-sm font-bold font-mono text-zinc-200">
              {avgTime}
            </span>
            <span className="text-[10px] text-zinc-400">médio</span>
          </div>

          {/* Streak */}
          <div className="flex flex-col items-center justify-center">
            <span className="text-[10px] text-zinc-400 uppercase tracking-wider flex items-center gap-0.5">
              <Flame className="w-2.5 h-2.5 text-orange-400" />
              Streak
            </span>
            <span className="text-sm font-bold font-mono text-orange-400">
              {stats.streak}
            </span>
            <span className="text-[10px] text-zinc-400">atual</span>
          </div>
        </div>

        {/* Action Button: Treinar */}
        <button
          type="button"
          onClick={() => onSelectSkill(skillId)}
          className="w-full py-2 px-3 rounded-xl bg-zinc-800/80 hover:bg-cyan-500/10 hover:border-cyan-500/40 border border-zinc-700/60 text-zinc-200 hover:text-cyan-300 font-semibold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all duration-100 active:scale-98 cursor-pointer"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>Treinar este pilar</span>
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
          <Zap className="w-5 h-5 text-cyan-400" />
          Estatísticas · System Design
        </h1>

        <div className="w-16" />
      </div>

      {/* Global Summary Cards */}
      <div className="grid grid-cols-3 gap-3">
        {/* Total Rodadas */}
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-3.5 sm:p-4 flex flex-col items-center justify-center text-center shadow-sm">
          <Target className="w-5 h-5 text-cyan-400 mb-1" />
          <span className="text-[11px] sm:text-xs text-zinc-400 uppercase tracking-wider font-medium">
            Rodadas
          </span>
          <span className="text-xl sm:text-2xl font-bold font-mono text-zinc-100 mt-0.5">
            {state.totalRounds}
          </span>
          <span className="text-[10px] text-zinc-400">
            {totalAttempts} tentativas
          </span>
        </div>

        {/* Acurácia Geral */}
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-3.5 sm:p-4 flex flex-col items-center justify-center text-center shadow-sm">
          <Award className="w-5 h-5 text-emerald-400 mb-1" />
          <span className="text-[11px] sm:text-xs text-zinc-400 uppercase tracking-wider font-medium">
            Acurácia
          </span>
          <span
            className={`text-xl sm:text-2xl font-bold font-mono mt-0.5 ${
              totalAttempts === 0
                ? 'text-zinc-500'
                : overallAccuracy >= 80
                  ? 'text-emerald-400'
                  : 'text-cyan-400'
            }`}
          >
            {totalAttempts > 0 ? `${overallAccuracy}%` : '--'}
          </span>
          <span className="text-[10px] text-zinc-400">
            {totalCorrect} acertos
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
          <span className="text-[10px] text-zinc-400">por estimativa</span>
        </div>
      </div>

      {/* 5 Pillars Section */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2 px-1">
          <Server className="w-5 h-5 text-cyan-400" />
          <h2 className="text-base font-bold text-zinc-100">
            Pilares de Back-of-the-Envelope & Escala ({ALL_SYSDESIGN_SKILLS.length})
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {ALL_SYSDESIGN_SKILLS.map(renderSkillCard)}
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
            <span>Zerar progresso de System Design</span>
          </button>
        ) : (
          <div className="flex flex-col items-center gap-2.5 bg-red-950/20 border border-red-500/30 rounded-2xl p-4 w-full max-w-sm text-center">
            <span className="text-xs text-red-300 font-medium">
              Tem certeza? Todos os níveis, streaks e históricos de System Design serão resetados.
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
