import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Server,
  Gauge,
  Database,
  Cpu,
  Network,
  Sparkles,
  Clock,
  X,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  XCircle,
  ArrowRight,
  RotateCcw,
  BarChart3,
  Target,
  AlertTriangle,
  Infinity as InfinityIcon,
  Calculator,
  Scale,
  BookOpen,
} from 'lucide-react';
import {
  ALL_SYSDESIGN_SKILLS,
  SYSDESIGN_SKILL_META,
  type SysDesignAdaptiveState,
  type SysDesignDifficulty,
  type SysDesignEvaluation,
  type SysDesignQuestion,
  type SysDesignSessionMode,
  type SysDesignSkillId,
  evaluateSysDesignAnswer,
} from '../sysdesign/types';
import {
  loadSysDesignState,
  saveSysDesignState,
  resetSysDesignState,
  pickNextSysDesignSkill,
  recordSysDesignAnswer,
} from '../sysdesign/adaptive';
import { generateSysDesignQuestion } from '../sysdesign';
import { NumericKeypad } from './NumericKeypad';
import { SysDesignStatsView } from './SysDesignStatsView';

export interface SysDesignArenaProps {
  headerSlot?: React.ReactNode;
}

type SysDesignViewScreen = 'home' | 'quiz' | 'summary' | 'stats';

interface SysDesignRoundSummary {
  skillId: SysDesignSkillId;
  level: SysDesignDifficulty;
  correct: boolean;
  timeMs: number;
  userValue: number;
  selectedUnit: string;
}

interface SysDesignFeedbackState {
  evaluation: SysDesignEvaluation;
  userValue: number;
  selectedUnit: string;
  timeMs: number;
  leveledUp: boolean;
  leveledDown: boolean;
  scheduledRetest: boolean;
}

const SPRINT_LENGTH = 10;

const SKILL_ICONS: Record<SysDesignSkillId, React.FC<{ className?: string }>> = {
  traffic_rps: Gauge,
  read_write_little: Server,
  storage: Database,
  cache: Cpu,
  bandwidth: Network,
};

function formatSeconds(ms: number): string {
  return `${(ms / 1000).toFixed(1)}s`;
}

