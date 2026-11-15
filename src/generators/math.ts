/**
 * Math Question Generators for LogicSprint.
 * Covers: division, multiplication, percentage, and rule of three.
 * Invariants: Exact integer arithmetic, tailored step-by-step mental heuristics.
 */

import { DifficultyLevel, NumericQuestion } from '../engine/types';
import {
  COMPANIES,
  NAMES,
  PRODUCTS,
  TECH_TERMS,
  pick,
  randInt,
  uid,
} from './utils';

// Helper to compute GCD
function gcd(a: number, b: number): number {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y !== 0) {
    const t = y;
    y = x % y;
    x = t;
  }
  return x;
}

// ---------------------------------------------------------------------------
// 1. DIVISION
// ---------------------------------------------------------------------------
export function generateDivision(level: DifficultyLevel): NumericQuestion {
  if (level === 1) {
    const divisor = randInt(6, 9);
    const quotient = randInt(11, 29);
    const dividend = divisor * quotient;

    const baseTenMultiple = quotient >= 20 ? 20 : 10;
    const basePart = divisor * baseTenMultiple;
    const remainder = dividend - basePart;
    const remQuotient = remainder / divisor;

    const isContextual = randInt(0, 1) === 1;
    const name = pick(NAMES);
    const term = pick(TECH_TERMS);

    const prompt = isContextual
      ? `${name} precisa distribuir ${dividend} ${term} igualmente entre ${divisor} equipes de engenharia. Quantos ${term} cada equipe receberá?`
      : `Calcule mentalmente a divisão exata:\n\n${dividend} ÷ ${divisor} = ?`;

    return {
      id: uid('div_l1'),
      skillId: 'division',
      pillar: 'math',
      kind: 'numeric',
      level: 1,
      contextTag: isContextual ? 'Distribuição de Recursos' : 'Divisão Mental Rápida',
      prompt,
      answer: quotient,
      unit: isContextual ? 'unidades' : undefined,
      heuristicTitle: `Decomposição por Múltiplos de 10`,
      heuristicSteps: [
        `1. Ancore na dezena mais próxima: ${divisor} × ${baseTenMultiple} = ${basePart}.`,
        `2. Subtraia do dividendo para achar o restante: ${dividend} - ${basePart} = ${remainder}.`,
        `3. Divida o restante pelo divisor: ${remainder} ÷ ${divisor} = ${remQuotient}.`,
        `4. Some as partes: ${baseTenMultiple} + ${remQuotient} = ${quotient}.`,
      ],
    };
  }

  if (level === 2) {
    const divisor = pick([12, 14, 15, 16, 18, 24, 25] as const);
    const quotient = randInt(11, 29);
    const dividend = divisor * quotient;

    const name = pick(NAMES);
    const term = pick(TECH_TERMS);
    const isContextual = randInt(0, 1) === 1;

    const prompt = isContextual
      ? `Um cluster gerenciado por ${name} processou ${dividend} ${term} divididos igualmente em ${divisor} workers assíncronos. Quantos ${term} cada worker processou?`
      : `Resolva a divisão exata mentalmente:\n\n${dividend} ÷ ${divisor} = ?`;

    let heuristicTitle = '';
    const heuristicSteps: string[] = [];

    if (divisor === 15) {
      heuristicTitle = 'Atalho de Divisão por 15 (Dobrar Ambos os Lados)';
      const doubledDividend = dividend * 2;
      heuristicSteps.push(
        `1. Dobre ambos os termos para criar uma divisão por 30: (${dividend} × 2) ÷ (${divisor} × 2) = ${doubledDividend} ÷ 30.`,
        `2. Elimine o zero dividindo por 10: ${doubledDividend} ÷ 10 = ${doubledDividend / 10}.`,
        `3. Divida por 3: ${doubledDividend / 10} ÷ 3 = ${quotient}.`,
      );
    } else if (divisor === 25) {
      heuristicTitle = 'Atalho de Divisão por 25 (Multiplicar Ambos por 4)';
      const quadDividend = dividend * 4;
      heuristicSteps.push(
        `1. Multiplique ambos os termos por 4 para dividir por 100: (${dividend} × 4) ÷ (${divisor} × 4) = ${quadDividend} ÷ 100.`,
        `2. Calcule 4 × ${dividend}: 2 × ${dividend} = ${dividend * 2}, e o dobro é ${quadDividend}.`,
        `3. Divida por 100 cortando duas casas: ${quadDividend} ÷ 100 = ${quotient}.`,
      );
    } else if (divisor === 16) {
      heuristicTitle = 'Divisão por 16: Metade Sucessiva (4 vezes)';
      const h1 = dividend / 2;
      const h2 = h1 / 2;
      const h3 = h2 / 2;
      heuristicSteps.push(
        `1. Dividir por 16 equivale a tirar a metade 4 vezes seguidas:`,
        `2. 1ª metade: ${dividend} ÷ 2 = ${h1}`,
        `3. 2ª metade: ${h1} ÷ 2 = ${h2}`,
        `4. 3ª e 4ª metades: ${h2} ÷ 2 = ${h3} ➔ ${h3} ÷ 2 = ${quotient}.`,
      );
    } else {
      const halfDivisor = divisor / 2;
      const halfDividend = dividend / 2;
      heuristicTitle = `Simplificação por Metades (÷ 2)`;
      heuristicSteps.push(
        `1. Ambos são pares: simplifique dividindo os dois por 2 primeiro.`,
        `2. ${dividend} ÷ ${divisor} vira ${halfDividend} ÷ ${halfDivisor}.`,
        `3. Agora decomponha ${halfDividend}: ${halfDivisor} × ${Math.floor(quotient / 10) * 10} = ${halfDivisor * Math.floor(quotient / 10) * 10}, restante = ${halfDividend - halfDivisor * Math.floor(quotient / 10) * 10}.`,
        `4. Resultado final: ${quotient}.`,
      );
    }

    return {
      id: uid('div_l2'),
      skillId: 'division',
      pillar: 'math',
      kind: 'numeric',
      level: 2,
      contextTag: isContextual ? 'Infraestrutura Cloud' : 'Simplificação de Divisores',
      prompt,
      answer: quotient,
      unit: isContextual ? 'unidades' : undefined,
      heuristicTitle,
      heuristicSteps,
    };
  }

  // Level 3
  const divisor = pick([15, 18, 22, 24, 25, 28, 32, 35, 36, 42, 45, 48] as const);
  const quotient = randInt(15, 45);
  const dividend = divisor * quotient;

  const company = pick(COMPANIES);
  const product = pick(PRODUCTS);

  const prompt = `A ${company} alocou um orçamento total de R$ ${dividend} para a aquisição de ${product}, com custo unitário fixo de R$ ${divisor}. Quantas unidades foram adquiridas no total?`;

  const heuristicSteps: string[] = [];
  let heuristicTitle = 'Decomposição em Fatores e Blocos';

  if (divisor % 5 === 0) {
    heuristicTitle = `Estratégia do Dobro (${divisor} ➔ ${divisor * 2})`;
    heuristicSteps.push(
      `1. Dobre o dividendo e o divisor para facilitar: (${dividend} × 2) ÷ (${divisor} × 2) = ${dividend * 2} ÷ ${divisor * 2}.`,
      `2. Divida por 10: ${dividend * 2} ÷ 10 = ${(dividend * 2) / 10}.`,
      `3. Divida pelo valor restante (${(divisor * 2) / 10}): ${(dividend * 2) / 10} ÷ ${(divisor * 2) / 10} = ${quotient}.`,
    );
  } else {
    const factor = gcd(divisor, 12) > 1 ? gcd(divisor, 12) : 2;
    heuristicTitle = `Simplificação por Fator Comum (MDC = ${factor})`;
    heuristicSteps.push(
      `1. Divida ambos por ${factor}: ${dividend} ÷ ${divisor} = ${dividend / factor} ÷ ${divisor / factor}.`,
      `2. Estime em dezenas: ${divisor / factor} × ${Math.floor(quotient / 10) * 10} = ${(divisor / factor) * Math.floor(quotient / 10) * 10}.`,
      `3. Restante: ${dividend / factor - (divisor / factor) * Math.floor(quotient / 10) * 10} ÷ ${divisor / factor} = ${quotient % 10}.`,
      `4. Total: ${Math.floor(quotient / 10) * 10} + ${quotient % 10} = ${quotient}.`,
    );
  }

  return {
    id: uid('div_l3'),
    skillId: 'division',
    pillar: 'math',
    kind: 'numeric',
    level: 3,
    contextTag: 'Orçamento & Volume',
    prompt,
    answer: quotient,
    unit: 'unidades',
    heuristicTitle,
    heuristicSteps,
  };
}

