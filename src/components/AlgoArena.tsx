import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Code2,
  Sparkles,
  Brain,
  Clock,
  X,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Copy,
  Check,
  BarChart3,
  Target,
  AlertTriangle,
  Layers,
  Cpu,
} from 'lucide-react';
import {
  ALL_ALGO_PATTERNS,
  ALGO_PATTERN_META,
  type AlgoAdaptiveState,
  type AlgoPatternId,
  type AlgoProblemTemplate,
  type AlgoDryRunSpec,
  type AlgoStepQuestion,
} from '../algo/types';
import {
  loadAlgoState,
  saveAlgoState,
  resetAlgoState,
  pickNextAlgoProblem,
  recordAlgoResult,
} from '../algo/adaptive';
import { ALGO_PROBLEMS } from '../algo';
import { AlgoStatsView } from './AlgoStatsView';

export interface AlgoArenaProps {
  headerSlot?: React.ReactNode;
}

type AlgoViewScreen = 'home' | 'solve' | 'reveal' | 'stats';

interface LastOutcome {
  problem: AlgoProblemTemplate;
  mistakesCount: number;
  hintsUsed: number;
  timeMs: number;
  wasAutonomous: boolean;
  scheduledRetest: boolean;
}

const STEP_LABELS = [
  '1. Gargalo',
  '2. Padrão',
  '3. Invariante',
  '4. Dry-Run',
] as const;

