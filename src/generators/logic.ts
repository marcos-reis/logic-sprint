/**
 * Logic Question Generators for LogicSprint.
 * Covers: syllogism, sequence, and 3x3 matrix visual puzzles.
 * Invariants: Single correct option, smart distractors, zero duplicate options, rich heuristics.
 */

import {
  ChoiceOption,
  ChoiceQuestion,
  DifficultyLevel,
  MatrixCell,
  MatrixFill,
  MatrixRotation,
  MatrixShape,
} from '../engine/types';
import {
  COMPANIES,
  NAMES,
  TECH_TERMS,
  pick,
  pickDistinct,
  randInt,
  shuffle,
  uid,
} from './utils';

// ---------------------------------------------------------------------------
// 1. SYLLOGISM & DEDUCTION
// ---------------------------------------------------------------------------
export function generateSyllogism(level: DifficultyLevel): ChoiceQuestion {
  if (level === 1) {
    const isTransitive = randInt(0, 1) === 1;

    if (isTransitive) {
      // Todo A é B; Todo B é C => Todo A é C
      const terms = pickDistinct(
        [
          'microsserviços conteinerizados',
          'módulos com alta disponibilidade',
          'sistemas tolerantes a falhas',
          'serviços escaláveis em nuvem',
          'APIs resilientes',
          'componentes assíncronos',
        ] as const,
        3,
      );
      const [termA, termB, termC] = terms;

      const prompt = `Considere as seguintes premissas lógicas verdadeiras:\n\n1. Todos os ${termA} são ${termB}.\n2. Todos os ${termB} são ${termC}.\n\nQual conclusão lógica decorre necessariamente dessas premissas?`;

      const correctText = `Todos os ${termA} são ${termC}.`;
      const distractors = [
        `Nenhum ${termA} é ${termC}.`,
        `Todos os ${termC} são ${termA}.`,
        `Alguns ${termB} não são ${termA}.`,
      ];

      const correctId = uid('opt_cor');
      const options: ChoiceOption[] = shuffle([
        { id: correctId, label: correctText },
        { id: uid('opt_dist1'), label: distractors[0] },
        { id: uid('opt_dist2'), label: distractors[1] },
        { id: uid('opt_dist3'), label: distractors[2] },
      ]);

      return {
        id: uid('syl_l1'),
        skillId: 'syllogism',
        pillar: 'logic',
        kind: 'choice',
        level: 1,
        contextTag: 'Silogismo Categórico Direto',
        prompt,
        options,
        correctOptionId: correctId,
        heuristicTitle: 'Transitividade Universal (Modus Barbara)',
        heuristicSteps: [
          `1. Visualize os conjuntos em diagramas de Venn/Euler: o conjunto A está totalmente contido em B (A ⊆ B).`,
          `2. O conjunto B está totalmente contido em C (B ⊆ C).`,
          `3. Por inclusão direta (transitividade de subconjuntos), todo elemento de A pertence obrigatoriamente a C (A ⊆ C).`,
          `4. Cuidado: o inverso ("Todo C é A") é uma falácia clássica de generalização indevida.`,
        ],
      };
    }

    // Modus Ponens
    const name = pick(NAMES);
    const term = pick(TECH_TERMS);

    const prompt = `Considere as seguintes afirmações verdadeiras:\n\n1. Se um deploy for aprovado pelo pipeline de segurança, ele é enviado automaticamente para produção.\n2. O deploy do módulo de ${term} gerenciado por ${name} foi aprovado pelo pipeline de segurança.\n\nQual conclusão é obrigatoriamente verdadeira?`;

    const correctText = `O deploy do módulo de ${term} foi enviado automaticamente para produção.`;
    const distractors = [
      `O deploy do módulo de ${term} precisará de nova aprovação manual.`,
      `Nenhum outro deploy entrará em produção hoje.`,
      `O pipeline de segurança foi desativado temporariamente.`,
    ];

    const correctId = uid('opt_cor');
    const options: ChoiceOption[] = shuffle([
      { id: correctId, label: correctText },
      { id: uid('opt_dist1'), label: distractors[0] },
      { id: uid('opt_dist2'), label: distractors[1] },
      { id: uid('opt_dist3'), label: distractors[2] },
    ]);

    return {
      id: uid('syl_l1_mp'),
      skillId: 'syllogism',
      pillar: 'logic',
      kind: 'choice',
      level: 1,
      contextTag: 'Dedução Condicional Direta',
      prompt,
      options,
      correctOptionId: correctId,
      heuristicTitle: 'Modus Ponens (Afirmação do Antecedente)',
      heuristicSteps: [
        `1. Identifique a estrutura condicional: Se P (aprovado no pipeline), então Q (vai para produção).`,
        `2. Identifique a premissa de fato: Afirmou-se P (o deploy foi aprovado).`,
        `3. Regra de inferência válida: P → Q e P ⊨ Q.`,
        `4. Logo, a consequência Q é necessariamente verdadeira.`,
      ],
    };
  }

  if (level === 2) {
    const isExclusion = randInt(0, 1) === 1;

    if (isExclusion) {
      // Nenhum A é B; Todo C é A => Nenhum C é B
      const terms = pickDistinct(
        [
          'processos legados monolíticos',
          'rotinas com arquitetura Serverless',
          'microsserviços de baixa latência',
          'workers com processamento síncrono bloqueante',
          'instâncias efêmeras',
        ] as const,
        3,
      );
      const [termA, termB, termC] = terms;

      const prompt = `Considere as premissas lógicas verdadeiras:\n\n1. Nenhum dos ${termA} é classificado como ${termB}.\n2. Todos os ${termC} pertencem à categoria de ${termA}.\n\nQual conclusão decorre necessariamente dessas afirmações?`;

      const correctText = `Nenhum dos ${termC} é classificado como ${termB}.`;
      const distractors = [
        `Todos os ${termC} são classificados como ${termB}.`,
        `Alguns ${termB} são classificados como ${termC}.`,
        `Todos os ${termA} pertencem à categoria de ${termC}.`,
      ];

      const correctId = uid('opt_cor');
      const options: ChoiceOption[] = shuffle([
        { id: correctId, label: correctText },
        { id: uid('opt_dist1'), label: distractors[0] },
        { id: uid('opt_dist2'), label: distractors[1] },
        { id: uid('opt_dist3'), label: distractors[2] },
      ]);

      return {
        id: uid('syl_l2_excl'),
        skillId: 'syllogism',
        pillar: 'logic',
        kind: 'choice',
        level: 2,
        contextTag: 'Exclusão Universal (Modus Celarent)',
        prompt,
        options,
        correctOptionId: correctId,
        heuristicTitle: 'Exclusão Categórica Universal',
        heuristicSteps: [
          `1. Conjuntos A e B são disjuntos (A ∩ B = ∅): nada que é A pode ser B.`,
          `2. O conjunto C está totalmente contido em A (C ⊆ A).`,
          `3. Como todo elemento de C é elemento de A, e nenhum elemento de A pertence a B, segue que C ∩ B = ∅.`,
          `4. Conclusão inevitável: Nenhum C é B.`,
        ],
      };
    }

    // Modus Tollens (Se P então Q; Não Q => Não P)
    const term = pick(TECH_TERMS);

    const prompt = `Considere as seguintes premissas verdadeiras:\n\n1. Se a taxa de erro nas ${term} ultrapassar o limiar de 5%, o balanceador de carga aciona o fallback de emergência.\n2. O balanceador de carga NÃO acionou o fallback de emergência.\n\nQual conclusão lógica é garantidamente verdadeira?`;

    const correctText = `A taxa de erro nas ${term} não ultrapassou o limiar de 5%.`;
    const distractors = [
      `A taxa de erro nas ${term} ultrapassou o limiar de 5%, mas o balanceador falhou.`,
      `O balanceador de carga está desligado ou sem energia.`,
      `Não é possível determinar nada sobre a taxa de erro.`,
    ];

    const correctId = uid('opt_cor');
    const options: ChoiceOption[] = shuffle([
      { id: correctId, label: correctText },
      { id: uid('opt_dist1'), label: distractors[0] },
      { id: uid('opt_dist2'), label: distractors[1] },
      { id: uid('opt_dist3'), label: distractors[2] },
    ]);

    return {
      id: uid('syl_l2_mt'),
      skillId: 'syllogism',
      pillar: 'logic',
      kind: 'choice',
      level: 2,
      contextTag: 'Modus Tollens (Negação do Consequente)',
      prompt,
      options,
      correctOptionId: correctId,
      heuristicTitle: 'Modus Tollens (Contrapositiva)',
      heuristicSteps: [
        `1. Estrutura condicional: P → Q (Taxa > 5% → Aciona fallback).`,
        `2. Negação do consequente: ¬Q (Não acionou fallback).`,
        `3. Regra de inferência válida: (P → Q) e ¬Q ⊨ ¬P.`,
        `4. Conclusão necessária: A condição P não ocorreu (Taxa ≤ 5%).`,
      ],
    };
  }

  // Level 3: Fallacy Traps (Afirmação do Consequente / Negação do Antecedente)
  const isAffirmingConsequent = randInt(0, 1) === 1;

  if (isAffirmingConsequent) {
    // Se P então Q; Q ocorreu => Não se pode afirmar P
    const term = pick(TECH_TERMS);
    const company = pick(COMPANIES);

    const prompt = `Analise a situação lógica na infraestrutura da ${company}:\n\n1. Premissa 1: Se a base primária de dados sofrer sobrecarga de conexões (P), a latência média das ${term} subirá acima de 500ms (Q).\n2. Fato observado: A latência média das ${term} subiu acima de 500ms (Q).\n\nCom base estritamente na lógica formal, qual é a dedução correta?`;

    const correctText = `Não é possível concluir com certeza se a base primária sofreu sobrecarga de conexões (outros fatores podem ter causado a alta latência).`;
    const distractors = [
      `A base primária de dados certamente sofreu sobrecarga de conexões.`,
      `Nenhuma query foi processada pela base primária.`,
      `A latência média voltará a menos de 500ms na próxima hora.`,
    ];

    const correctId = uid('opt_cor');
    const options: ChoiceOption[] = shuffle([
      { id: correctId, label: correctText },
      { id: uid('opt_dist1'), label: distractors[0] },
      { id: uid('opt_dist2'), label: distractors[1] },
      { id: uid('opt_dist3'), label: distractors[2] },
    ]);

    return {
      id: uid('syl_l3_fallacy'),
      skillId: 'syllogism',
      pillar: 'logic',
      kind: 'choice',
      level: 3,
      contextTag: 'Armadilha Lógica (Afirmação do Consequente)',
      prompt,
      options,
      correctOptionId: correctId,
      heuristicTitle: 'Identificação da Falácia Formal (P → Q não implica Q → P)',
      heuristicSteps: [
        `1. Premissa: Se P, então Q. Isso indica que P é uma condição SUFICIENTE para Q, mas não necessariamente a ÚNICA.`,
        `2. Fato: Q ocorreu.`,
        `3. Armadilha mental: Concluir P a partir de Q é a falácia da Afirmação do Consequente.`,
        `4. Correto: A alta de latência pode ter ocorrido por gargalo de rede, concorrência de CPU, deploy defeituoso ou outros fatores. Nenhuma conclusão definitiva sobre P é válida.`,
      ],
    };
  }

  // 3-premise chain with universal exclusion
  const terms = pickDistinct(
    [
      'módulos em Ruby legados',
      'serviços que manipulam dados sensíveis LGPD',
      'bancos de dados isolados em VPC privada',
      'endpoints expostos à internet pública',
      'workers em DMZ',
    ] as const,
    4,
  );
  const [termA, termB, termC, termD] = terms;

  const prompt = `Considere o conjunto de regras de segurança:\n\n1. Todos os ${termA} são ${termB}.\n2. Todos os ${termB} operam exclusivamente em ${termC}.\n3. Nenhum recurso em ${termC} pode ser ${termD}.\n\nQual conclusão lógica é necessariamente verdadeira?`;

  const correctText = `Nenhum dos ${termA} pode ser ${termD}.`;
  const distractors = [
    `Todos os ${termD} operam exclusivamente em ${termC}.`,
    `Alguns ${termA} podem ser ${termD} com autorização.`,
    `Todos os ${termB} são classificados como ${termA}.`,
  ];

  const correctId = uid('opt_cor');
  const options: ChoiceOption[] = shuffle([
    { id: correctId, label: correctText },
    { id: uid('opt_dist1'), label: distractors[0] },
    { id: uid('opt_dist2'), label: distractors[1] },
    { id: uid('opt_dist3'), label: distractors[2] },
  ]);

  return {
    id: uid('syl_l3_chain'),
    skillId: 'syllogism',
    pillar: 'logic',
    kind: 'choice',
    level: 3,
    contextTag: 'Cadeia de Dedução Composta (3 Premissas)',
    prompt,
    options,
    correctOptionId: correctId,
    heuristicTitle: 'Cadeia de Inclusão e Exclusão Composta',
    heuristicSteps: [
      `1. Premissa 1 e 2: A ⊆ B e B ⊆ C ➔ Logo, A ⊆ C (todo A opera em C).`,
      `2. Premissa 3: C ∩ D = ∅ (nenhum C pode ser D).`,
      `3. Como todo A está dentro de C, e C é totalmente separado de D, segue que A ∩ D = ∅.`,
      `4. Conclusão rigorosa: Nenhum A pode ser D.`,
    ],
  };
}