// ---------------------------------------------------------------------------
// 2. MULTIPLICATION
// ---------------------------------------------------------------------------
export function generateMultiplication(level: DifficultyLevel): NumericQuestion {
  if (level === 1) {
    const factorA = randInt(6, 9);
    const factorB = randInt(12, 39);
    const answer = factorA * factorB;

    const tens = Math.floor(factorB / 10) * 10;
    const units = factorB % 10;

    let heuristicTitle = 'Propriedade Distributiva (Dezenas + Unidades)';
    const heuristicSteps: string[] = [];

    if (units === 9) {
      heuristicTitle = 'Compensação por Arredondamento (× Dezena - 1)';
      const rounded = factorB + 1;
      heuristicSteps.push(
        `1. Arredonde ${factorB} para ${rounded}: ${factorA} × ${rounded} = ${factorA * rounded}.`,
        `2. Subtraia a diferença de 1 unidade (${factorA} × 1): ${factorA * rounded} - ${factorA} = ${answer}.`,
      );
    } else {
      heuristicSteps.push(
        `1. Separe ${factorB} em dezena e unidade: ${tens} + ${units}.`,
        `2. Multiplique a dezena: ${factorA} × ${tens} = ${factorA * tens}.`,
        `3. Multiplique a unidade: ${factorA} × ${units} = ${factorA * units}.`,
        `4. Some os dois resultados: ${factorA * tens} + ${factorA * units} = ${answer}.`,
      );
    }

    return {
      id: uid('mul_l1'),
      skillId: 'multiplication',
      pillar: 'math',
      kind: 'numeric',
      level: 1,
      contextTag: 'Multiplicação Distributiva',
      prompt: `Calcule mentalmente a multiplicação:\n\n${factorA} × ${factorB} = ?`,
      answer,
      heuristicTitle,
      heuristicSteps,
    };
  }

  if (level === 2) {
    const factorA = randInt(12, 29);
    const factorB = pick([12, 15, 18, 25] as const);
    const answer = factorA * factorB;

    let heuristicTitle = '';
    const heuristicSteps: string[] = [];

    if (factorB === 25) {
      heuristicTitle = 'Atalho do ×25 (Multiplicar por 100 e Dividir por 4)';
      const times100 = factorA * 100;
      const half1 = times100 / 2;
      heuristicSteps.push(
        `1. Multiplique ${factorA} por 100: ${times100}.`,
        `2. Divida por 4 tirando a metade duas vezes:`,
        `   • 1ª metade: ${times100} ÷ 2 = ${half1}`,
        `   • 2ª metade: ${half1} ÷ 2 = ${answer}.`,
      );
    } else if (factorB === 15) {
      heuristicTitle = 'Atalho do ×15 (Multiplicar por 10 + Metade)';
      const times10 = factorA * 10;
      const half = times10 / 2;
      heuristicSteps.push(
        `1. Multiplique ${factorA} por 10: ${times10}.`,
        `2. Calcule a metade desse valor (que é o equivalente a × 5): ${times10} ÷ 2 = ${half}.`,
        `3. Some os dois blocos: ${times10} + ${half} = ${answer}.`,
      );
    } else if (factorB === 18) {
      heuristicTitle = 'Compensação por 20 (×20 - Dobro)';
      const times20 = factorA * 20;
      const times2 = factorA * 2;
      heuristicSteps.push(
        `1. Multiplique ${factorA} por 20 (faça o dobro e adicione zero): ${times20}.`,
        `2. Subtraia 2 × ${factorA} (${times2}): ${times20} - ${times2} = ${answer}.`,
      );
    } else {
      // factorB === 12
      heuristicTitle = 'Atalho do ×12 (×10 + Dobro)';
      const times10 = factorA * 10;
      const times2 = factorA * 2;
      heuristicSteps.push(
        `1. Multiplique ${factorA} por 10: ${times10}.`,
        `2. Calcule o dobro: 2 × ${factorA} = ${times2}.`,
        `3. Some os dois resultados: ${times10} + ${times2} = ${answer}.`,
      );
    }

    return {
      id: uid('mul_l2'),
      skillId: 'multiplication',
      pillar: 'math',
      kind: 'numeric',
      level: 2,
      contextTag: 'Atalhos de Multiplicação',
      prompt: `Calcule mentalmente usando atalhos de decomposição:\n\n${factorA} × ${factorB} = ?`,
      answer,
      heuristicTitle,
      heuristicSteps,
    };
  }

  // Level 3
  const isSpecialMultiplier = randInt(0, 1) === 1;
  let factorA: number;
  let factorB: number;
  let heuristicTitle = '';
  const heuristicSteps: string[] = [];

  if (isSpecialMultiplier) {
    factorA = randInt(22, 48);
    factorB = pick([15, 19, 25, 35] as const);

    if (factorB === 19) {
      heuristicTitle = 'Compensação de Subtração (×20 - 1×)';
      heuristicSteps.push(
        `1. Multiplique por 20: ${factorA} × 20 = ${factorA * 20}.`,
        `2. Subtraia 1 × ${factorA}: ${factorA * 20} - ${factorA} = ${factorA * factorB}.`,
      );
    } else if (factorB === 35) {
      heuristicTitle = 'Atalho de Fator Dobrado (×70 ÷ 2)';
      heuristicSteps.push(
        `1. Dobre o 35 para 70: ${factorA} × 70 = ${factorA * 70}.`,
        `2. Divida o resultado pela metade: ${factorA * 70} ÷ 2 = ${factorA * factorB}.`,
      );
    } else if (factorB === 25) {
      heuristicTitle = 'Atalho do ×25 (×100 ÷ 4)';
      heuristicSteps.push(
        `1. Multiplique por 100: ${factorA * 100}.`,
        `2. Divida por 4: ${factorA * 100} ÷ 4 = ${factorA * factorB}.`,
      );
    } else {
      // 15
      heuristicTitle = 'Atalho do ×15 (×10 + Metade)';
      heuristicSteps.push(
        `1. Multiplique por 10: ${factorA * 10}.`,
        `2. Some a metade (${(factorA * 10) / 2}): ${factorA * 10} + ${(factorA * 10) / 2} = ${factorA * factorB}.`,
      );
    }
  } else {
    factorA = randInt(14, 29);
    factorB = randInt(14, 29);

    const tensA = Math.floor(factorA / 10) * 10;
    const unitsA = factorA % 10;

    heuristicTitle = 'Decomposição em Duas Etapas';
    heuristicSteps.push(
      `1. Decomponha ${factorA} em (${tensA} + ${unitsA}) × ${factorB}.`,
      `2. Etapa 1: ${tensA} × ${factorB} = ${tensA * factorB}.`,
      `3. Etapa 2: ${unitsA} × ${factorB} = ${unitsA * factorB}.`,
      `4. Soma final: ${tensA * factorB} + ${unitsA * factorB} = ${factorA * factorB}.`,
    );
  }

  const answer = factorA * factorB;

  return {
    id: uid('mul_l3'),
    skillId: 'multiplication',
    pillar: 'math',
    kind: 'numeric',
    level: 3,
    contextTag: 'Multiplicação de 2 Dígitos',
    prompt: `Resolva a multiplicação rapidamente:\n\n${factorA} × ${factorB} = ?`,
    answer,
    heuristicTitle,
    heuristicSteps,
  };
}

