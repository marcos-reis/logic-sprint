import {
  ALL_SKILLS,
  AdaptiveState,
  DifficultyLevel,
  SKILL_META,
  SessionMode,
  SkillId,
  SkillStats,
} from './types';

const STORAGE_KEY = 'logic_sprint_adaptive_v1';
const SCHEMA_VERSION = 1;
const MAX_HISTORY = 100;

function createSkillStats(skillId: SkillId): SkillStats {
  return {
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
}

export function createInitialAdaptiveState(): AdaptiveState {
  const skills = {} as Record<SkillId, SkillStats>;
  for (const id of ALL_SKILLS) {
    skills[id] = createSkillStats(id);
  }
  return {
    version: SCHEMA_VERSION,
    totalRounds: 0,
    skills,
    recentHistory: [],
  };
}

export function loadAdaptiveState(): AdaptiveState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createInitialAdaptiveState();
    const parsed = JSON.parse(raw) as Partial<AdaptiveState>;
    if (parsed.version !== SCHEMA_VERSION || !parsed.skills) {
      return createInitialAdaptiveState();
    }
    const base = createInitialAdaptiveState();
    for (const id of ALL_SKILLS) {
      if (parsed.skills[id]) {
        base.skills[id] = { ...base.skills[id], ...parsed.skills[id] };
      }
    }
    base.totalRounds = typeof parsed.totalRounds === 'number' ? parsed.totalRounds : 0;
    base.recentHistory = Array.isArray(parsed.recentHistory)
      ? parsed.recentHistory.slice(-MAX_HISTORY)
      : [];
    return base;
  } catch {
    return createInitialAdaptiveState();
  }
}

export function saveAdaptiveState(state: AdaptiveState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignora quota errors silenciosamente em ambiente restrito
  }
}

export function resetAdaptiveState(): AdaptiveState {
  const fresh = createInitialAdaptiveState();
  saveAdaptiveState(fresh);
  return fresh;
}

export function getCandidateSkills(mode: SessionMode): SkillId[] {
  if (mode === 'mixed') return [...ALL_SKILLS];
  if (mode === 'math_only') {
    return ALL_SKILLS.filter((id) => SKILL_META[id].pillar === 'math');
  }
  if (mode === 'logic_only') {
    return ALL_SKILLS.filter((id) => SKILL_META[id].pillar === 'logic');
  }
  return [mode];
}

export interface NextPick {
  skillId: SkillId;
  level: DifficultyLevel;
  isRetest: boolean;
}

export function pickNextSkill(
  state: AdaptiveState,
  mode: SessionMode,
  lastSkillId?: SkillId,
  rng: () => number = Math.random,
): NextPick {
  const candidates = getCandidateSkills(mode);
  if (candidates.length === 1) {
    const stats = state.skills[candidates[0]];
    return {
      skillId: candidates[0],
      level: stats.level,
      isRetest: stats.retestPending && stats.cooldown === 0,
    };
  }

  // 1. Re-teste devido: habilidade errada cujo cooldown acabou de zerar
  const retestDue = candidates.filter((id) => {
    const s = state.skills[id];
    return s.retestPending && s.cooldown === 0 && id !== lastSkillId;
  });
  if (retestDue.length > 0) {
    const chosen = retestDue[0];
    return {
      skillId: chosen,
      level: state.skills[chosen].level,
      isRetest: true,
    };
  }

  // 2. Evita repetir a mesma habilidade consecutivamente e respeita cooldown ativo quando possível
  const nonRepeated = candidates.filter((id) => id !== lastSkillId);
  const offCooldown = nonRepeated.filter((id) => state.skills[id].cooldown === 0);
  const pool = offCooldown.length > 0 ? offCooldown : nonRepeated;

  // 3. Prioridade ponderada: favorece pilares alternados, habilidades com menor acurácia e menos vistas
  const lastPillar = lastSkillId ? SKILL_META[lastSkillId].pillar : null;

  const scored = pool.map((id) => {
    const s = state.skills[id];
    const accuracy = s.attempts === 0 ? 0.5 : s.correct / s.attempts;
    const staleness = Math.min(state.totalRounds - s.lastSeenRound, 10);
    const pillarBonus = lastPillar && SKILL_META[id].pillar !== lastPillar ? 1.8 : 0;
    const weaknessBonus = (1 - accuracy) * 2.5;
    const unseenBonus = s.attempts === 0 ? 2.0 : 0;
    const noise = rng() * 1.4;
    return {
      id,
      score: pillarBonus + weaknessBonus + unseenBonus + staleness * 0.25 + noise,
    };
  });

  scored.sort((a, b) => b.score - a.score);
  const picked = scored[0].id;
  return {
    skillId: picked,
    level: state.skills[picked].level,
    isRetest: state.skills[picked].retestPending,
  };
}

