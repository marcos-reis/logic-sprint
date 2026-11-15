import { describe, expect, it } from 'vitest';
import { ALL_SKILLS, DifficultyLevel } from './engine/types';
import { generateQuestion } from './generators';
import {
  generateDivision,
  generateMultiplication,
  generatePercentage,
  generateRuleOfThree,
} from './generators/math';
import {
  generateMatrix,
  generateSequence,
  generateSyllogism,
  visualSignature,
} from './generators/logic';
import { pickDistinct, randInt, shuffle, uid } from './generators/utils';

describe('Generators Utils', () => {
  it('generates random integers within bounds', () => {
    for (let i = 0; i < 100; i++) {
      const val = randInt(5, 10);
      expect(val).toBeGreaterThanOrEqual(5);
      expect(val).toBeLessThanOrEqual(10);
      expect(Number.isInteger(val)).toBe(true);
    }
  });

  it('picks distinct elements without duplicates', () => {
    const arr = [1, 2, 3, 4, 5, 6, 7, 8];
    const picked = pickDistinct(arr, 4);
    expect(picked).toHaveLength(4);
    const unique = new Set(picked);
    expect(unique.size).toBe(4);
  });

  it('shuffles arrays while preserving elements', () => {
    const arr = ['a', 'b', 'c', 'd', 'e'];
    const shuffled = shuffle(arr);
    expect(shuffled).toHaveLength(arr.length);
    expect(shuffled.sort()).toEqual(arr.sort());
  });

  it('generates unique uids', () => {
    const ids = new Set<string>();
    for (let i = 0; i < 50; i++) {
      const id = uid('test');
      expect(id.startsWith('test_')).toBe(true);
      ids.add(id);
    }
    expect(ids.size).toBe(50);
  });
});

describe('Math Generators Invariants', () => {
  const levels: DifficultyLevel[] = [1, 2, 3];

  it('division generates exact integers and tailored heuristics', () => {
    for (const level of levels) {
      for (let i = 0; i < 20; i++) {
        const q = generateDivision(level);
        expect(q.pillar).toBe('math');
        expect(q.kind).toBe('numeric');
        expect(q.skillId).toBe('division');
        expect(q.level).toBe(level);
        expect(Number.isInteger(q.answer)).toBe(true);
        expect(q.heuristicTitle.length).toBeGreaterThan(0);
        expect(q.heuristicSteps.length).toBeGreaterThanOrEqual(2);
        expect(q.prompt.length).toBeGreaterThan(0);
      }
    }
  });

  it('multiplication generates exact integers and tailored heuristics', () => {
    for (const level of levels) {
      for (let i = 0; i < 20; i++) {
        const q = generateMultiplication(level);
        expect(q.pillar).toBe('math');
        expect(q.kind).toBe('numeric');
        expect(q.skillId).toBe('multiplication');
        expect(q.level).toBe(level);
        expect(Number.isInteger(q.answer)).toBe(true);
        expect(q.heuristicTitle.length).toBeGreaterThan(0);
        expect(q.heuristicSteps.length).toBeGreaterThanOrEqual(2);
      }
    }
  });

  it('percentage generates exact integers', () => {
    for (const level of levels) {
      for (let i = 0; i < 20; i++) {
        const q = generatePercentage(level);
        expect(q.pillar).toBe('math');
        expect(q.kind).toBe('numeric');
        expect(q.skillId).toBe('percentage');
        expect(q.level).toBe(level);
        expect(Number.isInteger(q.answer)).toBe(true);
        expect(q.heuristicTitle.length).toBeGreaterThan(0);
        expect(q.heuristicSteps.length).toBeGreaterThanOrEqual(2);
      }
    }
  });

  it('rule of three generates exact integers', () => {
    for (const level of levels) {
      for (let i = 0; i < 20; i++) {
        const q = generateRuleOfThree(level);
        expect(q.pillar).toBe('math');
        expect(q.kind).toBe('numeric');
        expect(q.skillId).toBe('rule_of_three');
        expect(q.level).toBe(level);
        expect(Number.isInteger(q.answer)).toBe(true);
        expect(q.heuristicTitle.length).toBeGreaterThan(0);
        expect(q.heuristicSteps.length).toBeGreaterThanOrEqual(2);
      }
    }
  });
});

