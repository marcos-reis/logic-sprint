import { describe, expect, it } from 'vitest';
import {
  ALL_SYSDESIGN_SKILLS,
  createInitialSysDesignState,
  evaluateSysDesignAnswer,
  generateSysDesignQuestion,
  pickNextSysDesignSkill,
  recordSysDesignAnswer,
  type SysDesignDifficulty,
  type SysDesignQuestion,
  type SysDesignSkillId,
} from './sysdesign';

describe('SysDesign Evaluation Engine', () => {
  const dummyTrafficQuestion: SysDesignQuestion = {
    id: 'test_traffic_1',
    skillId: 'traffic_rps',
    level: 1,
    contextTag: 'Gateway PIX',
    prompt: 'Dummy prompt',
    unitOptions: [
      { unit: 'RPS', multiplier: 1 },
      { unit: 'K RPS', multiplier: 1000 },
    ],
    defaultUnit: 'RPS',
    canonicalUnit: 'RPS',
    exactValue: 115.74, // 10M req / 86400s
    interviewValue: 100, // 10M req / 100000s
    toleranceRatio: 0.18,
    interviewShortcutSteps: ['Step 1'],
    exactCalcSteps: ['Step 1'],
  };

  it('matches exact calculation within tolerance', () => {
    const res = evaluateSysDesignAnswer(dummyTrafficQuestion, 115.74, 'RPS');
    expect(res.correct).toBe(true);
    expect(['exact', 'both']).toContain(res.matchedMode);
  });

  it('matches interview shortcut calculation within tolerance', () => {
    const res = evaluateSysDesignAnswer(dummyTrafficQuestion, 100, 'RPS');
    expect(res.correct).toBe(true);
    expect(['interview', 'both']).toContain(res.matchedMode);
  });

  it('matches equivalent scale conversions across units (e.g. 0.5 TB vs 500 GB)', () => {
    const storageQuestion: SysDesignQuestion = {
      id: 'test_storage_1',
      skillId: 'storage',
      level: 2,
      contextTag: 'Logs de API',
      prompt: 'Dummy storage prompt',
      unitOptions: [
        { unit: 'MB', multiplier: 1 },
        { unit: 'GB', multiplier: 1000 },
        { unit: 'TB', multiplier: 1_000_000 },
      ],
      defaultUnit: 'GB',
      canonicalUnit: 'GB',
      exactValue: 500, // 500 GB
      interviewValue: 500,
      toleranceRatio: 0.15,
      interviewShortcutSteps: ['Step 1'],
      exactCalcSteps: ['Step 1'],
    };

    // User submits in canonical GB
    const resGb = evaluateSysDesignAnswer(storageQuestion, 500, 'GB');
    expect(resGb.correct).toBe(true);

    // User submits equivalent in TB (0.5 TB)
    const resTb = evaluateSysDesignAnswer(storageQuestion, 0.5, 'TB');
    expect(resTb.correct).toBe(true);

    // User submits equivalent in MB (500,000 MB)
    const resMb = evaluateSysDesignAnswer(storageQuestion, 500_000, 'MB');
    expect(resMb.correct).toBe(true);
  });

  it('detects scale mismatch when magnitude is correct for another unit', () => {
    const storageQuestion: SysDesignQuestion = {
      id: 'test_storage_2',
      skillId: 'storage',
      level: 2,
      contextTag: 'Logs de API',
      prompt: 'Dummy storage prompt',
      unitOptions: [
        { unit: 'MB', multiplier: 1 },
        { unit: 'GB', multiplier: 1000 },
        { unit: 'TB', multiplier: 1_000_000 },
      ],
      defaultUnit: 'MB',
      canonicalUnit: 'GB',
      exactValue: 200, // 200 GB
      interviewValue: 200,
      toleranceRatio: 0.15,
      interviewShortcutSteps: ['Step 1'],
      exactCalcSteps: ['Step 1'],
    };

    // User typed 200 but left unit as MB (200 MB != 200 GB)
    const res = evaluateSysDesignAnswer(storageQuestion, 200, 'MB');
    expect(res.correct).toBe(false);
    expect(res.scaleMismatchUnit).toBe('GB');
  });

  it('rejects completely wrong numbers and invalid units', () => {
    const resWrong = evaluateSysDesignAnswer(dummyTrafficQuestion, 99999, 'RPS');
    expect(resWrong.correct).toBe(false);
    expect(resWrong.matchedMode).toBe('none');
    expect(resWrong.scaleMismatchUnit).toBeUndefined();

    const resInvalidUnit = evaluateSysDesignAnswer(dummyTrafficQuestion, 100, 'INVALID');
    expect(resInvalidUnit.correct).toBe(false);
  });
});