// ---------------------------------------------------------------------------
// 2. LOGICAL SEQUENCES
// ---------------------------------------------------------------------------
export function generateSequence(level: DifficultyLevel): ChoiceQuestion {
  if (level === 1) {
    const isGeometric = randInt(0, 1) === 1;

    if (isGeometric) {
      const ratio = pick([2, 3] as const);
      const start = ratio === 2 ? randInt(2, 6) : randInt(2, 4);
      const terms = [
        start,
        start * ratio,
        start * ratio ** 2,
        start * ratio ** 3,
        start * ratio ** 4,
      ];
      const answer = start * ratio ** 5;

      const prompt = `Identifique o padrão numérico e determine o próximo elemento da sequência:\n\n${terms.join(', ')}, [ ? ]`;

      const distSet = new Set<number>([answer]);
      const candidateDistractors = [
        answer + ratio,
        answer - start * ratio,
        start * ratio ** 4 + (start * ratio ** 4 - start * ratio ** 3),
        answer + start,
        answer * 2,
      ];
      for (const d of candidateDistractors) {
        if (d > 0 && d !== answer && distSet.size < 4) {
          distSet.add(d);
        }
      }
      while (distSet.size < 4) {
        distSet.add(answer + randInt(1, 10) * ratio);
      }

      const distList = Array.from(distSet).filter((v) => v !== answer);
      const correctId = uid('opt_seq_cor');
      const options: ChoiceOption[] = shuffle([
        { id: correctId, label: String(answer) },
        { id: uid('opt_seq_d1'), label: String(distList[0]) },
        { id: uid('opt_seq_d2'), label: String(distList[1]) },
        { id: uid('opt_seq_d3'), label: String(distList[2]) },
      ]);

      return {
        id: uid('seq_l1_geo'),
        skillId: 'sequence',
        pillar: 'logic',
        kind: 'choice',
        level: 1,
        contextTag: 'Progressão Geométrica',
        prompt,
        options,
        correctOptionId: correctId,
        heuristicTitle: `Multiplicação Constante (× ${ratio})`,
        heuristicSteps: [
          `1. Analise a razão entre termos adjacentes: ${terms[1]} ÷ ${terms[0]} = ${ratio}, ${terms[2]} ÷ ${terms[1]} = ${ratio}.`,
          `2. Cada termo é obtido multiplicando o anterior por ${ratio}.`,
          `3. Próximo termo: ${terms[terms.length - 1]} × ${ratio} = ${answer}.`,
        ],
      };
    }

    // Arithmetic progression
    const step = pick([3, 4, 5, 6, 7, 8, 9, 12, 15] as const);
    const start = randInt(2, 20);
    const terms = [start, start + step, start + 2 * step, start + 3 * step, start + 4 * step];
    const answer = start + 5 * step;

    const prompt = `Descubra o padrão e determine o próximo número da sequência:\n\n${terms.join(', ')}, [ ? ]`;

    const distSet = new Set<number>([answer]);
    const candidateDistractors = [
      answer + step,
      answer - 1,
      answer + 2,
      answer - step,
      terms[terms.length - 1] + step * 2,
    ];
    for (const d of candidateDistractors) {
      if (d > 0 && d !== answer && distSet.size < 4) {
        distSet.add(d);
      }
    }
    while (distSet.size < 4) {
      distSet.add(answer + randInt(-5, 5));
    }

    const distList = Array.from(distSet).filter((v) => v !== answer);
    const correctId = uid('opt_seq_cor');
    const options: ChoiceOption[] = shuffle([
      { id: correctId, label: String(answer) },
      { id: uid('opt_seq_d1'), label: String(distList[0]) },
      { id: uid('opt_seq_d2'), label: String(distList[1]) },
      { id: uid('opt_seq_d3'), label: String(distList[2]) },
    ]);

    return {
      id: uid('seq_l1_arith'),
      skillId: 'sequence',
      pillar: 'logic',
      kind: 'choice',
      level: 1,
      contextTag: 'Progressão Aritmética',
      prompt,
      options,
      correctOptionId: correctId,
      heuristicTitle: `Razão Constante (+${step})`,
      heuristicSteps: [
        `1. Calcule a diferença entre termos consecutivos: ${terms[1]} - ${terms[0]} = ${step}.`,
        `2. A diferença permanece constante (+${step}) ao longo de toda a série.`,
        `3. Próximo termo: ${terms[terms.length - 1]} + ${step} = ${answer}.`,
      ],
    };
  }

  if (level === 2) {
    const isGrowingDelta = randInt(0, 1) === 1;

    if (isGrowingDelta) {
      // Delta crescente: +2, +4, +6, +8, +10... ou +3, +5, +7, +9...
      const start = randInt(2, 10);
      const deltaStart = pick([2, 3, 4] as const);
      const deltaStep = pick([2, 3] as const);

      const d1 = deltaStart;
      const d2 = d1 + deltaStep;
      const d3 = d2 + deltaStep;
      const d4 = d3 + deltaStep;
      const d5 = d4 + deltaStep;

      const terms = [
        start,
        start + d1,
        start + d1 + d2,
        start + d1 + d2 + d3,
        start + d1 + d2 + d3 + d4,
      ];
      const answer = terms[terms.length - 1] + d5;

      const prompt = `Analise a taxa de variação e complete a sequência:\n\n${terms.join(', ')}, [ ? ]`;

      const distSet = new Set<number>([answer]);
      const candidateDistractors = [
        terms[terms.length - 1] + d4, // repeat last delta
        answer + deltaStep,
        answer - deltaStep,
        answer + 2,
        terms[terms.length - 1] + d5 + deltaStep,
      ];
      for (const d of candidateDistractors) {
        if (d > 0 && d !== answer && distSet.size < 4) {
          distSet.add(d);
        }
      }
      while (distSet.size < 4) {
        distSet.add(answer + randInt(-8, 8));
      }

      const distList = Array.from(distSet).filter((v) => v !== answer);
      const correctId = uid('opt_seq_cor');
      const options: ChoiceOption[] = shuffle([
        { id: correctId, label: String(answer) },
        { id: uid('opt_seq_d1'), label: String(distList[0]) },
        { id: uid('opt_seq_d2'), label: String(distList[1]) },
        { id: uid('opt_seq_d3'), label: String(distList[2]) },
      ]);

      return {
        id: uid('seq_l2_grow'),
        skillId: 'sequence',
        pillar: 'logic',
        kind: 'choice',
        level: 2,
        contextTag: 'Delta de 2ª Ordem (Aceleração)',
        prompt,
        options,
        correctOptionId: correctId,
        heuristicTitle: 'Diferenças de Segunda Ordem (Delta Crescente)',
        heuristicSteps: [
          `1. Calcule as primeiras diferenças entre termos: +${d1}, +${d2}, +${d3}, +${d4}.`,
          `2. Note que os incrementos aumentam de ${deltaStep} em ${deltaStep}.`,
          `3. O próximo incremento deve ser +${d5} (${d4} + ${deltaStep}).`,
          `4. Calcule o próximo termo: ${terms[terms.length - 1]} + ${d5} = ${answer}.`,
        ],
      };
    }

    // Alternating deltas: +a, -b, +a, -b...
    const addVal = randInt(6, 10);
    const subVal = randInt(2, 4);
    const start = randInt(10, 25);

    const t0 = start;
    const t1 = t0 + addVal;
    const t2 = t1 - subVal;
    const t3 = t2 + addVal;
    const t4 = t3 - subVal;
    const t5 = t4 + addVal;
    const answer = t5 - subVal;

    const terms = [t0, t1, t2, t3, t4, t5];
    const prompt = `Identifique o padrão alternado e encontre o próximo termo:\n\n${terms.join(', ')}, [ ? ]`;

    const distSet = new Set<number>([answer]);
    const candidateDistractors = [
      t5 + addVal, // applied add instead of sub
      answer + subVal,
      answer - addVal,
      answer + 2,
      t5 - 1,
    ];
    for (const d of candidateDistractors) {
      if (d > 0 && d !== answer && distSet.size < 4) {
        distSet.add(d);
      }
    }
    while (distSet.size < 4) {
      distSet.add(answer + randInt(-6, 6));
    }

    const distList = Array.from(distSet).filter((v) => v !== answer);
    const correctId = uid('opt_seq_cor');
    const options: ChoiceOption[] = shuffle([
      { id: correctId, label: String(answer) },
      { id: uid('opt_seq_d1'), label: String(distList[0]) },
      { id: uid('opt_seq_d2'), label: String(distList[1]) },
      { id: uid('opt_seq_d3'), label: String(distList[2]) },
    ]);

    return {
      id: uid('seq_l2_alt'),
      skillId: 'sequence',
      pillar: 'logic',
      kind: 'choice',
      level: 2,
      contextTag: 'Padrão Oscilante (+a, -b)',
      prompt,
      options,
      correctOptionId: correctId,
      heuristicTitle: `Operações Alternadas (+${addVal}, -${subVal})`,
      heuristicSteps: [
        `1. Observe o comportamento passo a passo:`,
        `   • ${t0} ➔ ${t1} (+${addVal})`,
        `   • ${t1} ➔ ${t2} (-${subVal})`,
        `   • ${t2} ➔ ${t3} (+${addVal})`,
        `   • ${t3} ➔ ${t4} (-${subVal})`,
        `   • ${t4} ➔ ${t5} (+${addVal})`,
        `2. O próximo passo da alternância deve subtrair ${subVal}.`,
        `3. Próximo termo: ${t5} - ${subVal} = ${answer}.`,
      ],
    };
  }

  // Level 3: Interleaved sequence or recursive (x2 + k)
  const isRecursive = randInt(0, 1) === 1;

  if (isRecursive) {
    // an = 2 * a_{n-1} + k
    const k = pick([-1, 1, 2, 3] as const);
    const start = randInt(2, 5);

    const t0 = start;
    const t1 = 2 * t0 + k;
    const t2 = 2 * t1 + k;
    const t3 = 2 * t2 + k;
    const t4 = 2 * t3 + k;
    const answer = 2 * t4 + k;

    const terms = [t0, t1, t2, t3, t4];
    const prompt = `Decifre a relação de recorrência para determinar o próximo valor:\n\n${terms.join(', ')}, [ ? ]`;

    const distSet = new Set<number>([answer]);
    const candidateDistractors = [
      t4 * 2,
      answer - k,
      answer + 2 * k,
      t4 + (t4 - t3),
      answer + 4,
    ];
    for (const d of candidateDistractors) {
      if (d > 0 && d !== answer && distSet.size < 4) {
        distSet.add(d);
      }
    }
    while (distSet.size < 4) {
      distSet.add(answer + randInt(-10, 10));
    }

    const distList = Array.from(distSet).filter((v) => v !== answer);
    const correctId = uid('opt_seq_cor');
    const options: ChoiceOption[] = shuffle([
      { id: correctId, label: String(answer) },
      { id: uid('opt_seq_d1'), label: String(distList[0]) },
      { id: uid('opt_seq_d2'), label: String(distList[1]) },
      { id: uid('opt_seq_d3'), label: String(distList[2]) },
    ]);

    const kDesc = k >= 0 ? `+ ${k}` : `- ${Math.abs(k)}`;

    return {
      id: uid('seq_l3_rec'),
      skillId: 'sequence',
      pillar: 'logic',
      kind: 'choice',
      level: 3,
      contextTag: 'Relação de Recorrência',
      prompt,
      options,
      correctOptionId: correctId,
      heuristicTitle: `Regra Recursiva (×2 ${kDesc})`,
      heuristicSteps: [
        `1. Teste a relação entre os termos:`,
        `   • 2 × ${t0} ${kDesc} = ${t1}`,
        `   • 2 × ${t1} ${kDesc} = ${t2}`,
        `   • 2 × ${t2} ${kDesc} = ${t3}`,
        `   • 2 × ${t3} ${kDesc} = ${t4}`,
        `2. Aplique a mesma lei ao último termo: 2 × ${t4} ${kDesc}.`,
        `3. Resultado: ${t4 * 2} ${kDesc} = ${answer}.`,
      ],
    };
  }

  // Interleaved two independent sequences
  // Seq A (pos 0, 2, 4, 6) -> stepA
  // Seq B (pos 1, 3, 5) -> stepB
  const stepA = randInt(3, 7);
  const multB = 2;

  const a0 = randInt(2, 8);
  const b0 = randInt(5, 12);

  const a1 = a0 + stepA;
  const b1 = b0 * multB;
  const a2 = a1 + stepA;
  const b2 = b1 * multB;
  const answer = a2 + stepA; // 7th term belongs to Seq A

  const terms = [a0, b0, a1, b1, a2, b2];
  const prompt = `Analise a série mista e encontre o próximo elemento:\n\n${terms.join(', ')}, [ ? ]`;

  const distSet = new Set<number>([answer]);
  const candidateDistractors = [
    b2 * multB, // applied Seq B rule by mistake
    answer + stepA,
    answer - 1,
    b2 + stepA,
    answer + 2,
  ];
  for (const d of candidateDistractors) {
    if (d > 0 && d !== answer && distSet.size < 4) {
      distSet.add(d);
    }
  }
  while (distSet.size < 4) {
    distSet.add(answer + randInt(-5, 5));
  }

  const distList = Array.from(distSet).filter((v) => v !== answer);
  const correctId = uid('opt_seq_cor');
  const options: ChoiceOption[] = shuffle([
    { id: correctId, label: String(answer) },
    { id: uid('opt_seq_d1'), label: String(distList[0]) },
    { id: uid('opt_seq_d2'), label: String(distList[1]) },
    { id: uid('opt_seq_d3'), label: String(distList[2]) },
  ]);

  return {
    id: uid('seq_l3_inter'),
    skillId: 'sequence',
    pillar: 'logic',
    kind: 'choice',
    level: 3,
    contextTag: 'Séries Entrelaçadas (2 Trilhas)',
    prompt,
    options,
    correctOptionId: correctId,
    heuristicTitle: 'Desentrelaçamento de Sequências Alternadas',
    heuristicSteps: [
      `1. Separe a sequência em duas trilhas independentes pelas posições ímpares e pares:`,
      `   • Trilha 1 (posições 1ª, 3ª, 5ª): ${a0}, ${a1}, ${a2} (avança de +${stepA} em +${stepA}).`,
      `   • Trilha 2 (posições 2ª, 4ª, 6ª): ${b0}, ${b1}, ${b2} (dobra a cada passo: ×2).`,
      `2. O 7º elemento procurado [ ? ] pertence à Trilha 1.`,
      `3. Próximo termo da Trilha 1: ${a2} + ${stepA} = ${answer}.`,
    ],
  };
}