describe('Logic Generators Invariants', () => {
  const levels: DifficultyLevel[] = [1, 2, 3];

  it('syllogism has 4 distinct options with exactly one correct', () => {
    for (const level of levels) {
      for (let i = 0; i < 20; i++) {
        const q = generateSyllogism(level);
        expect(q.pillar).toBe('logic');
        expect(q.kind).toBe('choice');
        expect(q.skillId).toBe('syllogism');
        expect(q.options).toHaveLength(4);

        const labels = q.options.map((o) => o.label);
        const uniqueLabels = new Set(labels);
        expect(uniqueLabels.size).toBe(4);

        const correct = q.options.filter((o) => o.id === q.correctOptionId);
        expect(correct).toHaveLength(1);
        expect(q.heuristicTitle.length).toBeGreaterThan(0);
        expect(q.heuristicSteps.length).toBeGreaterThanOrEqual(2);
      }
    }
  });

  it('sequence has 4 distinct numeric options with exactly one correct', () => {
    for (const level of levels) {
      for (let i = 0; i < 20; i++) {
        const q = generateSequence(level);
        expect(q.pillar).toBe('logic');
        expect(q.kind).toBe('choice');
        expect(q.skillId).toBe('sequence');
        expect(q.options).toHaveLength(4);

        const labels = q.options.map((o) => o.label);
        const uniqueLabels = new Set(labels);
        expect(uniqueLabels.size).toBe(4);

        for (const label of labels) {
          expect(Number.isNaN(Number(label))).toBe(false);
        }

        const correct = q.options.filter((o) => o.id === q.correctOptionId);
        expect(correct).toHaveLength(1);
      }
    }
  });

  it('matrix has 3x3 grid with null at 8 and 4 visually distinct MatrixCell options', () => {
    const validShapes = ['circle', 'triangle', 'square', 'diamond', 'semicircle', 'arrow'];
    for (const level of levels) {
      for (let i = 0; i < 100; i++) {
        const q = generateMatrix(level);
        expect(q.pillar).toBe('logic');
        expect(q.kind).toBe('choice');
        expect(q.skillId).toBe('matrix');
        expect(q.matrixGrid).toBeDefined();
        expect(q.matrixGrid).toHaveLength(9);
        expect(q.matrixGrid![8]).toBeNull();

        // cells 0..7 are valid MatrixCells
        for (let idx = 0; idx < 8; idx++) {
          const cell = q.matrixGrid![idx];
          expect(cell).not.toBeNull();
          expect(validShapes).toContain(cell!.shape);
          expect([1, 2, 3, 4]).toContain(cell!.count);
          expect([0, 90, 180, 270]).toContain(cell!.rotation);
          expect(['solid', 'outline', 'striped']).toContain(cell!.fill);
        }

        expect(q.options).toHaveLength(4);
        const visualKeys = q.options.map((o) => {
          expect(o.matrixCell).toBeDefined();
          return visualSignature(o.matrixCell!);
        });
        const uniqueVisualKeys = new Set(visualKeys);
        expect(uniqueVisualKeys.size).toBe(4);

        const correct = q.options.filter((o) => o.id === q.correctOptionId);
        expect(correct).toHaveLength(1);
      }
    }
  });
});

describe('Main Dispatcher generateQuestion', () => {
  it('dispatches all 7 skills across all 3 levels', () => {
    const levels: DifficultyLevel[] = [1, 2, 3];
    for (const skill of ALL_SKILLS) {
      for (const level of levels) {
        const q = generateQuestion(skill, level);
        expect(q.skillId).toBe(skill);
        expect(q.level).toBe(level);
        expect(q.prompt).toBeDefined();
        expect(q.heuristicTitle).toBeDefined();
        expect(q.heuristicSteps.length).toBeGreaterThan(0);
      }
    }
  });
});