describe('SysDesign Adaptive State & Cooldown', () => {
  it('creates initial state with all skills at level 1 and 0 cooldown', () => {
    const state = createInitialSysDesignState();
    expect(state.version).toBe(1);
    expect(state.totalRounds).toBe(0);
    for (const skill of ALL_SYSDESIGN_SKILLS) {
      expect(state.skills[skill].level).toBe(1);
      expect(state.skills[skill].cooldown).toBe(0);
      expect(state.skills[skill].retestPending).toBe(false);
    }
  });

  it('levels up upon streak of correct answers', () => {
    let state = createInitialSysDesignState();
    const skill: SysDesignSkillId = 'traffic_rps';

    // 2 fast correct answers (timeMs <= 25000)
    let outcome = recordSysDesignAnswer(state, {
      skillId: skill,
      correct: true,
      timeMs: 15000,
    });
    state = outcome.state;
    expect(state.skills[skill].streak).toBe(1);
    expect(state.skills[skill].level).toBe(1);

    outcome = recordSysDesignAnswer(state, {
      skillId: skill,
      correct: true,
      timeMs: 12000,
    });
    state = outcome.state;
    expect(outcome.leveledUp).toBe(true);
    expect(state.skills[skill].level).toBe(2);
    expect(state.skills[skill].streak).toBe(0);
  });

  it('schedules cooldown and retest on wrong answer', () => {
    let state = createInitialSysDesignState();
    const skill: SysDesignSkillId = 'cache';

    const outcome = recordSysDesignAnswer(
      state,
      { skillId: skill, correct: false, timeMs: 20000 },
      () => 0.1, // Deterministic rng for cooldown
    );
    state = outcome.state;

    expect(outcome.scheduledRetest).toBe(true);
    expect(state.skills[skill].retestPending).toBe(true);
    expect(state.skills[skill].cooldown).toBeGreaterThanOrEqual(2);
    expect(state.skills[skill].streak).toBe(0);
  });

  it('triggers retest when cooldown expires in mixed mode', () => {
    let state = createInitialSysDesignState();
    const failedSkill: SysDesignSkillId = 'bandwidth';

    // Fail bandwidth
    const failOutcome = recordSysDesignAnswer(
      state,
      { skillId: failedSkill, correct: false, timeMs: 10000 },
      () => 0.1, // cooldown = 2
    );
    state = failOutcome.state;
    expect(state.skills[failedSkill].cooldown).toBe(2);
    expect(state.skills[failedSkill].retestPending).toBe(true);

    // Round 1 with other skill decrements bandwidth cooldown
    let outcome = recordSysDesignAnswer(state, {
      skillId: 'storage',
      correct: true,
      timeMs: 10000,
    });
    state = outcome.state;
    expect(state.skills[failedSkill].cooldown).toBe(1);

    // Round 2 with other skill decrements bandwidth cooldown to 0
    outcome = recordSysDesignAnswer(state, {
      skillId: 'traffic_rps',
      correct: true,
      timeMs: 10000,
    });
    state = outcome.state;
    expect(state.skills[failedSkill].cooldown).toBe(0);
    expect(state.skills[failedSkill].retestPending).toBe(true);

    // Next pick in mixed mode MUST prioritize the retest
    const pick = pickNextSysDesignSkill(state, 'mixed', 'traffic_rps');
    expect(pick.skillId).toBe(failedSkill);
    expect(pick.isRetest).toBe(true);
  });

  it('respects single-skill mode', () => {
    const state = createInitialSysDesignState();
    const pick = pickNextSysDesignSkill(state, 'storage');
    expect(pick.skillId).toBe('storage');
    expect(pick.level).toBe(1);
  });
});

