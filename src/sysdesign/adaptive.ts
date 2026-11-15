import {
  ALL_SYSDESIGN_SKILLS,
  type SysDesignAdaptiveState,
  type SysDesignDifficulty,
  type SysDesignSessionMode,
  type SysDesignSkillId,
  type SysDesignSkillStats,
} from './types';

const SYSDESIGN_STORAGE_KEY = 'logic_sprint_sysdesign_v1';
const SYSDESIGN_SCHEMA_VERSION = 1;

function createSkillStats(skillId: SysDesignSkillId): SysDesignSkillStats {
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

export function createInitialSysDesignState(): SysDesignAdaptiveState {
  const skills = {} as Record<SysDesignSkillId, SysDesignSkillStats>;
  for (const id of ALL_SYSDESIGN_SKILLS) {
    skills[id] = createSkillStats(id);
  }
  return {
    version: SYSDESIGN_SCHEMA_VERSION,
    totalRounds: 0,
    skills,
  };
}

export function loadSysDesignState(): SysDesignAdaptiveState {
  try {
    const raw = localStorage.getItem(SYSDESIGN_STORAGE_KEY);
    if (!raw) return createInitialSysDesignState();
    const parsed = JSON.parse(raw) as Partial<SysDesignAdaptiveState>;
    if (parsed.version !== SYSDESIGN_SCHEMA_VERSION || !parsed.skills) {
      return createInitialSysDesignState();
    }
    const base = createInitialSysDesignState();
    for (const id of ALL_SYSDESIGN_SKILLS) {
      if (parsed.skills[id]) {
        base.skills[id] = { ...base.skills[id], ...parsed.skills[id] };
      }
    }
    base.totalRounds = typeof parsed.totalRounds === 'number' ? parsed.totalRounds : 0;
    return base;
  } catch {
    return createInitialSysDesignState();
  }
}

export function saveSysDesignState(state: SysDesignAdaptiveState): void {
  try {
    localStorage.setItem(SYSDESIGN_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignora quota errors em ambientes restritos
  }
}

export function resetSysDesignState(): SysDesignAdaptiveState {
  const fresh = createInitialSysDesignState();
  saveSysDesignState(fresh);
  return fresh;
}

export interface SysDesignPick {
  skillId: SysDesignSkillId;
  level: SysDesignDifficulty;
  isRetest: boolean;
}

export function pickNextSysDesignSkill(
  state: SysDesignAdaptiveState,
  mode: SysDesignSessionMode,
  lastSkillId?: SysDesignSkillId,
  rng: () => number = Math.random,
): SysDesignPick {
  if (mode !== 'mixed') {
    const s = state.skills[mode];
    return {
      skillId: mode,
      level: s.level,
      isRetest: s.retestPending && s.cooldown === 0,
    };
  }

  const retestDue = ALL_SYSDESIGN_SKILLS.filter((id) => {
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

  const nonRepeated = ALL_SYSDESIGN_SKILLS.filter((id) => id !== lastSkillId);
  const offCooldown = nonRepeated.filter((id) => state.skills[id].cooldown === 0);
  const pool = offCooldown.length > 0 ? offCooldown : nonRepeated;

  const scored = pool.map((id) => {
    const s = state.skills[id];
    const accuracy = s.attempts === 0 ? 0.5 : s.correct / s.attempts;
    const staleness = Math.min(state.totalRounds - s.lastSeenRound, 10);
    const weaknessBonus = (1 - accuracy) * 2.5;
    const unseenBonus = s.attempts === 0 ? 2.2 : 0;
    const noise = rng() * 1.3;
    return {
      id,
      score: weaknessBonus + unseenBonus + staleness * 0.25 + noise,
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

export interface SysDesignOutcome {
  state: SysDesignAdaptiveState;
  leveledUp: boolean;
  leveledDown: boolean;
  scheduledRetest: boolean;
}

export function recordSysDesignAnswer(
  state: SysDesignAdaptiveState,
  params: {
    skillId: SysDesignSkillId;
    correct: boolean;
    timeMs: number;
  },
  rng: () => number = Math.random,
): SysDesignOutcome {
  const nextRound = state.totalRounds + 1;
  const nextSkills = { ...state.skills };

  for (const id of ALL_SYSDESIGN_SKILLS) {
    if (id !== params.skillId && nextSkills[id].cooldown > 0) {
      nextSkills[id] = {
        ...nextSkills[id],
        cooldown: nextSkills[id].cooldown - 1,
      };
    }
  }

  const prev = nextSkills[params.skillId];
  const isFast = params.timeMs <= 25000;
  const attempts = prev.attempts + 1;
  const correctCount = prev.correct + (params.correct ? 1 : 0);
  const avgTimeMs =
    prev.attempts === 0
      ? params.timeMs
      : Math.round((prev.avgTimeMs * prev.attempts + params.timeMs) / attempts);

  let nextLevel: SysDesignDifficulty = prev.level;
  let nextStreak = prev.streak;
  let leveledUp = false;
  let leveledDown = false;
  let scheduledRetest = false;
  let cooldown = 0;
  let retestPending = false;

  if (params.correct) {
    nextStreak = prev.streak + 1;
    const required = isFast ? 2 : 3;
    if (nextStreak >= required && prev.level < 3) {
      nextLevel = (prev.level + 1) as SysDesignDifficulty;
      nextStreak = 0;
      leveledUp = true;
    }
  } else {
    nextStreak = 0;
    cooldown = 2 + (rng() < 0.5 ? 0 : 1);
    retestPending = true;
    scheduledRetest = true;
    if (prev.streak === 0 && prev.level > 1) {
      nextLevel = (prev.level - 1) as SysDesignDifficulty;
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

  return {
    state: {
      version: SYSDESIGN_SCHEMA_VERSION,
      totalRounds: nextRound,
      skills: nextSkills,
    },
    leveledUp,
    leveledDown,
    scheduledRetest,
  };
}
