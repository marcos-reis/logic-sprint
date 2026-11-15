/**
 * Main Question Generator Dispatcher for LogicSprint.
 */

import { DifficultyLevel, Question, SkillId } from '../engine/types';
import {
  generateDivision,
  generateMultiplication,
  generatePercentage,
  generateRuleOfThree,
} from './math';
import {
  generateMatrix,
  generateSequence,
  generateSyllogism,
} from './logic';

export {
  generateDivision,
  generateMultiplication,
  generatePercentage,
  generateRuleOfThree,
} from './math';

export {
  generateMatrix,
  generateSequence,
  generateSyllogism,
} from './logic';

export * from './utils';

/**
 * Generates a calibrated question for the given skill and difficulty level.
 */
export function generateQuestion(skillId: SkillId, level: DifficultyLevel): Question {
  switch (skillId) {
    case 'division':
      return generateDivision(level);
    case 'multiplication':
      return generateMultiplication(level);
    case 'percentage':
      return generatePercentage(level);
    case 'rule_of_three':
      return generateRuleOfThree(level);
    case 'syllogism':
      return generateSyllogism(level);
    case 'sequence':
      return generateSequence(level);
    case 'matrix':
      return generateMatrix(level);
    default: {
      const _exhaustiveCheck: never = skillId;
      throw new Error(`Unsupported skill ID: ${_exhaustiveCheck}`);
    }
  }
}