// ---------------------------------------------------------------------------
// 3. MATRIX VISUAL PUZZLES (3x3)
// ---------------------------------------------------------------------------

export function normalizeVisualRotation(
  shape: MatrixShape,
  rotation: MatrixRotation,
): MatrixRotation {
  if (shape === 'circle' || shape === 'square') return 0;
  if (shape === 'diamond') return (rotation % 180) as MatrixRotation;
  return (rotation % 360) as MatrixRotation;
}

export function visualSignature(c: MatrixCell): string {
  const effRot = normalizeVisualRotation(c.shape, c.rotation);
  return `${c.shape}|${c.count}|${effRot}|${c.fill}`;
}

const SHAPE_LABELS: Record<MatrixShape, string> = {
  circle: 'círculo',
  triangle: 'triângulo',
  square: 'quadrado',
  diamond: 'losango',
  semicircle: 'semicírculo',
  arrow: 'seta',
};

const FILL_LABELS: Record<MatrixFill, string> = {
  solid: 'preenchido',
  outline: 'contorno',
  striped: 'listrado',
};

const ALL_SHAPES: readonly MatrixShape[] = [
  'circle',
  'triangle',
  'square',
  'diamond',
  'semicircle',
  'arrow',
];
const ROTATABLE_SHAPES: readonly MatrixShape[] = ['triangle', 'semicircle', 'arrow'];
const ALL_FILLS: readonly MatrixFill[] = ['solid', 'outline', 'striped'];
const ALL_ROTATIONS: readonly MatrixRotation[] = [0, 90, 180, 270];