function formatElapsed(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const mins = Math.floor(totalSec / 60);
  const secs = totalSec % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export const AlgoArena: React.FC<AlgoArenaProps> = ({ headerSlot }) => {
  const [algoState, setAlgoState] = useState<AlgoAdaptiveState>(() =>
    loadAlgoState(),
  );
  const [screen, setScreen] = useState<AlgoViewScreen>('home');

  // Session state
  const [sessionMode, setSessionMode] = useState<'adaptive' | AlgoPatternId>('adaptive');
  const [sprintTotalRounds, setSprintTotalRounds] = useState<number>(1);
  const [sprintCompletedCount, setSprintCompletedCount] = useState<number>(0);

  // Active problem state
  const [currentProblem, setCurrentProblem] = useState<AlgoProblemTemplate | null>(null);
  const [isRetest, setIsRetest] = useState<boolean>(false);
  const [lastProblemId, setLastProblemId] = useState<string | undefined>(undefined);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [dryRunSpec, setDryRunSpec] = useState<AlgoDryRunSpec | null>(null);

  // Per-problem progress & interactions
  const [wrongOptionIdsByStep, setWrongOptionIdsByStep] = useState<Record<number, string[]>>({});
  const [stepSolved, setStepSolved] = useState<boolean>(false);
  const [hintRevealedByStep, setHintRevealedByStep] = useState<Record<number, boolean>>({});
  const [mistakesCount, setMistakesCount] = useState<number>(0);
  const [hintsUsedCount, setHintsUsedCount] = useState<number>(0);
  const [statementExpanded, setStatementExpanded] = useState<boolean>(true);
  const [elapsedMs, setElapsedMs] = useState<number>(0);

  // Reveal screen state
  const [lastOutcome, setLastOutcome] = useState<LastOutcome | null>(null);
  const [copiedTs, setCopiedTs] = useState<boolean>(false);

  const problemStartRef = useRef<number>(Date.now());

  // Live timer for active problem
  useEffect(() => {
    if (screen !== 'solve' || !currentProblem) return;

    const interval = window.setInterval(() => {
      setElapsedMs(Date.now() - problemStartRef.current);
    }, 200);

    return () => window.clearInterval(interval);
  }, [screen, currentProblem]);

  // Spawns problem
  const spawnAlgoProblem = useCallback(
    (
      state: AlgoAdaptiveState,
      mode: 'adaptive' | AlgoPatternId,
      prevProblemId?: string,
    ) => {
      if (!ALGO_PROBLEMS || ALGO_PROBLEMS.length === 0) return;

      const pick = pickNextAlgoProblem(state, mode, ALGO_PROBLEMS, prevProblemId);
      const problem = pick.problem;
      const dryRun = problem.generateDryRun();

      setCurrentProblem(problem);
      setIsRetest(pick.isRetest);
      setLastProblemId(problem.id);
      setDryRunSpec(dryRun);
      setCurrentStepIndex(0);
      setWrongOptionIdsByStep({});
      setStepSolved(false);
      setHintRevealedByStep({});
      setMistakesCount(0);
      setHintsUsedCount(0);
      setStatementExpanded(true);
      setElapsedMs(0);
      problemStartRef.current = Date.now();
    },
    [],
  );

  const startSession = useCallback(
    (mode: 'adaptive' | AlgoPatternId, totalRounds = 1) => {
      setSessionMode(mode);
      setSprintTotalRounds(totalRounds);
      setSprintCompletedCount(0);
      spawnAlgoProblem(algoState, mode, undefined);
      setScreen('solve');
    },
    [algoState, spawnAlgoProblem],
  );

  // Get current step question
  const getCurrentStepQuestion = (): AlgoStepQuestion | AlgoDryRunSpec | null => {
    if (!currentProblem) return null;
    if (currentStepIndex >= 0 && currentStepIndex <= 2) {
      return currentProblem.steps[currentStepIndex];
    }
    if (currentStepIndex === 3) {
      return dryRunSpec;
    }
    return null;
  };

  const handleRevealHint = () => {
    if (hintRevealedByStep[currentStepIndex]) return;
    setHintRevealedByStep((prev) => ({ ...prev, [currentStepIndex]: true }));
    setHintsUsedCount((prev) => prev + 1);
  };

  const handleOptionClick = (optionId: string) => {
    const stepQuestion = getCurrentStepQuestion();
    if (!stepQuestion || stepSolved) return;

    const wrongAlready = wrongOptionIdsByStep[currentStepIndex] || [];
    if (wrongAlready.includes(optionId)) return;

    if (optionId === stepQuestion.correctOptionId) {
      setStepSolved(true);
    } else {
      setWrongOptionIdsByStep((prev) => ({
        ...prev,
        [currentStepIndex]: [...(prev[currentStepIndex] || []), optionId],
      }));
      setMistakesCount((prev) => prev + 1);
    }
  };

  const handleNextStep = useCallback(() => {
    if (!currentProblem || !stepSolved) return;

    if (currentStepIndex < 3) {
      setCurrentStepIndex((prev) => prev + 1);
      setStepSolved(false);
      // Collapse statement on step 2+ to give more room on mobile
      if (currentStepIndex === 0) {
        setStatementExpanded(false);
      }
    } else {
      // Step 4 (Dry-Run) completed -> Record result and show Reveal
      const totalTimeMs = Math.max(1000, Date.now() - problemStartRef.current);
      const outcome = recordAlgoResult(algoState, {
        patternId: currentProblem.patternId,
        problemId: currentProblem.id,
        mistakesCount,
        hintsUsed: hintsUsedCount,
        timeMs: totalTimeMs,
      });

      setAlgoState(outcome.state);
      saveAlgoState(outcome.state);

      setLastOutcome({
        problem: currentProblem,
        mistakesCount,
        hintsUsed: hintsUsedCount,
        timeMs: totalTimeMs,
        wasAutonomous: outcome.wasAutonomous,
        scheduledRetest: outcome.scheduledRetest,
      });

      setCopiedTs(false);
      setScreen('reveal');
    }
  }, [
    currentProblem,
    stepSolved,
    currentStepIndex,
    algoState,
    mistakesCount,
    hintsUsedCount,
  ]);

  // Keyboard shortcuts for options (1-4) and Next Step (Enter)
  useEffect(() => {
    if (screen !== 'solve' || !currentProblem) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (stepSolved) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleNextStep();
        }
        return;
      }

      const stepQuestion = getCurrentStepQuestion();
      if (!stepQuestion) return;

      const idx = ['1', '2', '3', '4'].indexOf(e.key);
      if (idx !== -1 && stepQuestion.options[idx]) {
        e.preventDefault();
        handleOptionClick(stepQuestion.options[idx].id);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [screen, currentProblem, stepSolved, handleNextStep, currentStepIndex]);

  const handleCopyTs = async () => {
    if (!currentProblem?.tsSkeleton) return;
    try {
      await navigator.clipboard.writeText(currentProblem.tsSkeleton);
      setCopiedTs(true);
      setTimeout(() => setCopiedTs(false), 2000);
    } catch {
      // Fallback if clipboard is blocked
    }
  };

  const handleNextChallenge = () => {
    const nextCompleted = sprintCompletedCount + 1;
    setSprintCompletedCount(nextCompleted);

    if (sprintTotalRounds > 1 && nextCompleted < sprintTotalRounds) {
      spawnAlgoProblem(algoState, sessionMode, lastProblemId);
      setScreen('solve');
    } else if (sprintTotalRounds > 1 && nextCompleted >= sprintTotalRounds) {
      // Finished multi-round sprint
      setScreen('home');
    } else {
      // Continuous / single adaptive challenge
      spawnAlgoProblem(algoState, sessionMode, lastProblemId);
      setScreen('solve');
    }
  };

  const handleResetAlgoProgress = () => {
    const fresh = resetAlgoState();
    setAlgoState(fresh);
  };

  // Quick stats for Home header
  const totalRounds = algoState.totalRounds;
  const totalAttempts = ALL_ALGO_PATTERNS.reduce(
    (sum, id) => sum + algoState.patterns[id].attempts,
    0,
  );
  const totalAutonomous = ALL_ALGO_PATTERNS.reduce(
    (sum, id) => sum + algoState.patterns[id].autonomousCorrect,
    0,
  );
  const overallAutonomyPct =
    totalAttempts > 0 ? Math.round((totalAutonomous / totalAttempts) * 100) : 0;

  // Render Stats Screen
  if (screen === 'stats') {
    return (
      <div className="min-h-dvh bg-zinc-950 text-zinc-100 px-4 py-6">
        <AlgoStatsView
          state={algoState}
          onSelectPattern={(patternId) => startSession(patternId, 1)}
          onReset={handleResetAlgoProgress}
          onBack={() => setScreen('home')}
        />
      </div>
    );
  }

  // Render Reveal Screen
  if (screen === 'reveal' && lastOutcome) {
    const { problem, wasAutonomous, mistakesCount: mistakes, hintsUsed: hints, scheduledRetest } =
      lastOutcome;
    const meta = ALGO_PATTERN_META[problem.patternId];

    return (
      <div className="min-h-dvh bg-zinc-950 text-zinc-100 flex flex-col justify-between px-4 py-6">
        <div className="mx-auto w-full max-w-2xl space-y-5">
          {/* Top Exit */}
          <div className="flex items-center justify-between border-b border-zinc-850 pb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <Code2 className="w-4 h-4 text-cyan-400" />
              {meta.label} · {problem.difficulty}
            </span>
            <button
              type="button"
              onClick={() => setScreen('home')}
              className="p-1.5 rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-zinc-100 transition"
              aria-label="Voltar para início"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Autonomy Result Banner */}
          <div
            className={`rounded-3xl border p-5 ${
              wasAutonomous
                ? 'border-emerald-500/40 bg-gradient-to-br from-emerald-500/15 via-zinc-900 to-zinc-900'
                : 'border-cyan-500/30 bg-gradient-to-br from-cyan-500/10 via-zinc-900 to-zinc-900'
            }`}
          >
            <div className="flex items-start gap-3.5">
              <div
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
                  wasAutonomous
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'bg-cyan-500/20 text-cyan-400'
                }`}
              >
                {wasAutonomous ? (
                  <Sparkles className="h-6 w-6" />
                ) : (
                  <Brain className="h-6 w-6" />
                )}
              </div>
              <div className="space-y-1">
                <h1 className="text-lg sm:text-xl font-bold text-white">
                  {wasAutonomous
                    ? 'Resolvido com Autonomia!'
                    : 'Resolvido com Guia'}
                </h1>
                <p className="text-xs sm:text-sm text-zinc-300">
                  {wasAutonomous
                    ? 'Nenhum erro e nenhuma dica utilizada nos 4 degraus. Padrão assimilado com precisão mental.'
                    : `${mistakes} erro(s) e ${hints} dica(s) utilizada(s). O caminho do algoritmo foi consolidado.`}
                </p>
                {scheduledRetest && (
                  <div className="pt-2 flex items-center gap-1.5">
                    <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/40 bg-amber-500/15 px-2.5 py-0.5 text-xs font-medium text-amber-300">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Re-teste em outro cenário agendado
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Síntese Mental Card */}
          <div className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-5 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cyan-400">
              <Brain className="w-4 h-4" />
              <span>Síntese Mental & Invariantes</span>
            </div>
            <ul className="space-y-2 text-sm text-zinc-200">
              {problem.synthesis.map((bullet, idx) => (
                <li key={idx} className="flex items-start gap-2 leading-relaxed">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-400" />
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Esqueleto TypeScript Card */}
          <div className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cyan-400">
                <Code2 className="w-4 h-4" />
                <span>Esqueleto em TypeScript</span>
              </div>
              <button
                type="button"
                onClick={handleCopyTs}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-700 bg-zinc-800 hover:bg-zinc-700/80 text-xs font-semibold text-zinc-200 transition active:scale-98 cursor-pointer"
              >
                {copiedTs ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-300">Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar TS</span>
                  </>
                )}
              </button>
            </div>

            <pre className="overflow-x-auto rounded-2xl bg-zinc-950 p-4 font-mono text-xs sm:text-sm text-zinc-200 border border-zinc-800/80 leading-relaxed">
              <code>{problem.tsSkeleton}</code>
            </pre>
          </div>

          {/* Passo a Passo na Prática Card */}
          <div className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-5 space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cyan-400">
              <Layers className="w-4 h-4" />
              <span>Passo a Passo na Prática (Momentos da Execução)</span>
            </div>

            {/* Reference Input */}
            <div className="rounded-2xl border border-zinc-800/80 bg-zinc-950/70 p-3 text-xs font-mono flex flex-wrap items-baseline gap-2">
              <span className="font-sans font-medium text-zinc-400">Entrada de Referência:</span>
              <span className="text-cyan-300 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800 break-all">
                {problem.example.input}
              </span>
            </div>

            {/* Timeline Moments */}
            <div className="space-y-2.5">
              {problem.traceSteps.map((step, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl border border-zinc-800/90 bg-zinc-950/60 p-3.5 space-y-1.5 transition hover:border-zinc-700"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-0.5 text-[11px] font-bold text-cyan-300 shrink-0">
                      Momento {idx + 1}
                    </span>
                    <span className="text-xs font-medium text-zinc-300 text-right">
                      {step.moment}
                    </span>
                  </div>
                  <div className="pt-1 border-t border-zinc-850">
                    <p className="font-mono text-xs text-emerald-300/90 bg-zinc-900/80 px-2.5 py-1.5 rounded-xl border border-zinc-800 leading-relaxed break-all">
                      {step.state}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              type="button"
              onClick={handleNextChallenge}
              className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-bold px-5 py-4 text-base transition active:scale-[0.99] cursor-pointer"
            >
              <span>
                {sprintTotalRounds > 1 &&
                sprintCompletedCount + 1 < sprintTotalRounds
                  ? `Próximo Desafio (${sprintTotalRounds - (sprintCompletedCount + 1)} restantes)`
                  : 'Próximo Desafio'}
              </span>
              <ArrowRight className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => setScreen('home')}
              className="rounded-2xl border border-zinc-800 bg-zinc-900 hover:bg-zinc-850 text-zinc-300 font-semibold px-5 py-3.5 text-sm transition text-center cursor-pointer"
            >
              Voltar aos Padrões
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Render Solve Screen
  if (screen === 'solve' && currentProblem) {
    const meta = ALGO_PATTERN_META[currentProblem.patternId];
    const stepQuestion = getCurrentStepQuestion();
    const wrongOptions = wrongOptionIdsByStep[currentStepIndex] || [];
    const hintRevealed = Boolean(hintRevealedByStep[currentStepIndex]);

    return (
      <div className="min-h-dvh bg-zinc-950 text-zinc-100 flex flex-col">
        {/* Top Header Bar */}
        <header className="mx-auto flex w-full max-w-xl items-center justify-between px-4 pt-4 pb-2">
          <button
            type="button"
            onClick={() => setScreen('home')}
            aria-label="Sair do desafio"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-400 transition hover:text-zinc-100 cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="flex items-center gap-2">
            <span className="rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1 text-xs font-semibold text-zinc-200">
              {meta.shortLabel}
            </span>
            <span
              className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold border ${
                currentProblem.difficulty === 'Fácil'
                  ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                  : 'border-amber-500/40 bg-amber-500/10 text-amber-300'
              }`}
            >
              {currentProblem.difficulty}
            </span>
            {isRetest && (
              <span className="rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-[11px] font-semibold text-amber-300">
                Re-teste
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 text-xs font-mono text-zinc-400">
            <Clock className="h-3.5 w-3.5" />
            <span>{formatElapsed(elapsedMs)}</span>
          </div>
        </header>

        {/* 4-Step Progress Indicator */}
        <div className="mx-auto w-full max-w-xl px-4 pb-3">
          <div className="grid grid-cols-4 gap-1.5">
            {STEP_LABELS.map((label, idx) => {
              const isPast = idx < currentStepIndex;
              const isCurrent = idx === currentStepIndex;

              return (
                <div key={label} className="flex flex-col gap-1">
                  <div
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      isPast
                        ? 'bg-emerald-400'
                        : isCurrent
                          ? 'bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.5)]'
                          : 'bg-zinc-800'
                    }`}
                  />
                  <span
                    className={`text-[10px] font-medium text-center truncate ${
                      isCurrent
                        ? 'text-cyan-300 font-semibold'
                        : isPast
                          ? 'text-emerald-400'
                          : 'text-zinc-500'
                    }`}
                  >
                    {label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Main Content Area */}
        <main className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-between gap-4 px-4 pb-6">
          {/* Problem Statement Card */}
          <section className="rounded-3xl border border-zinc-800/90 bg-zinc-900/60 p-4 sm:p-5 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-cyan-400">
                  Problema
                </span>
                <h2 className="text-base sm:text-lg font-bold text-white leading-tight">
                  {currentProblem.title}
                </h2>
              </div>

              {/* Collapsible toggle for step 1+ */}
              {currentStepIndex > 0 && (
                <button
                  type="button"
                  onClick={() => setStatementExpanded((prev) => !prev)}
                  className="p-1.5 rounded-xl border border-zinc-800 bg-zinc-850 text-zinc-400 hover:text-zinc-200 text-xs flex items-center gap-1 cursor-pointer shrink-0"
                >
                  {statementExpanded ? (
                    <>
                      <ChevronUp className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Recolher</span>
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Enunciado</span>
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Statement Body & Context Details (collapsible on step 1+) */}
            {statementExpanded && (
              <div className="space-y-3 pt-1 border-t border-zinc-800/60">
                <p className="text-sm sm:text-base text-zinc-200 leading-relaxed whitespace-pre-line">
                  {currentProblem.statement}
                </p>

                {/* Exemplo na prática */}
                <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-3.5 space-y-1.5">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-cyan-400/90">
                    Exemplo na prática
                  </div>
                  <div className="space-y-1 font-mono text-xs">
                    <div className="flex flex-wrap items-baseline gap-1.5">
                      <span className="font-sans font-medium text-zinc-400">Entrada:</span>
                      <span className="text-cyan-300 bg-zinc-900/90 px-1.5 py-0.5 rounded border border-zinc-800 break-all">
                        {currentProblem.example.input}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-baseline gap-1.5">
                      <span className="font-sans font-medium text-zinc-400">Saída:</span>
                      <span className="text-emerald-300 bg-zinc-900/90 px-1.5 py-0.5 rounded border border-zinc-800 break-all">
                        {currentProblem.example.output}
                      </span>
                    </div>
                  </div>
                  {currentProblem.example.note && (
                    <p className="text-xs text-zinc-400 pt-0.5 leading-relaxed">
                      {currentProblem.example.note}
                    </p>
                  )}
                </div>

                {/* Limites da Entrada (Pistas de Escala) */}
                <div className="space-y-1.5 pt-0.5">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                    Limites da Entrada (Pistas de Escala)
                  </span>
                  <ul className="space-y-1">
                    {currentProblem.constraints.map((constraint, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-zinc-300 leading-relaxed">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-400/70" />
                        <span>{constraint}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </section>

          {/* Active Step Question Card */}
          {stepQuestion && (
            <section className="space-y-4">
              <div className="rounded-3xl border border-zinc-800 bg-zinc-900/80 p-4 sm:p-5 space-y-3.5">
                {/* Step Header & Hint Trigger */}
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-1 text-xs font-bold text-cyan-300">
                    <Target className="w-3.5 h-3.5" />
                    <span>
                      Degrau {currentStepIndex + 1}/4 ·{' '}
                      {'title' in stepQuestion
                        ? stepQuestion.title
                        : 'Dry-Run Mental & Corner Case'}
                    </span>
                  </span>

                  {!hintRevealed ? (
                    <button
                      type="button"
                      onClick={handleRevealHint}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 hover:text-amber-200 text-xs font-semibold transition active:scale-98 cursor-pointer"
                    >
                      <Lightbulb className="w-3.5 h-3.5" />
                      <span>Névoa de Guerra (Dica)</span>
                    </button>
                  ) : (
                    <span className="text-[11px] font-medium text-amber-400/80 flex items-center gap-1">
                      <Lightbulb className="w-3 h-3 text-amber-400" />
                      Dica revelada
                    </span>
                  )}
                </div>

                {/* Step Prompt */}
                <p className="text-sm sm:text-base font-semibold leading-snug text-zinc-100">
                  {stepQuestion.prompt}
                </p>

                {/* Revealed Hint Box */}
                {hintRevealed && (
                  <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-xs sm:text-sm text-amber-200 leading-relaxed flex items-start gap-2">
                    <Lightbulb className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <span>{stepQuestion.hint}</span>
                  </div>
                )}
              </div>

              {/* 4 Options Grid/Stack */}
              <div className="flex flex-col gap-2.5">
                {stepQuestion.options.map((opt, idx) => {
                  const isWrong = wrongOptions.includes(opt.id);
                  const isCorrect = stepSolved && opt.id === stepQuestion.correctOptionId;

                  let buttonStyle =
                    'border-zinc-800 bg-zinc-900/80 text-zinc-100 hover:border-cyan-500/60 hover:bg-zinc-900 active:scale-[0.99] cursor-pointer';

                  if (isCorrect) {
                    buttonStyle =
                      'border-emerald-500/50 bg-emerald-500/15 text-emerald-200 font-semibold shadow-[0_0_12px_rgba(16,185,129,0.2)]';
                  } else if (isWrong) {
                    buttonStyle =
                      'border-rose-500/30 bg-rose-500/10 text-rose-300 line-through opacity-60 cursor-not-allowed';
                  }

                  return (
                    <button
                      key={opt.id}
                      type="button"
                      disabled={isWrong || stepSolved}
                      onClick={() => handleOptionClick(opt.id)}
                      className={`flex items-center gap-3 rounded-2xl border px-4 py-3.5 text-left text-sm sm:text-base font-medium transition duration-150 ${buttonStyle}`}
                    >
                      <span
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border text-xs font-mono font-bold ${
                          isCorrect
                            ? 'border-emerald-500/50 bg-emerald-500/20 text-emerald-200'
                            : isWrong
                              ? 'border-rose-500/40 bg-rose-500/20 text-rose-300'
                              : 'border-zinc-700 bg-zinc-950 text-zinc-400'
                        }`}
                      >
                        {idx + 1}
                      </span>
                      <span className="flex-1">{opt.label}</span>
                      {isCorrect && (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                      )}
                      {isWrong && (
                        <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Wrong click nudge */}
              {wrongOptions.length > 0 && !stepSolved && (
                <p className="text-center text-xs text-rose-400/90 font-medium">
                  Não exatamente — releia as restrições do problema ou abra a Dica.
                </p>
              )}

              {/* Solved Explanation & Next Step Button */}
              {stepSolved && (
                <div className="space-y-3 pt-1">
                  <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 space-y-1.5 text-sm text-emerald-100">
                    <div className="flex items-center gap-1.5 font-bold text-emerald-300 text-xs uppercase tracking-wider">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Degrau Concluído</span>
                    </div>
                    <p className="leading-relaxed text-zinc-200">
                      {stepQuestion.explanation}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-cyan-500 hover:bg-cyan-400 px-5 py-4 text-base font-bold text-zinc-950 transition active:scale-[0.99] cursor-pointer shadow-lg shadow-cyan-950/40"
                  >
                    <span>
                      {currentStepIndex < 3
                        ? 'Próximo Degrau'
                        : 'Ver Síntese & Código TS'}
                    </span>
                    <ArrowRight className="h-5 w-5" />
                  </button>

                  <p className="text-center text-[11px] text-zinc-500">
                    Pressione Enter para avançar
                  </p>
                </div>
              )}
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
        {/* Optional Header Slot (e.g. Tab Switcher) */}
        {headerSlot && <div className="w-full">{headerSlot}</div>}

        {/* Home Header */}
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900 text-cyan-400">
              <Code2 className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white">
                Caminho das Pedras
              </h1>
              <p className="text-xs text-zinc-400">
                Padrões & invariantes algorítmicos em 4 degraus
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
              {totalAttempts > 0
                ? `${overallAutonomyPct}% (${totalRounds})`
                : 'Progresso'}
            </span>
          </button>
        </header>

        {/* Hero CTAs */}
        <section className="space-y-3">
          {/* Main Adaptive Challenge Button */}
          <button
            type="button"
            onClick={() => startSession('adaptive', 1)}
            className="group flex w-full items-center justify-between rounded-3xl border border-cyan-500/30 bg-gradient-to-br from-cyan-500/15 via-zinc-900 to-zinc-900 p-5 text-left transition hover:border-cyan-400/60 active:scale-[0.99] cursor-pointer"
          >
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-cyan-500/20 px-2.5 py-0.5 text-[11px] font-semibold text-cyan-300">
                <Sparkles className="h-3 w-3" />
                Treino Adaptativo
              </div>
              <h2 className="text-lg font-bold text-white">Desafio Adaptativo</h2>
              <p className="text-xs text-zinc-400">
                Identifica suas lacunas nos 8 padrões e re-testa erros com novos problemas.
              </p>
            </div>
            <ChevronRight className="h-6 w-6 shrink-0 text-cyan-400 transition group-hover:translate-x-0.5" />
          </button>

          {/* Secondary Quick Modes */}
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => startSession('adaptive', 3)}
              className="flex flex-col items-start gap-1.5 rounded-2xl border border-zinc-800 bg-zinc-900/70 p-3.5 text-left transition hover:border-zinc-700 hover:bg-zinc-900 cursor-pointer"
            >
              <Layers className="h-4 w-4 text-cyan-400" />
              <span className="text-xs font-semibold text-zinc-100">
                Sessão de 3 Padrões
              </span>
              <span className="text-[11px] text-zinc-500">
                3 algoritmos em sequência
              </span>
            </button>

            <button
              type="button"
              onClick={() => setScreen('stats')}
              className="flex flex-col items-start gap-1.5 rounded-2xl border border-zinc-800 bg-zinc-900/70 p-3.5 text-left transition hover:border-zinc-700 hover:bg-zinc-900 cursor-pointer"
            >
              <Cpu className="h-4 w-4 text-emerald-400" />
              <span className="text-xs font-semibold text-zinc-100">
                Matriz de Padrões
              </span>
              <span className="text-[11px] text-zinc-500">
                Autonomia dos 8 temas
              </span>
            </button>
          </div>
        </section>

        {/* Surgical Practice by Pattern */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">
              <Target className="h-3.5 w-3.5 text-cyan-400" />
              Treino Cirúrgico por Padrão
            </h3>
          </div>

          <div className="space-y-2">
            {ALL_ALGO_PATTERNS.map((id) => {
              const meta = ALGO_PATTERN_META[id];
              const stat = algoState.patterns[id];
              const autonomyRate =
                stat.attempts > 0
                  ? Math.round((stat.autonomousCorrect / stat.attempts) * 100)
                  : null;

              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => startSession(id, 1)}
                  className="flex w-full items-center justify-between gap-3 rounded-2xl border border-zinc-800/90 bg-zinc-900/50 px-4 py-3 text-left transition hover:border-zinc-700 hover:bg-zinc-900 active:scale-[0.99] cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400">
                      <Code2 className="h-4 w-4" />
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
                        {meta.signalSummary}
                      </p>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2.5">
                    <div className="text-right">
                      <div className="text-xs font-semibold text-zinc-200">
                        {autonomyRate !== null ? `${autonomyRate}%` : 'Novo'}
                      </div>
                      <div className="text-[10px] text-zinc-500">
                        {stat.attempts > 0
                          ? `${stat.autonomousCorrect}/${stat.attempts}`
                          : 'sem treino'}
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