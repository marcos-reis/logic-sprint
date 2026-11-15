import { describe, it, expect } from 'vitest';
import { createInitialAdaptiveState, recordAnswer } from './engine/adaptive';
import { ALL_SKILLS, SKILL_META } from './engine/types';

describe('Logic Sprint Engine & Types', () => {
  it('initializes all 7 skills with level 1 and 0 attempts', () => {
    const state = createInitialAdaptiveState();
    expect(state.totalRounds).toBe(0);
    expect(Object.keys(state.skills)).toHaveLength(7);

    for (const skillId of ALL_SKILLS) {
      expect(state.skills[skillId].level).toBe(1);
      expect(state.skills[skillId].attempts).toBe(0);
      expect(state.skills[skillId].streak).toBe(0);
      expect(SKILL_META[skillId].label).toBeDefined();
    }
  });

  it('records correct answers and handles level progression', () => {
    let state = createInitialAdaptiveState();
    const outcome = recordAnswer(state, {
      skillId: 'division',
      level: 1,
      correct: true,
      timeMs: 5000,
    });

    state = outcome.state;
    expect(state.totalRounds).toBe(1);
    expect(state.skills.division.attempts).toBe(1);
    expect(state.skills.division.correct).toBe(1);
    expect(state.skills.division.streak).toBe(1);
  });
});
