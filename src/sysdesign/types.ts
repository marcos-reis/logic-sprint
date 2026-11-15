export type SysDesignSkillId =
  | 'traffic_rps'
  | 'read_write_little'
  | 'storage'
  | 'cache'
  | 'bandwidth';

export type SysDesignDifficulty = 1 | 2 | 3;

export type SysDesignSessionMode = 'mixed' | SysDesignSkillId;

export interface UnitOption {
  unit: string;
  /** Fator de multiplicação para converter para a unidade base do problema (ex: MB=1, GB=1000, TB=1e6) */
  multiplier: number;
}

export interface SysDesignQuestion {
  id: string;
  skillId: SysDesignSkillId;
  level: SysDesignDifficulty;
  contextTag: string;
  prompt: string;
  unitOptions: UnitOption[];
  defaultUnit: string;
  canonicalUnit: string;
  /** Valor exato na unidade canônica (usando 86.400s/dia quando aplicável) */
  exactValue: number;
  /** Valor arredondado de entrevista na unidade canônica (usando 10^5s/dia) */
  interviewValue: number;
  /** Margem de tolerância relativa (ex: 0.18 = ±18%) */
  toleranceRatio: number;
  interviewShortcutSteps: string[];
  exactCalcSteps: string[];
}

export interface SysDesignSkillMeta {
  id: SysDesignSkillId;
  label: string;
  shortLabel: string;
  description: string;
}

export const ALL_SYSDESIGN_SKILLS: SysDesignSkillId[] = [
  'traffic_rps',
  'read_write_little',
  'storage',
  'cache',
  'bandwidth',
];

export const SYSDESIGN_SKILL_META: Record<SysDesignSkillId, SysDesignSkillMeta> = {
  traffic_rps: {
    id: 'traffic_rps',
    label: 'Tráfego (DAU → RPS)',
    shortLabel: 'DAU → RPS',
    description: 'Converter usuários ativos diários em RPS médio e Peak RPS.',
  },
  read_write_little: {
    id: 'read_write_little',
    label: 'Read/Write & Lei de Little',
    shortLabel: 'Concorrência',
    description: 'Split de leitura/escrita e conexões concorrentes (L = λ × W).',
  },
  storage: {
    id: 'storage',
    label: 'Storage & Retenção',
    shortLabel: 'Storage',
    description: 'Volume diário, mensal e anual (MB, GB, TB) com replicação.',
  },
  cache: {
    id: 'cache',
    label: 'Cache & Memória (80/20)',
    shortLabel: 'Cache RAM',
    description: 'Dimensionar RAM para os 20% dos dados mais quentes.',
  },
  bandwidth: {
    id: 'bandwidth',
    label: 'Banda & Throughput',
    shortLabel: 'Banda',
    description: 'Taxa de rede (MB/s, GB/s, Mbps) a partir de RPS × Payload.',
  },
};

export interface SysDesignSkillStats {
  skillId: SysDesignSkillId;
  level: SysDesignDifficulty;
  attempts: number;
  correct: number;
  streak: number;
  avgTimeMs: number;
  cooldown: number;
  retestPending: boolean;
  lastSeenRound: number;
}

export interface SysDesignAdaptiveState {
  version: number;
  totalRounds: number;
  skills: Record<SysDesignSkillId, SysDesignSkillStats>;
}

export interface SysDesignEvaluation {
  correct: boolean;
  matchedMode: 'exact' | 'interview' | 'both' | 'none';
  scaleMismatchUnit?: string;
}

function isWithinTolerance(actual: number, target: number, ratio: number): boolean {
  if (target === 0) return Math.abs(actual) < 1e-6;
  const diff = Math.abs(actual - target) / Math.abs(target);
  return diff <= ratio;
}

export function evaluateSysDesignAnswer(
  question: SysDesignQuestion,
  numericValue: number,
  selectedUnit: string,
): SysDesignEvaluation {
  const chosenOption = question.unitOptions.find((u) => u.unit === selectedUnit);
  const canonicalOption = question.unitOptions.find(
    (u) => u.unit === question.canonicalUnit,
  );
  if (!chosenOption || !canonicalOption || !Number.isFinite(numericValue)) {
    return { correct: false, matchedMode: 'none' };
  }

  const userBase = numericValue * chosenOption.multiplier;
  const exactBase = question.exactValue * canonicalOption.multiplier;
  const interviewBase = question.interviewValue * canonicalOption.multiplier;

  const matchesExact = isWithinTolerance(userBase, exactBase, question.toleranceRatio);
  const matchesInterview = isWithinTolerance(
    userBase,
    interviewBase,
    question.toleranceRatio,
  );

  if (matchesExact || matchesInterview) {
    return {
      correct: true,
      matchedMode:
        matchesExact && matchesInterview
          ? 'both'
          : matchesExact
            ? 'exact'
            : 'interview',
    };
  }

  // Detecta se o número digitado estaria correto em outra escala (erro de ordem de grandeza)
  for (const alt of question.unitOptions) {
    if (alt.unit === selectedUnit) continue;
    const altBase = numericValue * alt.multiplier;
    if (
      isWithinTolerance(altBase, exactBase, question.toleranceRatio) ||
      isWithinTolerance(altBase, interviewBase, question.toleranceRatio)
    ) {
      return {
        correct: false,
        matchedMode: 'none',
        scaleMismatchUnit: alt.unit,
      };
    }
  }

  return { correct: false, matchedMode: 'none' };
}
