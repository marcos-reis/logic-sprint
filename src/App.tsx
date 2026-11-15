import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Zap,
  Calculator,
  Brain,
  BarChart3,
  X,
  CheckCircle2,
  XCircle,
  ArrowRight,
  RotateCcw,
  Sparkles,
  Clock,
  Infinity as InfinityIcon,
  Target,
  ChevronRight,
  Lightbulb,
  Code2,
  Server,
  Download,
} from 'lucide-react';
import { AlgoArena } from './components/AlgoArena';
import { SysDesignArena } from './components/SysDesignArena';
import { useInstallPrompt } from './hooks/useInstallPrompt';
import {
  ALL_SKILLS,
  SKILL_META,
  type AdaptiveState,
  type DifficultyLevel,
  type Question,
  type SessionMode,
  type SkillId,
} from './engine/types';
import {
  loadAdaptiveState,
  pickNextSkill,
  recordAnswer,
  resetAdaptiveState,
  saveAdaptiveState,
} from './engine/adaptive';
import { generateQuestion } from './generators';
import { NumericKeypad } from './components/NumericKeypad';
import { MatrixSvg } from './components/MatrixSvg';
import { StatsView } from './components/StatsView';

type ViewScreen = 'home' | 'quiz' | 'summary' | 'stats';

interface SprintRoundSummary {
  skillId: SkillId;
  level: DifficultyLevel;
  correct: boolean;
  timeMs: number;
}

interface FeedbackState {
  correct: boolean;
  userDisplay: string;
  correctDisplay: string;
  timeMs: number;
  leveledUp: boolean;
  leveledDown: boolean;
  scheduledRetest: boolean;
}

const SPRINT_LENGTH = 10;