export interface AnswerOutcome {
  state: AdaptiveState;
  leveledUp: boolean;
  leveledDown: boolean;
  scheduledRetest: boolean;
}

export function recordAnswer(
  state: AdaptiveState,
  params: {
    skillId: SkillId;
    level: DifficultyLevel;
    correct: boolean;
    timeMs: number;
    timestamp?: number;
  },
  rng: () => number = Math.random,
): AnswerOutcome {
  const nextRound = state.totalRounds + 1;
  const nextSkills = { ...state.skills };

  // Decrementa cooldown das demais habilidades a cada rodada
  for (const id of ALL_SKILLS) {
    if (id !== params.skillId && nextSkills[id].cooldown > 0) {
      nextSkills[id] = {
        ...nextSkills[id],
        cooldown: nextSkills[id].cooldown - 1,
      };
    }
  }

  const prev = nextSkills[params.skillId];
  const fastThresholdMs = SKILL_META[params.skillId].pillar === 'math' ? 14000 : 20000;
  const isFast = params.timeMs <= fastThresholdMs;

  const attempts = prev.attempts + 1;
  const correctCount = prev.correct + (params.correct ? 1 : 0);
  const avgTimeMs =
    prev.attempts === 0
      ? params.timeMs
      : Math.round((prev.avgTimeMs * prev.attempts + params.timeMs) / attempts);

  let nextLevel: DifficultyLevel = prev.level;
  let nextStreak = prev.streak;
  let leveledUp = false;
  let leveledDown = false;
  let scheduledRetest = false;
  let cooldown = 0;
  let retestPending = false;

  if (params.correct) {
    nextStreak = prev.streak + 1;
    // Sobe de nível com 2 acertos seguidos rápidos (ou 3 seguidos normais)
    const requiredStreak = isFast ? 2 : 3;
    if (nextStreak >= requiredStreak && prev.level < 3) {
      nextLevel = (prev.level + 1) as DifficultyLevel;
      nextStreak = 0;
      leveledUp = true;
    }
  } else {
    nextStreak = 0;
    // Regra inspirada no teste: coloca em cooldown de 3 a 4 rodadas para re-teste disfarçado
    cooldown = 3 + (rng() < 0.5 ? 0 : 1);
    retestPending = true;
    scheduledRetest = true;

    // Se já estava sem streak e no nível > 1, recua 1 nível para reconstruir base
    if (prev.streak === 0 && prev.level > 1) {
      nextLevel = (prev.level - 1) as DifficultyLevel;
      leveledDown = true;
    }
  }

  nextSkills[params.skillId] = {
    skillId: params.skillId,
    level: nextLevel,
    attempts,
    correct: correctCount,
    streak: nextStreak,
    avgTimeMs,
    cooldown,
    retestPending,
    lastSeenRound: nextRound,
  };

  const nextHistory = [
    ...state.recentHistory,
    {
      round: nextRound,
      skillId: params.skillId,
      level: params.level,
      correct: params.correct,
      timeMs: params.timeMs,
      timestamp: params.timestamp ?? Date.now(),
    },
  ].slice(-MAX_HISTORY);

  return {
    state: {
      version: SCHEMA_VERSION,
      totalRounds: nextRound,
      skills: nextSkills,
      recentHistory: nextHistory,
    },
    leveledUp,
    leveledDown,
    scheduledRetest,
  };
}
