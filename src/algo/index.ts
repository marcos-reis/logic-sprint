import { ALGO_CATALOG_A } from './catalogA';
import { ALGO_CATALOG_B } from './catalogB';
import type { AlgoProblemTemplate } from './types';

export * from './types';
export * from './adaptive';

export const ALGO_PROBLEMS: AlgoProblemTemplate[] = [
  ...ALGO_CATALOG_A,
  ...ALGO_CATALOG_B,
];