function formatSeconds(ms: number): string {
  return `${(ms / 1000).toFixed(1)}s`;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'sprint' | 'algo' | 'sysdesign'>('sprint');
  const { canInstall, triggerInstall } = useInstallPrompt();
  const [adaptiveState, setAdaptiveState] = useState<AdaptiveState>(() =>
    loadAdaptiveState(),
  );
  const [screen, setScreen] = useState<ViewScreen>('home');

  // Sessão ativa
  const [sessionMode, setSessionMode] = useState<SessionMode>('mixed');
  const [isContinuous, setIsContinuous] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [isRetestQuestion, setIsRetestQuestion] = useState(false);
  const [lastSkillId, setLastSkillId] = useState<SkillId | undefined>(undefined);
  const [numericInput, setNumericInput] = useState('');
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const [sprintResults, setSprintResults] = useState<SprintRoundSummary[]>([]);
  const [elapsedMs, setElapsedMs] = useState(0);

  const questionStartRef = useRef<number>(Date.now());

  // Timer leve para feedback e métrica adaptativa
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
    (state: AdaptiveState, mode: SessionMode, prevSkill?: SkillId) => {
      const pick = pickNextSkill(state, mode, prevSkill);
      const q = generateQuestion(pick.skillId, pick.level);
      setCurrentQuestion(q);
      setIsRetestQuestion(pick.isRetest);
      setLastSkillId(pick.skillId);
      setNumericInput('');
      setSelectedOptionId(null);
      setFeedback(null);
    },
    [],
  );

  const startSession = useCallback(
    (mode: SessionMode, continuous: boolean) => {
      setSessionMode(mode);
      setIsContinuous(continuous);
      setSprintResults([]);
      spawnQuestion(adaptiveState, mode, undefined);
      setScreen('quiz');
    },
    [adaptiveState, spawnQuestion],
  );

  const commitResult = useCallback(
    (
      question: Question,
      isCorrect: boolean,
      userDisplay: string,
      correctDisplay: string,
    ) => {
      const timeMs = Math.max(300, Date.now() - questionStartRef.current);
      const outcome = recordAnswer(adaptiveState, {
        skillId: question.skillId,
        level: question.level,
        correct: isCorrect,
        timeMs,
      });

      setAdaptiveState(outcome.state);
      saveAdaptiveState(outcome.state);

      setSprintResults((prev) => [
        ...prev,
        {
          skillId: question.skillId,
          level: question.level,
          correct: isCorrect,
          timeMs,
        },
      ]);

      setFeedback({
        correct: isCorrect,
        userDisplay,
        correctDisplay,
        timeMs,
        leveledUp: outcome.leveledUp,
        leveledDown: outcome.leveledDown,
        scheduledRetest: outcome.scheduledRetest,
      });
    },
    [adaptiveState],
  );

  const handleNumericSubmit = useCallback(() => {
    if (!currentQuestion || currentQuestion.kind !== 'numeric' || feedback) return;
    const cleaned = numericInput.trim().replace(',', '.');
    const parsed = Number(cleaned);
    if (!cleaned || Number.isNaN(parsed)) return;

    const isCorrect = Math.abs(parsed - currentQuestion.answer) < 1e-6;
    const unitSuffix = currentQuestion.unit ? ` ${currentQuestion.unit}` : '';
    commitResult(
      currentQuestion,
      isCorrect,
      `${numericInput}${unitSuffix}`,
      `${currentQuestion.answer}${unitSuffix}`,
    );
  }, [currentQuestion, feedback, numericInput, commitResult]);

  const handleChoiceSelect = useCallback(
    (optionId: string) => {
      if (!currentQuestion || currentQuestion.kind !== 'choice' || feedback) return;
      setSelectedOptionId(optionId);

      const chosen = currentQuestion.options.find((o) => o.id === optionId);
      const expected = currentQuestion.options.find(
        (o) => o.id === currentQuestion.correctOptionId,
      );

      const isCorrect = optionId === currentQuestion.correctOptionId;
      const userLabel = chosen?.label ?? 'Opção selecionada';
      const correctLabel = expected?.label ?? 'Padrão correto na matriz';

      commitResult(currentQuestion, isCorrect, userLabel, correctLabel);
    },
    [currentQuestion, feedback, commitResult],
  );

  const handleNext = useCallback(() => {
    if (!isContinuous && sprintResults.length >= SPRINT_LENGTH) {
      setScreen('summary');
      return;
    }
    spawnQuestion(adaptiveState, sessionMode, lastSkillId);
  }, [
    isContinuous,
    sprintResults.length,
    adaptiveState,
    sessionMode,
    lastSkillId,
    spawnQuestion,
  ]);

  // Atalhos de teclado no desktop para opções (1-4) e próxima questão (Enter)
  useEffect(() => {
    if (screen !== 'quiz' || !currentQuestion) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (feedback) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleNext();
        }
        return;
      }

      if (currentQuestion.kind === 'choice') {
        const idx = ['1', '2', '3', '4'].indexOf(e.key);
        if (idx !== -1 && currentQuestion.options[idx]) {
          e.preventDefault();
          handleChoiceSelect(currentQuestion.options[idx].id);
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [screen, currentQuestion, feedback, handleNext, handleChoiceSelect]);

  const handleResetProgress = () => {
    const fresh = resetAdaptiveState();
    setAdaptiveState(fresh);
  };

  // Estatísticas rápidas para a Home
  const totalAttempts = ALL_SKILLS.reduce(
    (sum, id) => sum + adaptiveState.skills[id].attempts,
    0,
  );
  const totalCorrect = ALL_SKILLS.reduce(
    (sum, id) => sum + adaptiveState.skills[id].correct,
    0,
  );
  const overallAccuracy =
    totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0;

  const tabSwitcher = (
    <div className="space-y-2.5">
      <nav
        aria-label="Modos de treino"
        className="grid grid-cols-3 gap-1 rounded-2xl border border-zinc-800/90 bg-zinc-900/70 p-1.5"
      >
        <button
          type="button"
          onClick={() => setActiveTab('sprint')}
          className={`flex items-center justify-center gap-1.5 rounded-xl px-2 py-2 text-xs font-semibold transition cursor-pointer ${
            activeTab === 'sprint'
              ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700/70'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Zap className={`h-3.5 w-3.5 shrink-0 ${activeTab === 'sprint' ? 'text-cyan-400' : ''}`} />
          <span className="truncate">Mental</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('algo')}
          className={`flex items-center justify-center gap-1.5 rounded-xl px-2 py-2 text-xs font-semibold transition cursor-pointer ${
            activeTab === 'algo'
              ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700/70'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Code2 className={`h-3.5 w-3.5 shrink-0 ${activeTab === 'algo' ? 'text-cyan-400' : ''}`} />
          <span className="truncate">Algoritmos</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('sysdesign')}
          className={`flex items-center justify-center gap-1.5 rounded-xl px-2 py-2 text-xs font-semibold transition cursor-pointer ${
            activeTab === 'sysdesign'
              ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700/70'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Server className={`h-3.5 w-3.5 shrink-0 ${activeTab === 'sysdesign' ? 'text-cyan-400' : ''}`} />
          <span className="truncate">SysDesign</span>
        </button>
      </nav>

      {canInstall && (
        <button
          type="button"
          onClick={() => void triggerInstall()}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-cyan-500/35 bg-cyan-500/10 px-4 py-2.5 text-xs font-semibold text-cyan-300 transition hover:bg-cyan-500/20 active:scale-[0.99] cursor-pointer"
        >
          <Download className="h-3.5 w-3.5" />
          <span>Instalar Logic Sprint como App Offline</span>
        </button>
      )}
    </div>
  );

  if (activeTab === 'algo') {
    return <AlgoArena headerSlot={tabSwitcher} />;
  }

  if (activeTab === 'sysdesign') {
    return <SysDesignArena headerSlot={tabSwitcher} />;
  }

  if (screen === 'stats') {
    return (
      <div className="min-h-dvh bg-zinc-950 text-zinc-100 px-4 py-6">
        <StatsView
          state={adaptiveState}
          onSelectSkill={(skillId) => startSession(skillId, false)}
          onReset={handleResetProgress}
          onBack={() => setScreen('home')}
        />
      </div>
    );
  }

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
                Sprint Concluído
              </p>
              <h1 className="mt-1 text-4xl font-bold tracking-tight text-white">
                {correctCount} / {sprintResults.length}
              </h1>
              <p className="mt-1 text-sm text-zinc-400">
                Tempo médio por questão:{' '}
                <span className="font-semibold text-zinc-200">
                  {formatSeconds(avgMs)}
                </span>
              </p>
            </div>

            <div className="grid grid-cols-5 gap-2 pt-2">
              {sprintResults.map((r, idx) => (
                <div
                  key={idx}
                  title={`${SKILL_META[r.skillId].shortLabel} (${formatSeconds(r.timeMs)})`}
                  className={`flex flex-col items-center justify-center rounded-xl border py-2 text-xs font-medium ${
                    r.correct
                      ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                      : 'border-rose-500/30 bg-rose-500/10 text-rose-300'
                  }`}
                >
                  <span>#{idx + 1}</span>
                  <span className="text-[10px] opacity-80">
                    {SKILL_META[r.skillId].shortLabel.slice(0, 4)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={() => startSession(sessionMode, isContinuous)}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-cyan-500 px-5 py-4 text-base font-semibold text-zinc-950 transition active:scale-[0.99] hover:bg-cyan-400"
            >
              <RotateCcw className="h-5 w-5" />
              Novo Sprint
            </button>
            <button
              type="button"
              onClick={() => setScreen('home')}
              className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-5 py-3.5 text-sm font-medium text-zinc-300 transition hover:bg-zinc-800"
            >
              Voltar ao início
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (screen === 'quiz' && currentQuestion) {
    const meta = SKILL_META[currentQuestion.skillId];
    const currentIndex = sprintResults.length + (feedback ? 0 : 1);
    const progressPct = isContinuous
      ? 100
      : Math.min(100, (sprintResults.length / SPRINT_LENGTH) * 100);

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
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-400 transition hover:text-zinc-100"
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
                className="text-cyan-400 hover:underline"
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
          <section className="rounded-3xl border border-zinc-800/90 bg-zinc-900/60 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-800/80 px-2.5 py-1 text-[11px] font-medium text-cyan-300">
                {currentQuestion.pillar === 'math' ? (
                  <Calculator className="h-3.5 w-3.5" />
                ) : (
                  <Brain className="h-3.5 w-3.5" />
                )}
                {currentQuestion.contextTag}
              </span>
            </div>

            <p className="text-lg sm:text-xl font-medium leading-snug text-zinc-100 whitespace-pre-line">
              {currentQuestion.prompt}
            </p>

            {/* 3x3 Visual Matrix */}
            {currentQuestion.kind === 'choice' && currentQuestion.matrixGrid && (
              <div className="mx-auto grid max-w-[270px] grid-cols-3 gap-2 pt-1">
                {currentQuestion.matrixGrid.map((cell, idx) => (
                  <div
                    key={idx}
                    className={`aspect-square flex items-center justify-center rounded-2xl border ${
                      cell === null
                        ? 'border-dashed border-cyan-500/60 bg-cyan-500/5 text-xl font-bold text-cyan-400'
                        : 'border-zinc-800 bg-zinc-950/90'
                    }`}
                  >
                    {cell ? <MatrixSvg cell={cell} size={68} /> : '?'}
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Answer Input OR Feedback */}
          {!feedback ? (
            currentQuestion.kind === 'numeric' ? (
              <NumericKeypad
                value={numericInput}
                onChange={setNumericInput}
                onSubmit={handleNumericSubmit}
                allowDecimal={Boolean(currentQuestion.allowDecimal)}
                unit={currentQuestion.unit}
              />
            ) : (
              <div
                className={
                  currentQuestion.matrixGrid
                    ? 'grid grid-cols-2 gap-3'
                    : 'flex flex-col gap-2.5'
                }
              >
                {currentQuestion.options.map((opt, idx) =>
                  opt.matrixCell ? (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => handleChoiceSelect(opt.id)}
                      className="group relative flex items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900/80 p-3 transition hover:border-cyan-500/60 hover:bg-zinc-900 active:scale-[0.98]"
                    >
                      <span className="absolute top-2 left-2.5 text-[11px] font-mono text-zinc-500 group-hover:text-cyan-400">
                        {idx + 1}
                      </span>
                      <MatrixSvg cell={opt.matrixCell} size={72} />
                    </button>
                  ) : (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => handleChoiceSelect(opt.id)}
                      className="flex items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/80 px-4 py-3.5 text-left text-sm sm:text-base font-medium text-zinc-100 transition hover:border-cyan-500/60 hover:bg-zinc-900 active:scale-[0.99]"
                    >
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-950 text-xs font-mono text-zinc-400">
                        {idx + 1}
                      </span>
                      <span>{opt.label}</span>
                    </button>
                  ),
                )}
              </div>
            )
          ) : (
            <section className="space-y-3">
              {/* Status Banner */}
              <div
                className={`rounded-2xl border p-4 ${
                  feedback.correct
                    ? 'border-emerald-500/40 bg-emerald-500/10'
                    : 'border-rose-500/40 bg-rose-500/10'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    {feedback.correct ? (
                      <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-emerald-400" />
                    ) : (
                      <XCircle className="mt-0.5 h-6 w-6 shrink-0 text-rose-400" />
                    )}
                    <div>
                      <p
                        className={`text-base font-semibold ${
                          feedback.correct ? 'text-emerald-300' : 'text-rose-300'
                        }`}
                      >
                        {feedback.correct ? 'Boa! Resposta exata' : 'Quase lá'}
                      </p>
                      {!feedback.correct && (
                        <p className="mt-0.5 text-sm text-zinc-300">
                          Sua resposta:{' '}
                          <span className="line-through text-zinc-400">
                            {feedback.userDisplay}
                          </span>{' '}
                          · Correta:{' '}
                          <span className="font-bold text-white">
                            {feedback.correctDisplay}
                          </span>
                        </p>
                      )}
                      {currentQuestion.kind === 'choice' &&
                        currentQuestion.matrixGrid &&
                        !feedback.correct && (
                          <div className="mt-2 flex items-center gap-2">
                            <span className="text-xs text-zinc-400">Padrão esperado:</span>
                            {(() => {
                              const expectedCell = currentQuestion.options.find(
                                (o) => o.id === currentQuestion.correctOptionId,
                              )?.matrixCell;
                              return expectedCell ? (
                                <div className="rounded-xl border border-emerald-500/40 bg-zinc-950 p-1">
                                  <MatrixSvg cell={expectedCell} size={44} />
                                </div>
                              ) : null;
                            })()}
                          </div>
                        )}
                    </div>
                  </div>
                </div>

                {(feedback.leveledUp ||
                  feedback.leveledDown ||
                  (feedback.scheduledRetest && sessionMode === 'mixed')) && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {feedback.leveledUp && (
                      <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-medium text-emerald-200">
                        Subiu para Nível {adaptiveState.skills[currentQuestion.skillId].level}
                      </span>
                    )}
                    {feedback.leveledDown && (
                      <span className="rounded-full bg-amber-500/20 px-2.5 py-0.5 text-xs font-medium text-amber-200">
                        Ajustado para Nível {adaptiveState.skills[currentQuestion.skillId].level} para consolidar
                      </span>
                    )}
                    {feedback.scheduledRetest && sessionMode === 'mixed' && (
                      <span className="rounded-full bg-amber-500/20 px-2.5 py-0.5 text-xs font-medium text-amber-200">
                        Re-teste com novo cenário agendado
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Heuristic Mental Breakdown */}
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4 space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-cyan-400">
                  <Lightbulb className="h-4 w-4" />
                  <span>{currentQuestion.heuristicTitle}</span>
                </div>
                <ol className="space-y-1.5 text-sm text-zinc-300 list-decimal list-inside">
                  {currentQuestion.heuristicSteps.map((step, i) => (
                    <li key={i} className="leading-relaxed">
                      {step}
                    </li>
                  ))}
                </ol>
              </div>

              {/* Next Button */}
              <button
                type="button"
                onClick={handleNext}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-cyan-500 px-5 py-4 text-base font-semibold text-zinc-950 transition hover:bg-cyan-400 active:scale-[0.99]"
              >
                <span>
                  {!isContinuous && sprintResults.length >= SPRINT_LENGTH
                    ? 'Ver Resumo do Sprint'
                    : 'Próxima Questão'}
                </span>
                <ArrowRight className="h-5 w-5" />
              </button>

              {selectedOptionId && !feedback.correct && (
                <p className="text-center text-[11px] text-zinc-500">
                  Dica: no desktop pressione Enter para avançar
                </p>
              )}
            </section>
          )}
        </main>
      </div>
    );
  }

  // Home Screen
  return (
    <div className="min-h-dvh bg-zinc-950 text-zinc-100 px-4 py-6">
      <div className="mx-auto max-w-xl space-y-6">
        {tabSwitcher}

        {/* Header */}
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900 text-cyan-400">
              <Zap className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white">
                Logic Sprint
              </h1>
              <p className="text-xs text-zinc-400">
                Cálculo mental & raciocínio adaptativo
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setScreen('stats')}
            className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs font-medium text-zinc-200 transition hover:border-zinc-700 hover:bg-zinc-800"
          >
            <BarChart3 className="h-4 w-4 text-cyan-400" />
            <span>
              {totalAttempts > 0 ? `${overallAccuracy}% (${totalAttempts})` : 'Progresso'}
            </span>
          </button>
        </header>

        {/* Primary Modes */}
        <section className="space-y-3">
          <button
            type="button"
            onClick={() => startSession('mixed', false)}
            className="group flex w-full items-center justify-between rounded-3xl border border-cyan-500/30 bg-gradient-to-br from-cyan-500/15 via-zinc-900 to-zinc-900 p-5 text-left transition hover:border-cyan-400/60 active:scale-[0.99]"
          >
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-cyan-500/20 px-2.5 py-0.5 text-[11px] font-semibold text-cyan-300">
                <Sparkles className="h-3 w-3" />
                Modo Adaptativo
              </div>
              <h2 className="text-lg font-bold text-white">
                Sprint Misto (10 questões)
              </h2>
              <p className="text-xs text-zinc-400">
                Alterna cálculo e lógica e re-testa seus erros com novos cenários.
              </p>
            </div>
            <ChevronRight className="h-6 w-6 shrink-0 text-cyan-400 transition group-hover:translate-x-0.5" />
          </button>

          <div className="grid grid-cols-3 gap-2.5">
            <button
              type="button"
              onClick={() => startSession('mixed', true)}
              className="flex flex-col items-start gap-1.5 rounded-2xl border border-zinc-800 bg-zinc-900/70 p-3.5 text-left transition hover:border-zinc-700 hover:bg-zinc-900"
            >
              <InfinityIcon className="h-4 w-4 text-cyan-400" />
              <span className="text-xs font-semibold text-zinc-100">Contínuo</span>
              <span className="text-[11px] text-zinc-500">Sem limite</span>
            </button>

            <button
              type="button"
              onClick={() => startSession('math_only', false)}
              className="flex flex-col items-start gap-1.5 rounded-2xl border border-zinc-800 bg-zinc-900/70 p-3.5 text-left transition hover:border-zinc-700 hover:bg-zinc-900"
            >
              <Calculator className="h-4 w-4 text-emerald-400" />
              <span className="text-xs font-semibold text-zinc-100">Só Cálculo</span>
              <span className="text-[11px] text-zinc-500">10 contas</span>
            </button>

            <button
              type="button"
              onClick={() => startSession('logic_only', false)}
              className="flex flex-col items-start gap-1.5 rounded-2xl border border-zinc-800 bg-zinc-900/70 p-3.5 text-left transition hover:border-zinc-700 hover:bg-zinc-900"
            >
              <Brain className="h-4 w-4 text-violet-400" />
              <span className="text-xs font-semibold text-zinc-100">Só Lógica</span>
              <span className="text-[11px] text-zinc-500">10 desafios</span>
            </button>
          </div>
        </section>

        {/* Surgical Practice by Skill */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">
              <Target className="h-3.5 w-3.5 text-cyan-400" />
              Treino Cirúrgico por Habilidade
            </h3>
          </div>

          <div className="space-y-2">
            {ALL_SKILLS.map((id) => {
              const meta = SKILL_META[id];
              const stat = adaptiveState.skills[id];
              const acc =
                stat.attempts > 0
                  ? Math.round((stat.correct / stat.attempts) * 100)
                  : null;

              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => startSession(id, false)}
                  className="flex w-full items-center justify-between gap-3 rounded-2xl border border-zinc-800/90 bg-zinc-900/50 px-4 py-3 text-left transition hover:border-zinc-700 hover:bg-zinc-900 active:scale-[0.99]"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                        meta.pillar === 'math'
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : 'bg-violet-500/10 text-violet-400'
                      }`}
                    >
                      {meta.pillar === 'math' ? (
                        <Calculator className="h-4 w-4" />
                      ) : (
                        <Brain className="h-4 w-4" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-zinc-100 truncate">
                          {meta.label}
                        </span>
                        {stat.retestPending && (
                          <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold text-amber-300">
                            Re-teste
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-zinc-500 truncate">
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
}
