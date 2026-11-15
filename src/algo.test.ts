import { describe, expect, it } from 'vitest';
import { ALGO_PROBLEMS, ALL_ALGO_PATTERNS } from './algo';
import { ALGO_CATALOG_B } from './algo/catalogB';

describe('Algo Catalog B Invariants', () => {
  it('contains exactly 8 problems covering 4 patterns', () => {
    expect(ALGO_CATALOG_B).toHaveLength(8);
    const patternCounts: Record<string, number> = {};
    for (const p of ALGO_CATALOG_B) {
      patternCounts[p.patternId] = (patternCounts[p.patternId] || 0) + 1;
    }
    expect(patternCounts['monotonic_stack']).toBe(2);
    expect(patternCounts['bfs_dfs']).toBe(2);
    expect(patternCounts['heap_intervals']).toBe(2);
    expect(patternCounts['dp_1d']).toBe(2);
  });

  it('each problem in catalog B has valid steps and no code in hints', () => {
    for (const p of ALGO_CATALOG_B) {
      expect(p.steps).toHaveLength(3);
      expect(p.steps[0].kind).toBe('bottleneck');
      expect(p.steps[1].kind).toBe('pattern');
      expect(p.steps[2].kind).toBe('invariant');

      for (const step of p.steps) {
        expect(step.title.length).toBeGreaterThan(0);
        expect(step.prompt.length).toBeGreaterThan(0);
        expect(step.hint.length).toBeGreaterThan(0);
        expect(step.options).toHaveLength(4);

        const labels = step.options.map((o) => o.label);
        const uniqueLabels = new Set(labels);
        expect(uniqueLabels.size).toBe(4);

        const correct = step.options.find((o) => o.id === step.correctOptionId);
        expect(correct).toBeDefined();

        // Zero code in hints: no function keyword, no semicolons/braces code snippets
        expect(step.hint).not.toMatch(/function\s+/);
        expect(step.hint).not.toMatch(/const\s+\w+\s*=/);
      }
    }
  });

  it('generateDryRun() produces 4 distinct options and valid correctOptionId across multiple runs', () => {
    for (const p of ALGO_CATALOG_B) {
      for (let run = 0; run < 30; run++) {
        const dryRun = p.generateDryRun();
        expect(dryRun.prompt.length).toBeGreaterThan(0);
        expect(dryRun.hint.length).toBeGreaterThan(0);
        expect(dryRun.options).toHaveLength(4);

        const labels = dryRun.options.map((o) => o.label);
        const uniqueLabels = new Set(labels);
        expect(uniqueLabels.size).toBe(4);

        const match = dryRun.options.find((o) => o.id === dryRun.correctOptionId);
        expect(match).toBeDefined();
        expect(dryRun.explanation.length).toBeGreaterThan(0);
      }
    }
  });
});

describe('Full ALGO_PROBLEMS Catalog', () => {
  it('contains 16 problems covering all 8 patterns with 2 problems each', () => {
    expect(ALGO_PROBLEMS).toHaveLength(16);
    const patternMap = new Map<string, number>();
    for (const p of ALGO_PROBLEMS) {
      patternMap.set(p.patternId, (patternMap.get(p.patternId) || 0) + 1);
    }

    for (const pat of ALL_ALGO_PATTERNS) {
      expect(patternMap.get(pat)).toBe(2);
    }
  });

  it('all 16 problems have valid example, human-readable constraints, and traceSteps', () => {
    expect(ALGO_PROBLEMS).toHaveLength(16);
    for (const problem of ALGO_PROBLEMS) {
      // Example validation
      expect(problem.example).toBeDefined();
      expect(problem.example.input.trim().length).toBeGreaterThan(0);
      expect(problem.example.output.trim().length).toBeGreaterThan(0);

      // Constraints validation
      expect(problem.constraints.length).toBeGreaterThanOrEqual(1);
      for (const constraint of problem.constraints) {
        expect(constraint.trim().length).toBeGreaterThan(0);
      }

      // Trace steps validation
      expect(problem.traceSteps.length).toBeGreaterThanOrEqual(3);
      for (const step of problem.traceSteps) {
        expect(step.moment.trim().length).toBeGreaterThan(0);
        expect(step.state.trim().length).toBeGreaterThan(0);
      }
    }
  });
});