describe('SysDesign Question Generators Matrix (600 Questions)', () => {
  const levels: SysDesignDifficulty[] = [1, 2, 3];
  const iterationsPerSkillAndLevel = 40;

  for (const skillId of ALL_SYSDESIGN_SKILLS) {
    describe(`Skill: ${skillId}`, () => {
      for (const level of levels) {
        it(`generates valid questions at Level ${level} (${iterationsPerSkillAndLevel} runs)`, () => {
          for (let i = 0; i < iterationsPerSkillAndLevel; i++) {
            const q = generateSysDesignQuestion(skillId, level);

            // Basic identity
            expect(q.skillId).toBe(skillId);
            expect(q.level).toBe(level);
            expect(typeof q.id).toBe('string');
            expect(q.id.length).toBeGreaterThan(0);
            expect(typeof q.contextTag).toBe('string');
            expect(q.contextTag.length).toBeGreaterThan(0);
            expect(typeof q.prompt).toBe('string');
            expect(q.prompt.length).toBeGreaterThan(15);

            // Units integrity
            expect(Array.isArray(q.unitOptions)).toBe(true);
            expect(q.unitOptions.length).toBeGreaterThanOrEqual(2);

            const unitStrings = q.unitOptions.map((u) => u.unit);
            expect(unitStrings).toContain(q.canonicalUnit);
            expect(unitStrings).toContain(q.defaultUnit);

            for (const option of q.unitOptions) {
              expect(typeof option.unit).toBe('string');
              expect(option.unit.length).toBeGreaterThan(0);
              expect(typeof option.multiplier).toBe('number');
              expect(option.multiplier).toBeGreaterThan(0);
            }

            // Numeric values
            expect(typeof q.exactValue).toBe('number');
            expect(Number.isFinite(q.exactValue)).toBe(true);
            expect(q.exactValue).toBeGreaterThan(0);

            expect(typeof q.interviewValue).toBe('number');
            expect(Number.isFinite(q.interviewValue)).toBe(true);
            expect(q.interviewValue).toBeGreaterThan(0);

            expect(typeof q.toleranceRatio).toBe('number');
            expect(q.toleranceRatio).toBeGreaterThan(0);
            expect(q.toleranceRatio).toBeLessThanOrEqual(0.25);

            // Steps
            expect(Array.isArray(q.interviewShortcutSteps)).toBe(true);
            expect(q.interviewShortcutSteps.length).toBeGreaterThanOrEqual(1);
            for (const step of q.interviewShortcutSteps) {
              expect(typeof step).toBe('string');
              expect(step.length).toBeGreaterThan(0);
            }

            expect(Array.isArray(q.exactCalcSteps)).toBe(true);
            expect(q.exactCalcSteps.length).toBeGreaterThanOrEqual(1);
            for (const step of q.exactCalcSteps) {
              expect(typeof step).toBe('string');
              expect(step.length).toBeGreaterThan(0);
            }

            // Evaluation self-consistency: submitting exactValue in canonicalUnit must pass
            const evalExact = evaluateSysDesignAnswer(q, q.exactValue, q.canonicalUnit);
            expect(evalExact.correct).toBe(true);

            // Evaluation self-consistency: submitting interviewValue in canonicalUnit must pass
            const evalInterview = evaluateSysDesignAnswer(
              q,
              q.interviewValue,
              q.canonicalUnit,
            );
            expect(evalInterview.correct).toBe(true);
          }
        });
      }
    });
  }
});
