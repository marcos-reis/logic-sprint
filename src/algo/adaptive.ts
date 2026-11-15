import {
  ALL_ALGO_PATTERNS,
  type AlgoAdaptiveState,
  type AlgoPatternId,
  type AlgoPatternStats,
  type AlgoProblemTemplate,
} from './types';

const ALGO_STORAGE_KEY = 'logic_sprint_algo_v1';
const ALGO_SCHEMA_VERSION = 1;

function createPatternStats(patternId: AlgoPatternId): AlgoPatternStats {
  return {
    patternId,
    attempts: 0,
    autonomousCorrect: 0,
    guidedCorrect: 0,
    avgTimeMs: 0,
    cooldown: 0,
    retestPending: false,
    lastProblemId: undefined,
    lastSeenRound: 0,
  };
}

export function createInitialAlgoState(): AlgoAdaptiveState {
  const patterns = {} as Record<AlgoPatternId, AlgoPatternStats>;
  for (const id of ALL_ALGO_PATTERNS) {
    patterns[id] = createPatternStats(id);
  }
  return {
    version: ALGO_SCHEMA_VERSION,
    totalRounds: 0,
    patterns,
  };
}

export function loadAlgoState(): AlgoAdaptiveState {
  try {
    const raw = localStorage.getItem(ALGO_STORAGE_KEY);
    if (!raw) return createInitialAlgoState();
    const parsed = JSON.parse(raw) as Partial<AlgoAdaptiveState>;
    if (parsed.version !== ALGO_SCHEMA_VERSION || !parsed.patterns) {
      return createInitialAlgoState();
    }
    const base = createInitialAlgoState();
    for (const id of ALL_ALGO_PATTERNS) {
      if (parsed.patterns[id]) {
        base.patterns[id] = { ...base.patterns[id], ...parsed.patterns[id] };
      }
    }
    base.totalRounds = typeof parsed.totalRounds === 'number' ? parsed.totalRounds : 0;
    return base;
  } catch {
    return createInitialAlgoState();
  }
}

export function saveAlgoState(state: AlgoAdaptiveState): void {
  try {
    localStorage.setItem(ALGO_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignora quota errors em ambientes restritos
  }
}

export function resetAlgoState(): AlgoAdaptiveState {
  const fresh = createInitialAlgoState();
  saveAlgoState(fresh);
  return fresh;
}

export interface AlgoPickResult {
  problem: AlgoProblemTemplate;
  isRetest: boolean;
}

export function pickNextAlgoProblem(
  state: AlgoAdaptiveState,
  mode: 'adaptive' | AlgoPatternId,
  catalog: readonly AlgoProblemTemplate[],
  lastProblemId?: string,
  rng: () => number = Math.random,
): AlgoPickResult {
  const selectProblemForPattern = (patternId: AlgoPatternId): AlgoProblemTemplate => {
    const matching = catalog.filter((p) => p.patternId === patternId);
    const stats = state.patterns[patternId];
    const fresh = matching.filter(
      (p) => p.id !== stats.lastProblemId && p.id !== lastProblemId,
    );
    const pool = fresh.length > 0 ? fresh : matching.filter((p) => p.id !== lastProblemId);
    const finalPool = pool.length > 0 ? pool : matching;
    return finalPool[Math.floor(rng() * finalPool.length)];
  };

  if (mode !== 'adaptive') {
    const stats = state.patterns[mode];
    return {
      problem: selectProblemForPattern(mode),
      isRetest: stats.retestPending && stats.cooldown === 0,
    };
  }

  const lastPatternId = lastProblemId
    ? catalog.find((p) => p.id === lastProblemId)?.patternId
    : undefined;

  // 1. Re-teste devido: padrão que teve erro/dica e cujo cooldown zerou
  const retestDue = ALL_ALGO_PATTERNS.filter((id) => {
    const s = state.patterns[id];
    return s.retestPending && s.cooldown === 0 && id !== lastPatternId;
  });
  if (retestDue.length > 0) {
    const pickedPattern = retestDue[0];
    return {
      problem: selectProblemForPattern(pickedPattern),
      isRetest: true,
    };
  }

  // 2. Prioriza padrões fora de cooldown, menos vistos e com menor autonomia
  const nonRepeated = ALL_ALGO_PATTERNS.filter((id) => id !== lastPatternId);
  const offCooldown = nonRepeated.filter((id) => state.patterns[id].cooldown === 0);
  const pool = offCooldown.length > 0 ? offCooldown : nonRepeated;

  const scored = pool.map((id) => {
    const s = state.patterns[id];
    const autonomyRate = s.attempts === 0 ? 0.4 : s.autonomousCorrect / s.attempts;
    const staleness = Math.min(state.totalRounds - s.lastSeenRound, 10);
    const unseenBonus = s.attempts === 0 ? 2.5 : 0;
    const weaknessBonus = (1 - autonomyRate) * 2.2;
    const noise = rng() * 1.2;
    return {
      id,
      score: unseenBonus + weaknessBonus + staleness * 0.25 + noise,
    };
  });

  scored.sort((a, b) => b.score - a.score);
  const chosen = scored[0].id;
  return {
    problem: selectProblemForPattern(chosen),
    isRetest: state.patterns[chosen].retestPending,
  };
}

export interface AlgoRecordOutcome {
  state: AlgoAdaptiveState;
  wasAutonomous: boolean;
  scheduledRetest: boolean;
}

export function recordAlgoResult(
  state: AlgoAdaptiveState,
  params: {
    patternId: AlgoPatternId;
    problemId: string;
    mistakesCount: number;
    hintsUsed: number;
    timeMs: number;
  },
  rng: () => number = Math.random,
): AlgoRecordOutcome {
  const nextRound = state.totalRounds + 1;
  const nextPatterns = { ...state.patterns };

  for (const id of ALL_ALGO_PATTERNS) {
    if (id !== params.patternId && nextPatterns[id].cooldown > 0) {
      nextPatterns[id] = {
        ...nextPatterns[id],
        cooldown: nextPatterns[id].cooldown - 1,
      };
    }
  }

  const prev = nextPatterns[params.patternId];
  const wasAutonomous = params.mistakesCount === 0 && params.hintsUsed === 0;
  const attempts = prev.attempts + 1;
  const avgTimeMs =
    prev.attempts === 0
      ? params.timeMs
      : Math.round((prev.avgTimeMs * prev.attempts + params.timeMs) / attempts);

  const scheduledRetest = !wasAutonomous;
  const cooldown = scheduledRetest ? 2 + (rng() < 0.5 ? 0 : 1) : 0;

  nextPatterns[params.patternId] = {
    patternId: params.patternId,
    attempts,
    autonomousCorrect: prev.autonomousCorrect + (wasAutonomous ? 1 : 0),
    guidedCorrect: prev.guidedCorrect + (wasAutonomous ? 0 : 1),
    avgTimeMs,
    cooldown,
    retestPending: scheduledRetest,
    lastProblemId: params.problemId,
    lastSeenRound: nextRound,
  };

  return {
    state: {
      version: ALGO_SCHEMA_VERSION,
      totalRounds: nextRound,
      patterns: nextPatterns,
    },
    wasAutonomous,
    scheduledRetest,
  };
}