// ---------------------------------------------------------------------------
// 3. PERCENTAGE
// ---------------------------------------------------------------------------
export function generatePercentage(level: DifficultyLevel): NumericQuestion {
  if (level === 1) {
    const rate = pick([10, 20, 25, 50] as const);
    let base: number;

    if (rate === 50) {
      base = randInt(10, 90) * 2;
    } else if (rate === 25) {
      base = randInt(5, 45) * 4;
    } else if (rate === 20) {
      base = randInt(4, 40) * 10;
    } else {
      base = randInt(5, 50) * 10;
    }

    const answer = Math.round((base * rate) / 100);
    const isContextual = randInt(0, 1) === 1;
    const name = pick(NAMES);
    const product = pick(PRODUCTS);

    const prompt = isContextual
      ? `${name} obteve um desconto de ${rate}% na compra de ${product} cujo valor de tabela era R$ ${base}. Qual foi o valor do desconto em reais?`
      : `Calcule mentalmente:\n\n${rate}% de ${base} = ?`;

    const heuristicSteps: string[] = [];
    let heuristicTitle = '';

    if (rate === 10) {
      heuristicTitle = 'Regra dos 10% (Mover 1 Casa Decimal)';
      heuristicSteps.push(
        `1. Para achar 10% de qualquer número, basta dividir por 10 (deslocar a vírgula 1 casa para a esquerda).`,
        `2. ${base} ÷ 10 = ${answer}.`,
      );
    } else if (rate === 20) {
      heuristicTitle = 'Regra dos 20% (10% × 2)';
      heuristicSteps.push(
        `1. Calcule 10% de ${base}: ${base} ÷ 10 = ${base / 10}.`,
        `2. Dobre o valor encontrado: 2 × ${base / 10} = ${answer}.`,
      );
    } else if (rate === 25) {
      heuristicTitle = 'Regra dos 25% (Dividir por 4 / Metade da Metade)';
      heuristicSteps.push(
        `1. 25% equivale a 1/4 do total.`,
        `2. Tire a 1ª metade: ${base} ÷ 2 = ${base / 2}.`,
        `3. Tire a 2ª metade: ${base / 2} ÷ 2 = ${answer}.`,
      );
    } else {
      // 50%
      heuristicTitle = 'Regra dos 50% (Metade Direta)';
      heuristicSteps.push(
        `1. 50% equivale a metade exata (1/2).`,
        `2. Divida ${base} por 2: ${base} ÷ 2 = ${answer}.`,
      );
    }

    return {
      id: uid('pct_l1'),
      skillId: 'percentage',
      pillar: 'math',
      kind: 'numeric',
      level: 1,
      contextTag: isContextual ? 'Descontos & Compras' : 'Porcentagens Fundamentais',
      prompt,
      answer,
      unit: isContextual ? 'R$' : undefined,
      heuristicTitle,
      heuristicSteps,
    };
  }

  if (level === 2) {
    const rate = pick([12, 15, 30, 40, 60, 75] as const);
    let base: number;

    if (rate === 75) {
      base = randInt(4, 25) * 20; // 80 to 500
    } else if (rate === 15) {
      base = randInt(5, 35) * 20; // 100 to 700
    } else if (rate === 12) {
      base = randInt(4, 20) * 25; // 100 to 500 (multiple of 25 guarantees integer 12%)
    } else {
      base = randInt(6, 40) * 10; // 60 to 400
    }

    const answer = Math.round((base * rate) / 100);
    const company = pick(COMPANIES);
    const term = pick(TECH_TERMS);

    const prompt = `A ${company} registrou uma otimização de ${rate}% no processamento de ${base} ${term}. Quantos ${term} foram impactados positivamente?`;

    let heuristicTitle = '';
    const heuristicSteps: string[] = [];

    if (rate === 15) {
      heuristicTitle = 'Composição de 15% (10% + Metade dos 10%)';
      const tenPct = base * 0.1;
      const fivePct = tenPct / 2;
      heuristicSteps.push(
        `1. Calcule 10% de ${base}: ${tenPct}.`,
        `2. Calcule 5% (metade de 10%): ${fivePct}.`,
        `3. Some os dois valores: ${tenPct} + ${fivePct} = ${answer}.`,
      );
    } else if (rate === 30) {
      heuristicTitle = 'Multiplicação de 30% (10% × 3)';
      const tenPct = base * 0.1;
      heuristicSteps.push(
        `1. Calcule 10% de ${base}: ${tenPct}.`,
        `2. Multiplique por 3: 3 × ${tenPct} = ${answer}.`,
      );
    } else if (rate === 40) {
      heuristicTitle = 'Estratégia dos 40% (50% - 10% ou 10% × 4)';
      const half = base * 0.5;
      const tenPct = base * 0.1;
      heuristicSteps.push(
        `1. Calcule 50% de ${base}: ${half}.`,
        `2. Calcule 10% de ${base}: ${tenPct}.`,
        `3. Subtraia: ${half} - ${tenPct} = ${answer}.`,
      );
    } else if (rate === 60) {
      heuristicTitle = 'Composição de 60% (50% + 10%)';
      const half = base * 0.5;
      const tenPct = base * 0.1;
      heuristicSteps.push(
        `1. Calcule 50% de ${base}: ${half}.`,
        `2. Calcule 10% de ${base}: ${tenPct}.`,
        `3. Some os dois valores: ${half} + ${tenPct} = ${answer}.`,
      );
    } else if (rate === 75) {
      heuristicTitle = 'Estratégia dos 75% (50% + 25% ou 3/4)';
      const half = base * 0.5;
      const quarter = base * 0.25;
      heuristicSteps.push(
        `1. 75% equivale a 50% + 25%.`,
        `2. Calcule 50%: ${half}.`,
        `3. Calcule 25% (metade de 50%): ${quarter}.`,
        `4. Some: ${half} + ${quarter} = ${answer}.`,
      );
    } else {
      // 12%
      heuristicTitle = 'Composição de 12% (10% + 2 × 1%)';
      const tenPct = base * 0.1;
      const onePct = base * 0.01;
      heuristicSteps.push(
        `1. Calcule 10% de ${base}: ${tenPct}.`,
        `2. Calcule 1% de ${base}: ${onePct}.`,
        `3. Some 10% + 2 × (1%): ${tenPct} + ${onePct * 2} = ${answer}.`,
      );
    }

    return {
      id: uid('pct_l2'),
      skillId: 'percentage',
      pillar: 'math',
      kind: 'numeric',
      level: 2,
      contextTag: 'Métricas de Performance',
      prompt,
      answer,
      unit: 'unidades',
      heuristicTitle,
      heuristicSteps,
    };
  }

  // Level 3: Reverse percentage or sequential growth
  const mode = randInt(0, 1);
  if (mode === 0) {
    // Reverse discount: Paid price after discount -> original price
    const rate = pick([10, 20, 25, 30, 40, 50] as const);
    const original = pick([
      120, 150, 160, 180, 200, 240, 250, 300, 320, 360, 400, 450, 500, 600, 800, 1000,
    ] as const);
    const remainingRate = 100 - rate;
    const paidValue = (original * remainingRate) / 100;

    const name = pick(NAMES);
    const product = pick(PRODUCTS);

    const prompt = `${name} adquiriu ${product} com ${rate}% de desconto à vista e pagou exatamente R$ ${paidValue}. Qual era o valor original integral (sem desconto) em reais?`;

    return {
      id: uid('pct_l3_rev'),
      skillId: 'percentage',
      pillar: 'math',
      kind: 'numeric',
      level: 3,
      contextTag: 'Porcentagem Reversa',
      prompt,
      answer: original,
      unit: 'R$',
      heuristicTitle: 'Cálculo Reverso de Porcentagem',
      heuristicSteps: [
        `1. Identifique a porcentagem paga: com desconto de ${rate}%, o valor de R$ ${paidValue} corresponde a ${remainingRate}% do preço original.`,
        `2. Calcule o valor correspondente a 1%: R$ ${paidValue} ÷ ${remainingRate} = R$ ${paidValue / remainingRate}.`,
        `3. Multiplique por 100 para chegar aos 100% integrais: R$ ${paidValue / remainingRate} × 100 = R$ ${original}.`,
      ],
    };
  }

  // Sequential / Growth reverse
  const rate = pick([15, 20, 25, 30, 50] as const);
  const base = pick([120, 150, 200, 240, 300, 400, 500, 600, 800] as const);
  const increasedTotal = (base * (100 + rate)) / 100;
  const company = pick(COMPANIES);
  const term = pick(TECH_TERMS);

  const prompt = `A ${company} expandiu seu throughput em ${rate}%, atingindo ${increasedTotal} ${term} por minuto. Quantos ${term} por minuto o sistema processava antes da expansão?`;

  return {
    id: uid('pct_l3_growth'),
    skillId: 'percentage',
    pillar: 'math',
    kind: 'numeric',
    level: 3,
    contextTag: 'Throughput & Escala',
    prompt,
    answer: base,
    unit: 'unidades',
    heuristicTitle: 'Recuperação de Base Pré-Aumento',
    heuristicSteps: [
      `1. O novo total (${increasedTotal}) corresponde a ${100 + rate}% do valor original pré-aumento.`,
      `2. Calcule 1% da base original: ${increasedTotal} ÷ ${100 + rate} = ${increasedTotal / (100 + rate)}.`,
      `3. Multiplique por 100: ${increasedTotal / (100 + rate)} × 100 = ${base}.`,
    ],
  };
}