export const SysDesignArena: React.FC<SysDesignArenaProps> = ({ headerSlot }) => {
  const [sysDesignState, setSysDesignState] = useState<SysDesignAdaptiveState>(() =>
    loadSysDesignState(),
  );
  const [screen, setScreen] = useState<SysDesignViewScreen>('home');

  // Session state
  const [sessionMode, setSessionMode] = useState<SysDesignSessionMode>('mixed');
  const [isContinuous, setIsContinuous] = useState<boolean>(false);
  const [currentQuestion, setCurrentQuestion] = useState<SysDesignQuestion | null>(null);
  const [isRetestQuestion, setIsRetestQuestion] = useState<boolean>(false);
  const [lastSkillId, setLastSkillId] = useState<SysDesignSkillId | undefined>(undefined);

  // Input & Feedback state
  const [numericInput, setNumericInput] = useState<string>('');
  const [selectedUnit, setSelectedUnit] = useState<string>('');
  const [feedback, setFeedback] = useState<SysDesignFeedbackState | null>(null);
  const [sprintResults, setSprintResults] = useState<SysDesignRoundSummary[]>([]);
  const [elapsedMs, setElapsedMs] = useState<number>(0);

  // Cheat sheet toggle
  const [cheatSheetExpanded, setCheatSheetExpanded] = useState<boolean>(true);

  const questionStartRef = useRef<number>(Date.now());

  // Live timer
  useEffect(() => {
    if (screen !== 'quiz' || feedback !== null) return;
    questionStartRef.current = Date.now();
    setElapsedMs(0);

    const interval = window.setInterval(() => {
      setElapsedMs(Date.now() - questionStartRef.current);
    }, 200);

    return () => window.clearInterval(interval);
  }, [screen, currentQuestion?.id, feedback]);

  const spawnQuestion = useCallback(
    (
      state: SysDesignAdaptiveState,
      mode: SysDesignSessionMode,
      prevSkill?: SysDesignSkillId,
    ) => {
      const pick = pickNextSysDesignSkill(state, mode, prevSkill);
      const q = generateSysDesignQuestion(pick.skillId, pick.level);
      setCurrentQuestion(q);
      setIsRetestQuestion(pick.isRetest);
      setLastSkillId(pick.skillId);
      setNumericInput('');
      setSelectedUnit(q.defaultUnit || (q.unitOptions[0] ? q.unitOptions[0].unit : ''));
      setFeedback(null);
    },
    [],
  );

  const startSession = useCallback(
    (mode: SysDesignSessionMode, continuous: boolean) => {
      setSessionMode(mode);
      setIsContinuous(continuous);
      setSprintResults([]);
      spawnQuestion(sysDesignState, mode, undefined);
      setScreen('quiz');
    },
    [sysDesignState, spawnQuestion],
  );

  const handleNumericSubmit = useCallback(() => {
    if (!currentQuestion || feedback) return;
    const cleaned = numericInput.trim().replace(',', '.');
    const parsed = Number(cleaned);
    if (!cleaned || !Number.isFinite(parsed)) return;

    const timeMs = Math.max(300, Date.now() - questionStartRef.current);
    const evaluation = evaluateSysDesignAnswer(currentQuestion, parsed, selectedUnit);

    const outcome = recordSysDesignAnswer(sysDesignState, {
      skillId: currentQuestion.skillId,
      correct: evaluation.correct,
      timeMs,
    });

    setSysDesignState(outcome.state);
    saveSysDesignState(outcome.state);

    setSprintResults((prev) => [
      ...prev,
      {
        skillId: currentQuestion.skillId,
        level: currentQuestion.level,
        correct: evaluation.correct,
        timeMs,
        userValue: parsed,
        selectedUnit,
      },
    ]);

    setFeedback({
      evaluation,
      userValue: parsed,
      selectedUnit,
      timeMs,
      leveledUp: outcome.leveledUp,
      leveledDown: outcome.leveledDown,
      scheduledRetest: outcome.scheduledRetest,
    });
  }, [currentQuestion, feedback, numericInput, selectedUnit, sysDesignState]);

  const handleNext = useCallback(() => {
    if (!isContinuous && sprintResults.length >= SPRINT_LENGTH) {
      setScreen('summary');
      return;
    }
    spawnQuestion(sysDesignState, sessionMode, lastSkillId);
  }, [
    isContinuous,
    sprintResults.length,
    sysDesignState,
    sessionMode,
    lastSkillId,
    spawnQuestion,
  ]);

  // Keyboard shortcut for Next Question (Enter)
  useEffect(() => {
    if (screen !== 'quiz' || !currentQuestion) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (feedback) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleNext();
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [screen, currentQuestion, feedback, handleNext]);

  const handleResetProgress = () => {
    const fresh = resetSysDesignState();
    setSysDesignState(fresh);
  };

  // Quick stats for Home header
  const totalAttempts = ALL_SYSDESIGN_SKILLS.reduce(
    (sum, id) => sum + sysDesignState.skills[id].attempts,
    0,
  );
  const totalCorrect = ALL_SYSDESIGN_SKILLS.reduce(
    (sum, id) => sum + sysDesignState.skills[id].correct,
    0,
  );
  const overallAccuracy =
    totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0;

  // Render Stats Screen
  if (screen === 'stats') {
    return (
      <div className="min-h-dvh bg-zinc-950 text-zinc-100 px-4 py-6">
        <SysDesignStatsView
          state={sysDesignState}
          onSelectSkill={(skillId) => startSession(skillId, false)}
          onReset={handleResetProgress}
          onBack={() => setScreen('home')}
        />
      </div>
    );
  }

  // Render Summary Screen
  if (screen === 'summary') {
    const correctCount = sprintResults.filter((r) => r.correct).length;
    const avgMs =
      sprintResults.length > 0
        ? sprintResults.reduce((acc, r) => acc + r.timeMs, 0) / sprintResults.length
        : 0;

    return (
      <div className="min-h-dvh bg-zinc-950 text-zinc-100 flex flex-col items-center justify-center px-4 py-8">
        <div className="w-full max-w-md space-y-6">
          <div className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-6 text-center space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-500/15 text-cyan-400">
              <Sparkles className="h-7 w-7" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-zinc-400">
                Sprint System Design Concluído
              </p>
              <h1 className="mt-1 text-4xl font-bold tracking-tight text-white">
                {correctCount} / {sprintResults.length}
              </h1>
              <p className="mt-1 text-sm text-zinc-400">
                Tempo médio por estimativa:{' '}
                <span className="font-semibold text-zinc-200">
                  {formatSeconds(avgMs)}
                </span>
              </p>
            </div>

            <div className="grid grid-cols-5 gap-2 pt-2">
              {sprintResults.map((r, idx) => (
                <div
                  key={idx}
                  title={`${SYSDESIGN_SKILL_META[r.skillId].shortLabel} (${formatSeconds(r.timeMs)})`}
                  className={`flex flex-col items-center justify-center rounded-xl border py-2 text-xs font-medium ${
                    r.correct
                      ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                      : 'border-rose-500/30 bg-rose-500/10 text-rose-300'
                  }`}
                >
                  <span>#{idx + 1}</span>
                  <span className="text-[10px] opacity-80 truncate px-1">
                    {SYSDESIGN_SKILL_META[r.skillId].shortLabel.slice(0, 5)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={() => startSession(sessionMode, isContinuous)}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-cyan-500 px-5 py-4 text-base font-semibold text-zinc-950 transition active:scale-[0.99] hover:bg-cyan-400 cursor-pointer"
            >
              <RotateCcw className="h-5 w-5" />
              <span>Novo Sprint</span>
            </button>
            <button
              type="button"
              onClick={() => setScreen('home')}
              className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-5 py-3.5 text-sm font-medium text-zinc-300 transition hover:bg-zinc-800 cursor-pointer"
            >
              Voltar ao início
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Render Quiz Screen
  if (screen === 'quiz' && currentQuestion) {
    const meta = SYSDESIGN_SKILL_META[currentQuestion.skillId];
    const currentIndex = sprintResults.length + (feedback ? 0 : 1);
    const progressPct = isContinuous
      ? 100
      : Math.min(100, (sprintResults.length / SPRINT_LENGTH) * 100);
    const ContextIcon = SKILL_ICONS[currentQuestion.skillId] || Server;

    return (
      <div className="min-h-dvh bg-zinc-950 text-zinc-100 flex flex-col">
        {/* Top bar */}
        <header className="mx-auto flex w-full max-w-xl items-center justify-between px-4 pt-4 pb-2">
          <button
            type="button"
            onClick={() =>
              sprintResults.length > 0 && isContinuous
                ? setScreen('summary')
                : setScreen('home')
            }
            aria-label="Sair do treino"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-400 transition hover:text-zinc-100 cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="flex items-center gap-2">
            <span className="rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1 text-xs font-medium text-zinc-300">
              {meta.shortLabel} · Nv {currentQuestion.level}
            </span>
            {isRetestQuestion && (
              <span className="rounded-full border border-amber-500/40 bg-amber-500/10 px-2.5 py-1 text-[11px] font-semibold text-amber-300">
                Re-teste
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 text-xs font-mono text-zinc-400">
            <Clock className="h-3.5 w-3.5" />
            <span>
              {feedback
                ? formatSeconds(feedback.timeMs)
                : formatSeconds(elapsedMs)}
            </span>
          </div>
        </header>

        {/* Progress Bar */}
        <div className="mx-auto w-full max-w-xl px-4 pb-3">
          <div className="flex items-center justify-between text-[11px] text-zinc-500 mb-1.5">
            <span>
              {isContinuous
                ? `Questão #${currentIndex}`
                : `Questão ${Math.min(currentIndex, SPRINT_LENGTH)} de ${SPRINT_LENGTH}`}
            </span>
            {isContinuous && sprintResults.length > 0 && (
              <button
                type="button"
                onClick={() => setScreen('summary')}
                className="text-cyan-400 hover:underline cursor-pointer"
              >
                Encerrar e ver resumo
              </button>
            )}
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-900">
            <div
              className="h-full rounded-full bg-cyan-500 transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {/* Main Content */}
        <main className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-between gap-4 px-4 pb-6">
          {/* Question Card */}
          <section className="rounded-3xl border border-zinc-800/90 bg-zinc-900/60 p-5 space-y-3.5">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-1 text-[11px] font-semibold text-cyan-300">
                <ContextIcon className="h-3.5 w-3.5" />
                <span>{currentQuestion.contextTag}</span>
              </span>
              <span className="text-[11px] text-zinc-500 font-medium">
                Margem: ±18% (exato ou atalho 10⁵s)
              </span>
            </div>

            <p className="text-base sm:text-lg font-medium leading-relaxed text-zinc-100 whitespace-pre-line">
              {currentQuestion.prompt}
            </p>
          </section>

          {/* Answer Input OR Feedback */}
          {!feedback ? (
            <div className="space-y-3">
              {/* Scale Selector Pills */}
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider px-1">
                  Unidade da Resposta:
                </span>
                <div className="flex flex-wrap gap-2">
                  {currentQuestion.unitOptions.map((opt) => {
                    const isSelected = selectedUnit === opt.unit;
                    return (
                      <button
                        key={opt.unit}
                        type="button"
                        onClick={() => setSelectedUnit(opt.unit)}
                        className={`flex-1 min-w-[70px] py-2 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all duration-100 active:scale-95 cursor-pointer ${
                          isSelected
                            ? 'bg-cyan-500 text-zinc-950 shadow-md shadow-cyan-950/40 border border-cyan-400'
                            : 'bg-zinc-900 border border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 hover:border-zinc-700'
                        }`}
                      >
                        {opt.unit}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Numeric Keypad */}
              <NumericKeypad
                value={numericInput}
                onChange={setNumericInput}
                onSubmit={handleNumericSubmit}
                allowDecimal={true}
                unit={selectedUnit}
              />
            </div>
          ) : (
            <section className="space-y-4">
              {/* Status Banner */}
              <div
                className={`rounded-3xl border p-5 ${
                  feedback.evaluation.correct
                    ? 'border-emerald-500/40 bg-gradient-to-br from-emerald-500/15 via-zinc-900 to-zinc-900'
                    : 'border-rose-500/40 bg-gradient-to-br from-rose-500/15 via-zinc-900 to-zinc-900'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
                      feedback.evaluation.correct
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-rose-500/20 text-rose-400'
                    }`}
                  >
                    {feedback.evaluation.correct ? (
                      <CheckCircle2 className="h-6 w-6" />
                    ) : (
                      <XCircle className="h-6 w-6" />
                    )}
                  </div>

                  <div className="space-y-1 min-w-0 flex-1">
                    <h2
                      className={`text-base sm:text-lg font-bold leading-tight ${
                        feedback.evaluation.correct ? 'text-emerald-300' : 'text-rose-300'
                      }`}
                    >
                      {feedback.evaluation.correct
                        ? 'Estimativa Aceita!'
                        : 'Fora da Margem de Tolerância'}
                    </h2>

                    <p className="text-xs sm:text-sm text-zinc-200">
                      Sua resposta:{' '}
                      <span className="font-mono font-bold text-white">
                        {feedback.userValue} {feedback.selectedUnit}
                      </span>
                      {feedback.evaluation.correct && (
                        <span className="text-emerald-400 ml-1.5 font-medium text-xs">
                          {feedback.evaluation.matchedMode === 'exact'
                            ? '(Cálculo Exato)'
                            : feedback.evaluation.matchedMode === 'interview'
                              ? '(Atalho 10⁵s)'
                              : '(Aceito: Atalho / Exato)'}
                        </span>
                      )}
                    </p>

                    {!feedback.evaluation.correct && (
                      <div className="pt-1 text-xs text-zinc-300 flex flex-col gap-0.5 font-mono">
                        <span>
                          Atalho entrevista:{' '}
                          <span className="text-cyan-300 font-bold">
                            {currentQuestion.interviewValue} {currentQuestion.canonicalUnit}
                          </span>
                        </span>
                        <span>
                          Cálculo exato:{' '}
                          <span className="text-zinc-100 font-semibold">
                            {currentQuestion.exactValue} {currentQuestion.canonicalUnit}
                          </span>
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Scale Mismatch Warning */}
                {!feedback.evaluation.correct && feedback.evaluation.scaleMismatchUnit && (
                  <div className="mt-3.5 rounded-2xl border border-amber-500/40 bg-amber-500/15 p-3.5 flex items-start gap-2.5 text-xs text-amber-200">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <span>
                      <strong className="font-semibold text-amber-300">
                        Atenção à escala:
                      </strong>{' '}
                      o valor numérico digitado bate em{' '}
                      <strong className="font-bold underline text-white">
                        {feedback.evaluation.scaleMismatchUnit}
                      </strong>
                      , mas você selecionou{' '}
                      <strong className="font-bold text-white">
                        {feedback.selectedUnit}
                      </strong>
                      !
                    </span>
                  </div>
                )}

                {/* Level Progress Pills */}
                {(feedback.leveledUp ||
                  feedback.leveledDown ||
                  (feedback.scheduledRetest && sessionMode === 'mixed')) && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {feedback.leveledUp && (
                      <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-medium text-emerald-200 border border-emerald-500/30">
                        Subiu para Nível {sysDesignState.skills[currentQuestion.skillId].level}
                      </span>
                    )}
                    {feedback.leveledDown && (
                      <span className="rounded-full bg-amber-500/20 px-2.5 py-0.5 text-xs font-medium text-amber-200 border border-amber-500/30">
                        Ajustado para Nível {sysDesignState.skills[currentQuestion.skillId].level} para consolidar
                      </span>
                    )}
                    {feedback.scheduledRetest && sessionMode === 'mixed' && (
                      <span className="rounded-full bg-amber-500/20 px-2.5 py-0.5 text-xs font-medium text-amber-200 border border-amber-500/30">
                        Re-teste com novo cenário agendado
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Side-by-side or Stacked Breakdown Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* 1. Atalho de Entrevista Card */}
                <div className="rounded-3xl border border-cyan-500/30 bg-zinc-900/80 p-4 space-y-2.5">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cyan-400">
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                    <span>Atalho de Entrevista (10⁵s)</span>
                  </div>
                  <ul className="space-y-1.5 text-xs sm:text-sm text-zinc-300">
                    {currentQuestion.interviewShortcutSteps.map((step, i) => (
                      <li key={i} className="flex items-start gap-2 leading-relaxed">
                        <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-400" />
                        <span>{step}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* 2. Cálculo Exato Card */}
                <div className="rounded-3xl border border-zinc-800 bg-zinc-900/80 p-4 space-y-2.5">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-300">
                    <Calculator className="w-4 h-4 text-zinc-400" />
                    <span>Cálculo Exato (86.400s)</span>
                  </div>
                  <ul className="space-y-1.5 text-xs sm:text-sm text-zinc-300">
                    {currentQuestion.exactCalcSteps.map((step, i) => (
                      <li key={i} className="flex items-start gap-2 leading-relaxed">
                        <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-zinc-500" />
                        <span>{step}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Next Button */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={handleNext}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-cyan-500 hover:bg-cyan-400 px-5 py-4 text-base font-bold text-zinc-950 transition active:scale-[0.99] cursor-pointer shadow-lg shadow-cyan-950/40"
                >
                  <span>
                    {!isContinuous && sprintResults.length >= SPRINT_LENGTH
                      ? 'Ver Resumo do Sprint'
                      : 'Próxima Questão'}
                  </span>
                  <ArrowRight className="h-5 w-5" />
                </button>
                <p className="text-center text-[11px] text-zinc-500 mt-2">
                  Dica: no teclado pressione Enter para avançar
                </p>
              </div>
            </section>
          )}
        </main>
      </div>
    );
  }

  // Render Home Screen
  return (
    <div className="min-h-dvh bg-zinc-950 text-zinc-100 px-4 py-6">
      <div className="mx-auto max-w-xl space-y-6">
        {/* Header Slot (e.g. Tab Switcher) */}
        {headerSlot && <div className="w-full">{headerSlot}</div>}

        {/* Home Header */}
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900 text-cyan-400">
              <Server className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white">
                System Design
              </h1>
              <p className="text-xs text-zinc-400">
                Back-of-the-Envelope & Escala
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setScreen('stats')}
            className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs font-medium text-zinc-200 transition hover:border-zinc-700 hover:bg-zinc-800 cursor-pointer"
          >
            <BarChart3 className="h-4 w-4 text-cyan-400" />
            <span>
              {totalAttempts > 0 ? `${overallAccuracy}% (${totalAttempts})` : 'Progresso'}
            </span>
          </button>
        </header>

        {/* Collapsible Âncoras de Ouro (Cheat Sheet) */}
        <section className="rounded-3xl border border-cyan-500/30 bg-zinc-900/70 overflow-hidden shadow-sm">
          <button
            type="button"
            onClick={() => setCheatSheetExpanded((prev) => !prev)}
            className="w-full flex items-center justify-between p-4 sm:p-5 text-left transition hover:bg-zinc-850/50 cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400">
                <BookOpen className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  Âncoras de Ouro (Cheat Sheet)
                </h2>
                <p className="text-[11px] text-zinc-400">
                  Regras de bolso fundamentais para back-of-the-envelope
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 text-zinc-400 text-xs">
              {cheatSheetExpanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </div>
          </button>

          {cheatSheetExpanded && (
            <div className="px-4 pb-4 sm:px-5 sm:pb-5 pt-1 border-t border-zinc-800/60">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-zinc-300">
                {/* Item 1 */}
                <div className="p-2.5 rounded-2xl bg-zinc-950/80 border border-zinc-800 flex flex-col gap-0.5">
                  <span className="text-[10px] uppercase font-bold text-cyan-400 tracking-wider">
                    1. Tempo Diário
                  </span>
                  <span className="font-mono font-semibold text-zinc-100">
                    1 dia = 86.400s ≈ 10⁵s
                  </span>
                  <span className="text-[10px] text-zinc-400">
                    (100.000s facilita divisões mentais)
                  </span>
                </div>

                {/* Item 2 */}
                <div className="p-2.5 rounded-2xl bg-zinc-950/80 border border-zinc-800 flex flex-col gap-0.5">
                  <span className="text-[10px] uppercase font-bold text-cyan-400 tracking-wider">
                    2. Throughput Base
                  </span>
                  <span className="font-mono font-semibold text-zinc-100">
                    1M req/dia ≈ 12 RPS
                  </span>
                  <span className="text-[10px] text-zinc-400">
                    (atalho rápido: 10 RPS)
                  </span>
                </div>

                {/* Item 3 */}
                <div className="p-2.5 rounded-2xl bg-zinc-950/80 border border-zinc-800 flex flex-col gap-0.5">
                  <span className="text-[10px] uppercase font-bold text-cyan-400 tracking-wider">
                    3. Janelas Longas
                  </span>
                  <span className="font-mono font-semibold text-zinc-100">
                    1 mês ≈ 2,5 × 10⁶s
                  </span>
                  <span className="font-mono text-[11px] text-zinc-300">
                    1 ano ≈ 3 × 10⁷s
                  </span>
                </div>

                {/* Item 4 */}
                <div className="p-2.5 rounded-2xl bg-zinc-950/80 border border-zinc-800 flex flex-col gap-0.5">
                  <span className="text-[10px] uppercase font-bold text-cyan-400 tracking-wider">
                    4. Potências & Escalas
                  </span>
                  <span className="font-mono font-semibold text-zinc-100">
                    10³=KB · 10⁶=MB
                  </span>
                  <span className="font-mono font-semibold text-zinc-100">
                    10⁹=GB · 10¹²=TB
                  </span>
                </div>

                {/* Item 5 */}
                <div className="p-2.5 rounded-2xl bg-zinc-950/80 border border-zinc-800 flex flex-col gap-0.5">
                  <span className="text-[10px] uppercase font-bold text-cyan-400 tracking-wider">
                    5. Lei de Little
                  </span>
                  <span className="font-mono font-semibold text-zinc-100">
                    L = λ × W
                  </span>
                  <span className="text-[10px] text-zinc-400">
                    Conexões = RPS × Latência(s)
                  </span>
                </div>

                {/* Item 6 */}
                <div className="p-2.5 rounded-2xl bg-zinc-950/80 border border-zinc-800 flex flex-col gap-0.5">
                  <span className="text-[10px] uppercase font-bold text-cyan-400 tracking-wider">
                    6. Regra 80/20 (Cache)
                  </span>
                  <span className="font-mono font-semibold text-zinc-100">
                    Cachear 20% dos dados
                  </span>
                  <span className="text-[10px] text-zinc-400">
                    para absorver 80% das requisições
                  </span>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Primary Modes */}
        <section className="space-y-3">
          <button
            type="button"
            onClick={() => startSession('mixed', false)}
            className="group flex w-full items-center justify-between rounded-3xl border border-cyan-500/30 bg-gradient-to-br from-cyan-500/15 via-zinc-900 to-zinc-900 p-5 text-left transition hover:border-cyan-400/60 active:scale-[0.99] cursor-pointer"
          >
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-cyan-500/20 px-2.5 py-0.5 text-[11px] font-semibold text-cyan-300">
                <Sparkles className="h-3 w-3" />
                Modo Adaptativo
              </div>
              <h2 className="text-lg font-bold text-white">
                Sprint Back-of-the-Envelope (10 questões)
              </h2>
              <p className="text-xs text-zinc-400">
                Alterna entre os 5 pilares de escala com re-teste adaptativo de erros.
              </p>
            </div>
            <ChevronRight className="h-6 w-6 shrink-0 text-cyan-400 transition group-hover:translate-x-0.5" />
          </button>

          {/* Secondary Quick Modes */}
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => startSession('mixed', true)}
              className="flex flex-col items-start gap-1.5 rounded-2xl border border-zinc-800 bg-zinc-900/70 p-3.5 text-left transition hover:border-zinc-700 hover:bg-zinc-900 cursor-pointer"
            >
              <InfinityIcon className="h-4 w-4 text-cyan-400" />
              <span className="text-xs font-semibold text-zinc-100">Fluxo Contínuo</span>
              <span className="text-[11px] text-zinc-500">Treino sem limite</span>
            </button>

            <button
              type="button"
              onClick={() => setScreen('stats')}
              className="flex flex-col items-start gap-1.5 rounded-2xl border border-zinc-800 bg-zinc-900/70 p-3.5 text-left transition hover:border-zinc-700 hover:bg-zinc-900 cursor-pointer"
            >
              <Scale className="h-4 w-4 text-emerald-400" />
              <span className="text-xs font-semibold text-zinc-100">Matriz de Pilares</span>
              <span className="text-[11px] text-zinc-500">Níveis dos 5 pilares</span>
            </button>
          </div>
        </section>

        {/* Surgical Practice by Pillar */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">
              <Target className="h-3.5 w-3.5 text-cyan-400" />
              Treino Cirúrgico por Pilar
            </h3>
          </div>

          <div className="space-y-2">
            {ALL_SYSDESIGN_SKILLS.map((id) => {
              const meta = SYSDESIGN_SKILL_META[id];
              const stat = sysDesignState.skills[id];
              const acc =
                stat.attempts > 0
                  ? Math.round((stat.correct / stat.attempts) * 100)
                  : null;
              const IconComponent = SKILL_ICONS[id] || Server;

              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => startSession(id, false)}
                  className="flex w-full items-center justify-between gap-3 rounded-2xl border border-zinc-800/90 bg-zinc-900/50 px-4 py-3 text-left transition hover:border-zinc-700 hover:bg-zinc-900 active:scale-[0.99] cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400">
                      <IconComponent className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-zinc-100 truncate">
                          {meta.label}
                        </span>
                        {stat.retestPending && (
                          <span className="rounded-full bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-[10px] font-semibold text-amber-300">
                            Re-teste
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-zinc-400 truncate">
                        {meta.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2.5">
                    <div className="text-right">
                      <div className="text-xs font-semibold text-zinc-200">
                        Nv {stat.level}
                      </div>
                      <div className="text-[11px] text-zinc-500">
                        {acc !== null ? `${acc}%` : 'Novo'}
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-zinc-600" />
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
};