export function generateMatrix(level: DifficultyLevel): ChoiceQuestion {
  const chosenFills = pickDistinct(ALL_FILLS, 3);
  const fullCells: MatrixCell[] = [];

  let heuristicTitle = '';
  const heuristicSteps: string[] = [];
  let activeRuleAttrs: Array<'shape' | 'count' | 'rotation' | 'fill'> = [];
  let activeShapesPool: readonly MatrixShape[] = ALL_SHAPES;

  if (level === 1) {
    const ruleType = pick(['shape_latin', 'count_prog', 'rotation_prog'] as const);

    if (ruleType === 'shape_latin') {
      const chosenShapes = pickDistinct(ALL_SHAPES, 3);
      activeShapesPool = chosenShapes;
      activeRuleAttrs = ['shape'];
      const targetShape = chosenShapes[(2 + 2) % 3];
      heuristicTitle = 'Regra Única: Quadrado Latino de Formas';
      heuristicSteps.push(
        `1. Regra de Formas: Cada linha e cada coluna contém exatamente 1 de cada uma das 3 formas (${SHAPE_LABELS[chosenShapes[0]]}, ${SHAPE_LABELS[chosenShapes[1]]}, ${SHAPE_LABELS[chosenShapes[2]]}).`,
        `2. Analisando a 3ª linha: já temos ${SHAPE_LABELS[chosenShapes[2 % 3]]} e ${SHAPE_LABELS[chosenShapes[(2 + 1) % 3]]}.`,
        `3. A forma que falta na última posição é ${SHAPE_LABELS[targetShape]}.`,
      );

      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
          fullCells.push({
            shape: chosenShapes[(r + c) % 3],
            count: 1,
            rotation: 0,
            fill: 'solid',
          });
        }
      }
    } else if (ruleType === 'count_prog') {
      const defaultShape = pick(ALL_SHAPES);
      activeShapesPool = ALL_SHAPES;
      activeRuleAttrs = ['count', 'shape'];
      heuristicTitle = 'Regra Única: Progressão de Contagem por Coluna';
      heuristicSteps.push(
        `1. Regra de Quantidade: A contagem de elementos (${SHAPE_LABELS[defaultShape]}) aumenta da esquerda para a direita (Coluna 1 = 1, Coluna 2 = 2, Coluna 3 = 3).`,
        `2. A célula faltante está na 3ª coluna, logo deve possuir exatamente 3 elementos.`,
      );

      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
          fullCells.push({
            shape: defaultShape,
            count: (c + 1) as 1 | 2 | 3,
            rotation: 0,
            fill: 'solid',
          });
        }
      }
    } else {
      // rotation_prog: usa apenas formas direcionais
      const defaultShape = pick(ROTATABLE_SHAPES);
      activeShapesPool = ROTATABLE_SHAPES;
      activeRuleAttrs = ['rotation', 'shape'];
      heuristicTitle = 'Regra Única: Rotação Horária (+90° por Coluna)';
      heuristicSteps.push(
        `1. Regra de Rotação: A cada coluna, o(a) ${SHAPE_LABELS[defaultShape]} gira 90° no sentido horário (0° ➔ 90° ➔ 180°).`,
        `2. A célula faltante (coluna 3) deve ter rotação de 180°.`,
      );

      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
          fullCells.push({
            shape: defaultShape,
            count: 1,
            rotation: ((c * 90) % 360) as MatrixRotation,
            fill: 'solid',
          });
        }
      }
    }
  } else if (level === 2) {
    const secondRule = pick(['rotation', 'count'] as const);

    if (secondRule === 'rotation') {
      const chosenShapes = shuffle([...ROTATABLE_SHAPES]);
      activeShapesPool = chosenShapes;
      activeRuleAttrs = ['rotation', 'shape'];
      const targetShape = chosenShapes[(2 + 2) % 3];
      heuristicTitle = '2 Regras Simultâneas: Formas (Linha) + Rotação (Coluna)';
      heuristicSteps.push(
        `1. Regra 1 (Formas): Cada linha e coluna possui uma permutação das 3 formas (${SHAPE_LABELS[chosenShapes[0]]}, ${SHAPE_LABELS[chosenShapes[1]]}, ${SHAPE_LABELS[chosenShapes[2]]}). Na 3ª linha falta: ${SHAPE_LABELS[targetShape]}.`,
        `2. Regra 2 (Rotação): A figura gira +90° a cada coluna (Coluna 1 = 0°, Coluna 2 = 90°, Coluna 3 = 180°).`,
        `3. Célula correta: ${SHAPE_LABELS[targetShape]} com rotação de 180°.`,
      );

      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
          fullCells.push({
            shape: chosenShapes[(r + c) % 3],
            count: 1,
            rotation: ((c * 90) % 360) as MatrixRotation,
            fill: 'solid',
          });
        }
      }
    } else {
      const chosenShapes = pickDistinct(ALL_SHAPES, 3);
      activeShapesPool = chosenShapes;
      activeRuleAttrs = ['count', 'shape'];
      const targetShape = chosenShapes[(2 + 2) % 3];
      heuristicTitle = '2 Regras Simultâneas: Formas (Linha) + Contagem (Coluna)';
      heuristicSteps.push(
        `1. Regra 1 (Formas): Permutação das 3 formas (${SHAPE_LABELS[chosenShapes[0]]}, ${SHAPE_LABELS[chosenShapes[1]]}, ${SHAPE_LABELS[chosenShapes[2]]}). Na 3ª linha falta: ${SHAPE_LABELS[targetShape]}.`,
        `2. Regra 2 (Contagem): A quantidade aumenta por coluna (1 ➔ 2 ➔ 3 elementos).`,
        `3. Célula correta: 3 unidades de ${SHAPE_LABELS[targetShape]}.`,
      );

      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
          fullCells.push({
            shape: chosenShapes[(r + c) % 3],
            count: (c + 1) as 1 | 2 | 3,
            rotation: 0,
            fill: 'solid',
          });
        }
      }
    }
  } else {
    // Level 3: 3 regras independentes com formas 100% direcionais
    const chosenShapes = shuffle([...ROTATABLE_SHAPES]);
    activeShapesPool = chosenShapes;
    activeRuleAttrs = ['rotation', 'fill', 'shape'];
    const targetShape = chosenShapes[(2 + 2) % 3];
    const targetFill = chosenFills[(2 + 2 * 2) % 3];
    heuristicTitle = '3 Regras Combinadas: Formas + Preenchimento + Rotação';
    heuristicSteps.push(
      `1. Regra 1 (Formas): Quadrado latino de formas (${SHAPE_LABELS[chosenShapes[0]]}, ${SHAPE_LABELS[chosenShapes[1]]}, ${SHAPE_LABELS[chosenShapes[2]]}). Falta: ${SHAPE_LABELS[targetShape]}.`,
      `2. Regra 2 (Preenchimento): Quadrado latino de preenchimento (${FILL_LABELS[chosenFills[0]]}, ${FILL_LABELS[chosenFills[1]]}, ${FILL_LABELS[chosenFills[2]]}). Falta: ${FILL_LABELS[targetFill]}.`,
      `3. Regra 3 (Rotação): A rotação avança +90° a cada coluna (Coluna 3 = 180°).`,
      `4. Síntese: ${SHAPE_LABELS[targetShape]}, ${FILL_LABELS[targetFill]} e rotação de 180°.`,
    );

    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        fullCells.push({
          shape: chosenShapes[(r + c) % 3],
          count: 1,
          rotation: ((c * 90) % 360) as MatrixRotation,
          fill: chosenFills[(r + 2 * c) % 3],
        });
      }
    }
  }

  const correctCell = fullCells[8];
  const matrixGrid: (MatrixCell | null)[] = fullCells.slice(0, 8);
  matrixGrid.push(null);

  // Deduplicação estritamente pela aparência visual (visualSignature)
  const seenVisuals = new Set<string>([visualSignature(correctCell)]);
  const distractors: MatrixCell[] = [];

  const tryAddDistractor = (candidate: MatrixCell): boolean => {
    if (distractors.length >= 3) return false;
    const sig = visualSignature(candidate);
    if (seenVisuals.has(sig)) return false;
    seenVisuals.add(sig);
    distractors.push(candidate);
    return true;
  };

  // Gera candidatos priorizando mutações nas regras ativas
  const candidatePool: MatrixCell[] = [];

  for (const attr of activeRuleAttrs) {
    if (attr === 'rotation') {
      for (const rot of shuffle([...ALL_ROTATIONS])) {
        candidatePool.push({ ...correctCell, rotation: rot });
      }
    } else if (attr === 'count') {
      for (const cnt of shuffle([1, 2, 3, 4] as const)) {
        candidatePool.push({ ...correctCell, count: cnt });
      }
    } else if (attr === 'fill') {
      for (const f of shuffle([...ALL_FILLS])) {
        candidatePool.push({ ...correctCell, fill: f });
      }
    } else if (attr === 'shape') {
      for (const s of shuffle([...activeShapesPool])) {
        candidatePool.push({ ...correctCell, shape: s });
      }
    }
  }

  // Mutações secundárias (outras formas / preenchimentos / contagens)
  for (const s of shuffle([...ALL_SHAPES])) {
    candidatePool.push({ ...correctCell, shape: s });
  }
  for (const f of shuffle([...ALL_FILLS])) {
    candidatePool.push({ ...correctCell, fill: f });
  }
  for (const cnt of shuffle([1, 2, 3, 4] as const)) {
    candidatePool.push({ ...correctCell, count: cnt });
  }

  for (const candidate of candidatePool) {
    if (distractors.length >= 3) break;
    tryAddDistractor(candidate);
  }

  // Fallback seguro com verificação de visualSignature
  while (distractors.length < 3) {
    tryAddDistractor({
      shape: pick(ALL_SHAPES),
      count: pick([1, 2, 3, 4] as const),
      rotation: pick(ALL_ROTATIONS),
      fill: pick(ALL_FILLS),
    });
  }

  const correctId = uid('opt_mat_cor');
  const options: ChoiceOption[] = shuffle([
    { id: correctId, matrixCell: correctCell },
    { id: uid('opt_mat_d1'), matrixCell: distractors[0] },
    { id: uid('opt_mat_d2'), matrixCell: distractors[1] },
    { id: uid('opt_mat_d3'), matrixCell: distractors[2] },
  ]);

  return {
    id: uid('mat_q'),
    skillId: 'matrix',
    pillar: 'logic',
    kind: 'choice',
    level,
    contextTag: 'Matriz Visual 3×3',
    prompt:
      'Analise os padrões espaciais na grade 3×3 (linhas e colunas) e selecione a figura que completa a posição inferior direita (?):',
    options,
    correctOptionId: correctId,
    matrixGrid,
    heuristicTitle,
    heuristicSteps,
  };
}
