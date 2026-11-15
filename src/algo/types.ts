export type AlgoPatternId =
  | 'hashmap'
  | 'two_pointers'
  | 'sliding_window'
  | 'binary_search'
  | 'monotonic_stack'
  | 'bfs_dfs'
  | 'heap_intervals'
  | 'dp_1d';

export type AlgoStepKind = 'bottleneck' | 'pattern' | 'invariant' | 'dry_run';

export interface AlgoOption {
  id: string;
  label: string;
}

export interface AlgoStepQuestion {
  kind: Exclude<AlgoStepKind, 'dry_run'>;
  title: string;
  prompt: string;
  hint: string;
  options: AlgoOption[];
  correctOptionId: string;
  explanation: string;
}

export interface AlgoDryRunSpec {
  prompt: string;
  hint: string;
  options: AlgoOption[];
  correctOptionId: string;
  explanation: string;
}

export interface AlgoExample {
  input: string;
  output: string;
  note?: string;
}

export interface AlgoTraceMoment {
  moment: string;
  state: string;
}

export interface AlgoProblemTemplate {
  id: string;
  patternId: AlgoPatternId;
  title: string;
  difficulty: 'Fácil' | 'Médio';
  constraints: string[];
  statement: string;
  example: AlgoExample;
  steps: [AlgoStepQuestion, AlgoStepQuestion, AlgoStepQuestion];
  generateDryRun: () => AlgoDryRunSpec;
  synthesis: string[];
  tsSkeleton: string;
  traceSteps: AlgoTraceMoment[];
}

export interface AlgoPatternMeta {
  id: AlgoPatternId;
  label: string;
  shortLabel: string;
  signalSummary: string;
}

export const ALL_ALGO_PATTERNS: AlgoPatternId[] = [
  'hashmap',
  'two_pointers',
  'sliding_window',
  'binary_search',
  'monotonic_stack',
  'bfs_dfs',
  'heap_intervals',
  'dp_1d',
];

export const ALGO_PATTERN_META: Record<AlgoPatternId, AlgoPatternMeta> = {
  hashmap: {
    id: 'hashmap',
    label: 'HashMap & Frequência',
    shortLabel: 'HashMap',
    signalSummary: 'Lookup O(1) de complemento, contagem ou agrupamento por chave.',
  },
  two_pointers: {
    id: 'two_pointers',
    label: 'Two Pointers',
    shortLabel: 'Two Pointers',
    signalSummary: 'Array ordenado ou extremos convergindo em direção ao centro.',
  },
  sliding_window: {
    id: 'sliding_window',
    label: 'Sliding Window',
    shortLabel: 'Sliding Window',
    signalSummary: 'Subarray ou substring contínua com soma, janela ou unicidade.',
  },
  binary_search: {
    id: 'binary_search',
    label: 'Binary Search',
    shortLabel: 'Binary Search',
    signalSummary: 'Monotonicidade no array ou no espaço de resposta em O(log N).',
  },
  monotonic_stack: {
    id: 'monotonic_stack',
    label: 'Monotonic Stack',
    shortLabel: 'Monotonic Stack',
    signalSummary: 'Próximo elemento maior/menor ou histórico pendente em ordem.',
  },
  bfs_dfs: {
    id: 'bfs_dfs',
    label: 'BFS / DFS (Grid & Grafos)',
    shortLabel: 'BFS / DFS',
    signalSummary: 'Menor caminho por camadas (BFS) ou regiões conectadas (DFS).',
  },
  heap_intervals: {
    id: 'heap_intervals',
    label: 'Heap & Intervalos',
    shortLabel: 'Heap / Intervalos',
    signalSummary: 'Top-K dinâmico ou ordenação e fusão de intervalos sobrepostos.',
  },
  dp_1d: {
    id: 'dp_1d',
    label: 'Programação Dinâmica 1D',
    shortLabel: 'DP 1D',
    signalSummary: 'Decisão ótima acumulada com subproblemas sobrepostos.',
  },
};

export interface AlgoPatternStats {
  patternId: AlgoPatternId;
  attempts: number;
  autonomousCorrect: number;
  guidedCorrect: number;
  avgTimeMs: number;
  cooldown: number;
  retestPending: boolean;
  lastProblemId?: string;
  lastSeenRound: number;
}

export interface AlgoAdaptiveState {
  version: number;
  totalRounds: number;
  patterns: Record<AlgoPatternId, AlgoPatternStats>;
}