// ---------------------------------------------------------------------------
// 4. RULE OF THREE
// ---------------------------------------------------------------------------
export function generateRuleOfThree(level: DifficultyLevel): NumericQuestion {
  if (level === 1) {
    const ratePerUnit = pick([5, 8, 10, 12, 15, 20, 25, 30, 40, 50] as const);
    const qty1 = randInt(2, 5);
    const val1 = qty1 * ratePerUnit;
    const qty2 = randInt(6, 12);
    const answer = qty2 * ratePerUnit;

    const term = pick(TECH_TERMS);
    const prompt = `Se ${qty1} servidores processam ${val1} ${term} por minuto, quantos ${term} por minuto serão processados por ${qty2} servidores do mesmo modelo?`;

    return {
      id: uid('r3_l1'),
      skillId: 'rule_of_three',
      pillar: 'math',
      kind: 'numeric',
      level: 1,
      contextTag: 'Proporção Direta Simples',
      prompt,
      answer,
      unit: 'unidades',
      heuristicTitle: 'Redução à Unidade Unitária',
      heuristicSteps: [
        `1. Calcule a taxa unitária de processamento (1 servidor): ${val1} ÷ ${qty1} = ${ratePerUnit} por minuto.`,
        `2. Multiplique pela nova quantidade de servidores: ${qty2} × ${ratePerUnit} = ${answer}.`,
      ],
    };
  }

  if (level === 2) {
    // Cross proportion with simplifying numbers
    const unitRate = randInt(12, 45);
    const qty1 = pick([4, 6, 8, 9, 12, 15] as const);
    let qty2 = pick([6, 8, 10, 12, 14, 16, 18, 20] as const);
    while (qty2 === qty1) {
      qty2 = (qty2 + 2) as typeof qty2;
    }

    const val1 = qty1 * unitRate;
    const answer = qty2 * unitRate;

    const name = pick(NAMES);
    const prompt = `Uma equipe liderada por ${name} com ${qty1} desenvolvedores entrega ${val1} story points em uma sprint. Mantendo exatamente a mesma produtividade individual, quantos story points serão entregues se a equipe passar para ${qty2} desenvolvedores?`;

    return {
      id: uid('r3_l2'),
      skillId: 'rule_of_three',
      pillar: 'math',
      kind: 'numeric',
      level: 2,
      contextTag: 'Produtividade de Equipe',
      prompt,
      answer,
      unit: 'story points',
      heuristicTitle: 'Proporção Direta Cruzada',
      heuristicSteps: [
        `1. Monte a relação de proporção direta: ${qty1} devs ➔ ${val1} pts; ${qty2} devs ➔ X pts.`,
        `2. Fórmula: X = (${val1} × ${qty2}) ÷ ${qty1}.`,
        `3. Simplifique primeiro dividindo ${val1} por ${qty1} (${val1} ÷ ${qty1} = ${unitRate} por dev).`,
        `4. Multiplique pelo novo time: ${qty2} × ${unitRate} = ${answer}.`,
      ],
    };
  }

  // Level 3: INVERSE PROPORTION
  // A workers take B hours. How many hours for C workers?
  // W = A * B. Answer = W / C.
  const workPresets = [
    { a: 3, b: 40, c: 6 }, // 120 / 6 = 20
    { a: 4, b: 30, c: 6 }, // 120 / 6 = 20
    { a: 2, b: 60, c: 5 }, // 120 / 5 = 24
    { a: 3, b: 60, c: 9 }, // 180 / 9 = 20
    { a: 4, b: 45, c: 6 }, // 180 / 6 = 30
    { a: 4, b: 60, c: 8 }, // 240 / 8 = 30
    { a: 5, b: 48, c: 6 }, // 240 / 6 = 40
    { a: 6, b: 60, c: 10 }, // 360 / 10 = 36
    { a: 8, b: 45, c: 12 }, // 360 / 12 = 30
    { a: 6, b: 80, c: 16 }, // 480 / 16 = 30
    { a: 8, b: 75, c: 10 }, // 600 / 10 = 60
    { a: 10, b: 72, c: 12 }, // 720 / 12 = 60
  ];

  const preset = pick(workPresets);
  const totalWork = preset.a * preset.b;
  const answer = totalWork / preset.c;

  const term = pick(TECH_TERMS);
  const prompt = `Se ${preset.a} instâncias computacionais levam ${preset.b} minutos para processar uma rotina pesada de ${term}, quantos minutos ${preset.c} instâncias idênticas levarão para concluir a mesma tarefa em paralelo?`;

  return {
    id: uid('r3_l3_inv'),
    skillId: 'rule_of_three',
    pillar: 'math',
    kind: 'numeric',
    level: 3,
    contextTag: 'Proporção Inversa',
    prompt,
    answer,
    unit: 'minutos',
    heuristicTitle: 'Regra de Três Inversa (Mais Recursos = Menos Tempo)',
    heuristicSteps: [
      `1. Identifique a proporcionalidade inversa: aumentar o número de instâncias REDUZ o tempo necessário.`,
      `2. Calcule o volume total de trabalho constante: ${preset.a} instâncias × ${preset.b} minutos = ${totalWork} instância-minutos.`,
      `3. Divida o esforço total pelo novo número de instâncias: ${totalWork} ÷ ${preset.c} = ${answer} minutos.`,
    ],
  };
}
