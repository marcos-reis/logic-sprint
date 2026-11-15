export type PillarId = 'math' | 'logic';

export type MathSkillId =
  | 'division'
  | 'multiplication'
  | 'percentage'
  | 'rule_of_three';

export type LogicSkillId = 'syllogism' | 'sequence' | 'matrix';

export type SkillId = MathSkillId | LogicSkillId;

export type DifficultyLevel = 1 | 2 | 3;

export type SessionMode = 'mixed' | 'math_only' | 'logic_only' | SkillId;

export type MatrixShape =
  | 'circle'
  | 'triangle'
  | 'square'
  | 'diamond'
  | 'semicircle'
  | 'arrow';
export type MatrixFill = 'solid' | 'outline' | 'striped';
export type MatrixRotation = 0 | 90 | 180 | 270;

export interface MatrixCell {
  shape: MatrixShape;
  count: 1 | 2 | 3 | 4;
  rotation: MatrixRotation;
  fill: MatrixFill;
}

export interface BaseQuestion {
  id: string;
  skillId: SkillId;
  pillar: PillarId;
  level: DifficultyLevel;
  contextTag: string;
  prompt: string;
  heuristicTitle: string;
  heuristicSteps: string[];
}

export interface NumericQuestion extends BaseQuestion {
  kind: 'numeric';
  pillar: 'math';
  answer: number;
  allowDecimal?: boolean;
  unit?: string;
}

export interface ChoiceOption {
  id: string;
  label?: string;
  matrixCell?: MatrixCell;
}

export interface ChoiceQuestion extends BaseQuestion {
  kind: 'choice';
  pillar: 'logic';
  options: ChoiceOption[];
  correctOptionId: string;
  matrixGrid?: (MatrixCell | null)[];
}

export type Question = NumericQuestion | ChoiceQuestion;

export interface SkillMeta {
  id: SkillId;
  pillar: PillarId;
  label: string;
  shortLabel: string;
  description: string;
}

export const SKILL_META: Record<SkillId, SkillMeta> = {
  division: {
    id: 'division',
    pillar: 'math',
    label: 'Divisão Rápida',
    shortLabel: 'Divisão',
    description: 'Decomposição, simplificação por metades e divisores exatos.',
  },
  multiplication: {
    id: 'multiplication',
    pillar: 'math',
    label: 'Multiplicação Mental',
    shortLabel: 'Multiplicação',
    description: 'Distributiva, atalhos ×15, ×25 e compensação.',
  },
  percentage: {
    id: 'percentage',
    pillar: 'math',
    label: 'Porcentagem & Descontos',
    shortLabel: 'Porcentagem',
    description: 'Cálculo direto, taxas compostas e valor original reverso.',
  },
  rule_of_three: {
    id: 'rule_of_three',
    pillar: 'math',
    label: 'Regra de 3 & Cenários',
    shortLabel: 'Regra de 3',
    description: 'Proporção direta e inversa com contextos variados.',
  },
  syllogism: {
    id: 'syllogism',
    pillar: 'logic',
    label: 'Silogismos & Dedução',
    shortLabel: 'Silogismo',
    description: 'Premissas categóricas, condicionais e armadilhas lógicas.',
  },
  sequence: {
    id: 'sequence',
    pillar: 'logic',
    label: 'Sequências Lógicas',
    shortLabel: 'Sequências',
    description: 'Progressões, deltas crescentes e séries alternadas.',
  },
  matrix: {
    id: 'matrix',
    pillar: 'logic',
    label: 'Matrizes Visuais',
    shortLabel: 'Matrizes',
    description: 'Padrões espaciais 3×3 de forma, rotação, contagem e preenchimento.',
  },
};

export const ALL_SKILLS: SkillId[] = [
  'division',
  'multiplication',
  'percentage',
  'rule_of_three',
  'syllogism',
  'sequence',
  'matrix',
];

export interface SkillStats {
  skillId: SkillId;
  level: DifficultyLevel;
  attempts: number;
  correct: number;
  streak: number;
  avgTimeMs: number;
  cooldown: number;
  retestPending: boolean;
  lastSeenRound: number;
}

export interface RoundRecord {
  round: number;
  skillId: SkillId;
  level: DifficultyLevel;
  correct: boolean;
  timeMs: number;
  timestamp: number;
}

export interface AdaptiveState {
  version: number;
  totalRounds: number;
  skills: Record<SkillId, SkillStats>;
  recentHistory: RoundRecord[];
}
