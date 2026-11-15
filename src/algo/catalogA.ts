import type {
  AlgoDryRunSpec,
  AlgoOption,
  AlgoProblemTemplate,
} from './types';
import { randInt, shuffle, uid } from '../generators/utils';

/**
 * Helper to build 4 guaranteed unique options and return the shuffled list + correctOptionId.
 */
function createDryRunOptions(
  correctLabel: string,
  candidateDistractors: string[]
): { options: AlgoOption[]; correctOptionId: string } {
  const seenLabels = new Set<string>([correctLabel]);
  const finalDistractors: string[] = [];

  for (const dist of candidateDistractors) {
    if (!seenLabels.has(dist)) {
      seenLabels.add(dist);
      finalDistractors.push(dist);
      if (finalDistractors.length === 3) break;
    }
  }

  let fallbackOffset = 1;
  while (finalDistractors.length < 3) {
    const fallback = `Opção ${fallbackOffset++}`;
    if (!seenLabels.has(fallback)) {
      seenLabels.add(fallback);
      finalDistractors.push(fallback);
    }
  }

  const correctOptionId = uid('opt_correct');
  const items: AlgoOption[] = [
    { id: correctOptionId, label: correctLabel },
    ...finalDistractors.map((label) => ({ id: uid('opt_dist'), label })),
  ];

  return {
    options: shuffle(items),
    correctOptionId,
  };
}

// ============================================================================
// 1. HASHMAP
// ============================================================================

/**
 * 1.1 hm_two_sum: Pareamento de Transações (Two Sum)
 */
const HM_TWO_SUM: AlgoProblemTemplate = {
  id: 'hm_two_sum',
  patternId: 'hashmap',
  title: 'Pareamento de Transações (Two Sum)',
  difficulty: 'Fácil',
  constraints: [
    'Tamanho da lista: 2 até 100.000 números (O(n²) estoura o tempo limite TLE)',
    'Valores e target: inteiros de -1 bilhão a +1 bilhão (valores negativos e positivos)',
    'Garantia: existe exatamente uma única dupla cuja soma atinge o target',
    'Restrição: não é permitido reutilizar o mesmo elemento no mesmo índice duas vezes',
  ],
  statement:
    'Dado um array de inteiros nums e um valor inteiro target, retorne os índices [i, j] dos dois números cuja soma seja exatamente igual a target. Não é permitido reutilizar o mesmo elemento no mesmo índice.',
  example: {
    input: 'nums = [2, 7, 11, 15], target = 9',
    output: '[0, 1]',
    note: 'nums[0] (2) + nums[1] (7) = 9, logo os índices retornados são [0, 1].',
  },
  traceSteps: [
    {
      moment: 'Início (i = 0, num = 2)',
      state: 'Complemento = 9 - 2 = 7. Mapa seen está vazio. Registra visto: { 2: 0 }.',
    },
    {
      moment: 'Passo 1 (i = 1, num = 7)',
      state: 'Complemento = 9 - 7 = 2. Consulta seen.has(2) -> Encontrado no índice 0!',
    },
    {
      moment: 'Conclusão',
      state: 'Retorna imediatamente o par de índices [seen.get(2), 1] -> [0, 1].',
    },
  ],
  steps: [
    {
      kind: 'bottleneck',
      title: 'Identificação do Gargalo Brute Force',
      prompt:
        'Qual é o custo assintótico da abordagem ingênua que testa todos os pares de elementos com loops aninhados?',
      hint: 'Pense em quantas combinações de 2 elementos existem em uma coleção de tamanho n.',
      options: [
        {
          id: 'hm_ts_b_1',
          label: 'O(n²) no tempo e O(1) no espaço, pois inspeciona todos os pares (i, j).',
        },
        {
          id: 'hm_ts_b_2',
          label: 'O(n log n) no tempo, pois necessita de merge sort implícito.',
        },
        {
          id: 'hm_ts_b_3',
          label: 'O(n) no tempo e O(n) no espaço com varredura linear simples.',
        },
        {
          id: 'hm_ts_b_4',
          label: 'O(2^n) no tempo devido à geração de todos os subconjuntos possíveis.',
        },
      ],
      correctOptionId: 'hm_ts_b_1',
      explanation:
        'A abordagem ingênua com dois laços aninhados testa n*(n-1)/2 combinações, resultando em O(n²) de tempo, o que causa Time Limit Exceeded (TLE) para n = 10^5.',
    },
    {
      kind: 'pattern',
      title: 'Seleção do Padrão Ótimo',
      prompt:
        'Como podemos reduzir a busca do par complementar para tempo linear O(n)?',
      hint: 'Ao inspecionar o número atual x, o que precisamos descobrir instantaneamente sobre o valor restante (target - x)?',
      options: [
        {
          id: 'hm_ts_p_1',
          label:
            'Armazenar cada elemento visto em um HashMap mapeando valor -> índice para consulta O(1) do complemento.',
        },
        {
          id: 'hm_ts_p_2',
          label:
            'Ordenar o array original mantendo os mesmos índices e aplicar Binary Search em cada iteração.',
        },
        {
          id: 'hm_ts_p_3',
          label:
            'Utilizar recursão com memoização para explorar árvores de decisão binárias.',
        },
        {
          id: 'hm_ts_p_4',
          label:
            'Empilhar os elementos em uma Monotonic Stack para encontrar o próximo par de maior soma.',
        },
      ],
      correctOptionId: 'hm_ts_p_1',
      explanation:
        'Ao iterar pelo array, calculamos complement = target - nums[i]. Se complement já estiver registrado no HashMap, encontramos a resposta em O(1) médio por elemento, totalizando O(n).',
    },
    {
      kind: 'invariant',
      title: 'Invariante do Algoritmo',
      prompt:
        'Qual invariante garante a corretude e impede o uso do mesmo índice duas vezes?',
      hint: 'Se verificarmos a existência antes de gravar o valor atual, nunca emparelharemos um elemento com ele mesmo.',
      options: [
        {
          id: 'hm_ts_i_1',
          label:
            'Verificar se o complemento existe no mapa ANTES de inserir o elemento atual no mapa.',
        },
        {
          id: 'hm_ts_i_2',
          label:
            'Inserir todos os elementos antecipadamente e ignorar verificações de colisão de índice.',
        },
        {
          id: 'hm_ts_i_3',
          label:
            'Ordenar o mapa pelas chaves para garantir que índices menores venham primeiro.',
        },
        {
          id: 'hm_ts_i_4',
          label:
            'Remover o elemento do mapa logo após cada consulta para economizar memória.',
        },
      ],
      correctOptionId: 'hm_ts_i_1',
      explanation:
        'Ao consultar seen.has(complement) antes de executar seen.set(num, i), garantimos que o par encontrado refere-se estritamente a um elemento anterior e distinto no array.',
    },
  ],
  generateDryRun: (): AlgoDryRunSpec => {
    // Array de 5 elementos com par garantido
    const idx1 = randInt(0, 2);
    const idx2 = randInt(idx1 + 1, 4);
    const val1 = randInt(2, 15);
    const val2 = randInt(3, 18);
    const target = val1 + val2;

    const nums = [0, 0, 0, 0, 0];
    nums[idx1] = val1;
    nums[idx2] = val2;

    const used = new Set<number>([val1, val2, target - val1]);
    for (let i = 0; i < 5; i++) {
      if (i === idx1 || i === idx2) continue;
      let candidate = randInt(1, 25);
      while (used.has(candidate) || used.has(target - candidate) || candidate === val1 || candidate === val2) {
        candidate = randInt(1, 35);
      }
      nums[i] = candidate;
      used.add(candidate);
    }

    const correctLabel = `[${idx1}, ${idx2}]`;
    const candidates = [
      `[${Math.max(0, idx1 - 1)}, ${idx2}]`,
      `[${idx1}, ${Math.min(4, idx2 + 1)}]`,
      `[${(idx1 + 1) % 5}, ${(idx2 + 1) % 5}]`,
      `[0, 4]`,
      `[1, 3]`,
    ];

    const { options, correctOptionId } = createDryRunOptions(correctLabel, candidates);

    return {
      prompt: `Considere nums = [${nums.join(', ')}] e target = ${target}. Quais são os índices [i, j] da solução?`,
      hint: 'Procure os dois números cuja soma seja exatamente igual ao target e anote suas posições (0-indexed).',
      options,
      correctOptionId,
      explanation: `Os elementos nas posições ${idx1} (${nums[idx1]}) e ${idx2} (${nums[idx2]}) somam exatamente ${target}. Logo, a resposta é [${idx1}, ${idx2}].`,
    };
  },
  synthesis: [
    'Abordagem ingênua O(n²) testa todos os pares com dois loops aninhados.',
    'Padrão HashMap reduz o lookup do complemento (target - x) para O(1) médio.',
    'Invariante: consultar o mapa antes da inserção previne auto-emparelhamento de índices.',
    'Complexidade final: Tempo O(n), Espaço O(n).',
  ],
  tsSkeleton: `export function twoSum(nums: number[], target: number): [number, number] {
  // Mapa de valor -> índice visitado
  const seen = new Map<number, number>();

  for (let i = 0; i < nums.length; i++) {
    const num = nums[i];
    const complement = target - num;

    // Invariante: consultar o complemento antes de registrar o índice atual
    if (seen.has(complement)) {
      return [seen.get(complement)!, i];
    }

    seen.set(num, i);
  }

  throw new Error('Solução não encontrada');
}`,
};

/**
 * 1.2 hm_group_anagrams: Agrupamento de Assinaturas (Group Anagrams / Logs)
 */
const HM_GROUP_ANAGRAMS: AlgoProblemTemplate = {
  id: 'hm_group_anagrams',
  patternId: 'hashmap',
  title: 'Agrupamento de Assinaturas (Group Anagrams / Logs)',
  difficulty: 'Médio',
  constraints: [
    'Tamanho da lista: 1 até 10.000 palavras (O(n²) comparações par a par é inviável)',
    'Comprimento de cada palavra: 0 a 100 caracteres (pode conter string vazia "")',
    'Caracteres: apenas letras minúsculas de a até z',
    'Tempo alvo: O(n * k log k) agrupando por chave canônica em HashMap',
  ],
  statement:
    'Dada uma lista de strings strs, agrupe os anagramas (palavras com exatamente as mesmas frequências de caracteres) em listas separadas. A ordem dos grupos na saída não importa.',
  example: {
    input: 'strs = ["eat", "tea", "tan", "ate", "nat", "bat"]',
    output: '[["eat", "tea", "ate"], ["tan", "nat"], ["bat"]]',
    note: '"eat", "tea" e "ate" têm exatamente as mesmas letras (a, e, t), por isso ficam no mesmo grupo.',
  },
  traceSteps: [
    {
      moment: 'Palavra "eat"',
      state: 'Ordena letras -> chave "aet". Mapa cria novo bucket: { "aet": ["eat"] }.',
    },
    {
      moment: 'Palavra "tea"',
      state: 'Ordena letras -> chave "aet" (já existe!). Anexa: { "aet": ["eat", "tea"] }.',
    },
    {
      moment: 'Palavra "tan"',
      state: 'Ordena letras -> chave "ant" (nova chave). Cria bucket: { "aet": ["eat", "tea"], "ant": ["tan"] }.',
    },
    {
      moment: 'Palavras restantes ("ate", "nat", "bat")',
      state: '"ate" entra em "aet", "nat" entra em "ant", "bat" cria "abt". Retorna os 3 grupos.',
    },
  ],
  steps: [
    {
      kind: 'bottleneck',
      title: 'Gargalo da Comparação Par a Par',
      prompt:
        'Por que comparar cada palavra com todas as outras para verificar se são anagramas é ineficiente?',
      hint: 'Compare o custo de inspecionar todas as combinações de palavras contra um agrupamento direto por chave canônica.',
      options: [
        {
          id: 'hm_ga_b_1',
          label:
            'Leva a O(n² * k), onde n é o número de palavras e k o tamanho médio de cada palavra.',
        },
        {
          id: 'hm_ga_b_2',
          label:
            'Leva a O(k log k) independente do número de palavras no array de entrada.',
        },
        {
          id: 'hm_ga_b_3',
          label:
            'Consome memória exponencial O(2^k) para armazenar todos os prefixos de palavras.',
        },
        {
          id: 'hm_ga_b_4',
          label:
            'Causa estouro de pilha (stack overflow) devido a chamadas recursivas implícitas.',
        },
      ],
      correctOptionId: 'hm_ga_b_1',
      explanation:
        'Comparar cada palavra com as demais exige n*(n-1)/2 testes, cada um custando O(k), totalizando O(n² * k), o que é inviável para n = 10^4.',
    },
    {
      kind: 'pattern',
      title: 'Chave Canônica com HashMap',
      prompt:
        'Qual técnica permite agrupar anagramas em uma única passagem O(n * k)?',
      hint: 'Palavras que são anagramas produzem exatamente a mesma chave quando seus caracteres são ordenados ou contados.',
      options: [
        {
          id: 'hm_ga_p_1',
          label:
            'Usar uma representação canônica (letras ordenadas ou vetor de contagem) como chave no HashMap.',
        },
        {
          id: 'hm_ga_p_2',
          label:
            'Inserir as palavras em uma Trie e fazer busca em profundidade para encontrar folhas idênticas.',
        },
        {
          id: 'hm_ga_p_3',
          label:
            'Manter uma Sliding Window de tamanho fixo para comparar substrings contíguas.',
        },
        {
          id: 'hm_ga_p_4',
          label:
            'Utilizar uma PriorityQueue para ordenar as palavras pelo comprimento antes de agrupar.',
        },
      ],
      correctOptionId: 'hm_ga_p_1',
      explanation:
        'Anagramas compartilham a mesma chave canônica (ex: "ate", "eat", "tea" -> "aet"). Mapeando chave -> lista de palavras no HashMap, agrupamos todas em uma única passagem.',
    },
    {
      kind: 'invariant',
      title: 'Invariante da Chave Canônica',
      prompt:
        'Qual propriedade a chave canônica deve satisfazer estritamente para garantir agrupamento correto?',
      hint: 'Se palavras com letras diferentes gerarem a mesma chave, haverá falsos positivos no agrupamento.',
      options: [
        {
          id: 'hm_ga_i_1',
          label:
            'Duas palavras devem gerar a mesma chave se, e somente se, forem anagramas exatos.',
        },
        {
          id: 'hm_ga_i_2',
          label:
            'A chave pode ser apenas o comprimento da palavra somado ao código ASCII do primeiro caractere.',
        },
        {
          id: 'hm_ga_i_3',
          label:
            'A chave deve ser o hash numérico nativo de 32 bits da string sem tratamento de colisões.',
        },
        {
          id: 'hm_ga_i_4',
          label:
            'A chave precisa manter letras maiúsculas e minúsculas em buckets invertidos.',
        },
      ],
      correctOptionId: 'hm_ga_i_1',
      explanation:
        'A função de chave canônica deve ser determinística e bijetiva para a classe de equivalência dos anagramas (mesmo multiconjunto de caracteres com mesmas frequências).',
    },
  ],
  generateDryRun: (): AlgoDryRunSpec => {
    // Conjuntos de palavras para gerar 5 palavras
    const wordPools = [
      ['amor', 'roma', 'ramo', 'mora'],
      ['pato', 'topa', 'apto', 'opta'],
      ['sol', 'los'],
      ['rio', 'iro'],
      ['casa', 'saca'],
      ['fogo'],
      ['luz'],
      ['vento'],
    ];

    // Seleciona 5 palavras que formam entre 2 e 4 grupos distintos
    const chosenGroup1 = wordPools[0].slice(0, 2); // 2 anagramas
    const chosenGroup2 = wordPools[1].slice(0, 2); // 2 anagramas
    const chosenUnique = [wordPools[6][0]]; // 1 unico

    const words = shuffle([...chosenGroup1, ...chosenGroup2, ...chosenUnique]);

    // Calcula quantidade real de grupos
    const canonMap = new Map<string, string[]>();
    for (const w of words) {
      const k = w.split('').sort().join('');
      const list = canonMap.get(k) ?? [];
      list.push(w);
      canonMap.set(k, list);
    }
    const distinctGroupsCount = canonMap.size;

    const correctLabel = `${distinctGroupsCount} grupos`;
    const candidates = [
      `${distinctGroupsCount - 1} grupos`,
      `${distinctGroupsCount + 1} grupos`,
      `${distinctGroupsCount + 2} grupos`,
      `5 grupos`,
      `2 grupos`,
    ];

    const { options, correctOptionId } = createDryRunOptions(correctLabel, candidates);

    return {
      prompt: `Dada a lista strs = [${words.map((w) => `"${w}"`).join(', ')}], em quantos grupos distintos de anagramas essas palavras serão divididas?`,
      hint: 'Identifique quais palavras possuem exatamente as mesmas letras e conte o número total de conjuntos formados.',
      options,
      correctOptionId,
      explanation: `As palavras formam ${distinctGroupsCount} grupos distintos de anagramas quando agrupadas pela assinatura ordenada de seus caracteres.`,
    };
  },
  synthesis: [
    'Comparação par a par O(n² * k) é o gargalo ingênuo.',
    'Chave canônica (ordenação de caracteres ou contagem de 26 posições) mapeia anagramas para a mesma chave no HashMap.',
    'Invariante: a chave canônica identifica univocamente o multiconjunto de frequências.',
    'Complexidade: Tempo O(n * k log k) ou O(n * k), Espaço O(n * k).',
  ],
  tsSkeleton: `export function groupAnagrams(strs: string[]): string[][] {
  const groups = new Map<string, string[]>();

  for (const s of strs) {
    // Chave canônica: caracteres ordenados
    const key = s.split('').sort().join('');
    const list = groups.get(key) ?? [];
    list.push(s);
    groups.set(key, list);
  }

  return Array.from(groups.values());
}`,
};

// ============================================================================
// 2. TWO POINTERS
// ============================================================================

/**
 * 2.1 tp_sorted_pair: Par em Banda Ordenada (Two Sum II)
 */
const TP_SORTED_PAIR: AlgoProblemTemplate = {
  id: 'tp_sorted_pair',
  patternId: 'two_pointers',
  title: 'Par em Banda Ordenada (Two Sum II)',
  difficulty: 'Fácil',
  constraints: [
    'Tamanho da lista: 2 até 30.000 números em ordem crescente (não decrescente)',
    'Valores: inteiros entre -1.000 e 1.000',
    'Espaço auxiliar: estritamente O(1) de memória extra (proibido usar HashMap)',
    'Índices na saída: 1-indexed (a primeira posição da lista é 1, não 0)',
  ],
  statement:
    'Dado um array de inteiros numbers ordenado em ordem não decrescente e um valor target, encontre dois índices (1-indexed) [i, j] com i < j tais que numbers[i-1] + numbers[j-1] == target. A solução deve ter complexidade de espaço O(1).',
  example: {
    input: 'numbers = [1, 2, 7, 11, 15], target = 9',
    output: '[2, 3]',
    note: 'numbers[1] (2) + numbers[2] (7) = 9. Em formato 1-indexed, os índices são [2, 3].',
  },
  traceSteps: [
    {
      moment: 'Início (left = 0 [1], right = 4 [15])',
      state: 'Soma = 1 + 15 = 16. Como 16 > 9 (target), recua o ponteiro direito: right-- (r vira 3).',
    },
    {
      moment: 'Passo 1 (left = 0 [1], right = 3 [11])',
      state: 'Soma = 1 + 11 = 12. Como 12 > 9, recua o ponteiro direito novamente: right-- (r vira 2).',
    },
    {
      moment: 'Passo 2 (left = 0 [1], right = 2 [7])',
      state: 'Soma = 1 + 7 = 8. Como 8 < 9, a soma foi insuficiente; avança o esquerdo: left++ (l vira 1).',
    },
    {
      moment: 'Passo 3 (left = 1 [2], right = 2 [7])',
      state: 'Soma = 2 + 7 = 9 (igual ao target!). Retorna os índices 1-indexed: [1 + 1, 2 + 1] -> [2, 3].',
    },
  ],
  steps: [
    {
      kind: 'bottleneck',
      title: 'Gargalo do HashMap sob Espaço O(1)',
      prompt:
        'Por que a solução clássica com HashMap não é adequada sob restrição estrita de memória O(1)?',
      hint: 'Observe o que a restrição de memória constante exige e como o array já ordenado pode ser explorado sem estruturas extras.',
      options: [
        {
          id: 'tp_sp_b_1',
          label:
            'O HashMap aloca O(n) de memória extra, violando a restrição de espaço constante O(1).',
        },
        {
          id: 'tp_sp_b_2',
          label:
            'O HashMap piora a complexidade temporal para O(n²) em arrays já ordenados.',
        },
        {
          id: 'tp_sp_b_3',
          label:
            'O HashMap não suporta números negativos como chaves válidas de busca.',
        },
        {
          id: 'tp_sp_b_4',
          label:
            'O HashMap desordena os ponteiros durante as operações de leitura.',
        },
      ],
      correctOptionId: 'tp_sp_b_1',
      explanation:
        'Embora o HashMap forneça tempo linear O(n), ele armazena até n entradas, consumindo O(n) de espaço auxiliar. Aproveitar a ordenação prévia permite resolver em O(1) de espaço.',
    },
    {
      kind: 'pattern',
      title: 'Padrão Two Pointers Opostos',
      prompt:
        'Como podemos explorar a ordenação do array para encontrar o par em O(n) tempo e O(1) espaço?',
      hint: 'Se a soma dos extremos for maior que o target, decrementar o ponteiro direito necessariamente reduz a soma.',
      options: [
        {
          id: 'tp_sp_p_1',
          label:
            'Posicionar ponteiros nos extremos esquerdo (l=0) e direito (r=n-1) e convergir com base na soma atual.',
        },
        {
          id: 'tp_sp_p_2',
          label:
            'Usar ponteiros rápido e lento iniciando na mesma posição e avançando em velocidades diferentes.',
        },
        {
          id: 'tp_sp_p_3',
          label:
            'Dividir o array recursivamente ao meio no estilo Divisão e Conquista.',
        },
        {
          id: 'tp_sp_p_4',
          label:
            'Expandir uma janela deslizante até que a soma de todos os elementos internos atinja o target.',
        },
      ],
      correctOptionId: 'tp_sp_p_1',
      explanation:
        'Com o array ordenado, se numbers[left] + numbers[right] > target, diminuímos a soma recuando right--. Se for menor, aumentamos avançando left++. Isso garante tempo O(n) sem alocação de memória.',
    },
    {
      kind: 'invariant',
      title: 'Invariante de Eliminação Monótona',
      prompt:
        'Qual invariante garante que nenhuma solução válida seja descartada ao mover os ponteiros?',
      hint: 'Pense no que aconteceria se tentássemos somar numbers[right] com qualquer outro elemento à direita de left.',
      options: [
        {
          id: 'tp_sp_i_1',
          label:
            'Se soma > target, numbers[right] somado a qualquer elemento >= numbers[left] excederá o target; logo, right é descartável.',
        },
        {
          id: 'tp_sp_i_2',
          label:
            'A soma dos extremos é sempre exatamente o dobro da média dos elementos centrais do array.',
        },
        {
          id: 'tp_sp_i_3',
          label:
            'Podemos avançar ambos os ponteiros simultaneamente a cada iteração sem checar a soma.',
        },
        {
          id: 'tp_sp_i_4',
          label:
            'Se soma < target, o array deve ser invertido para reiniciar a busca na direção oposta.',
        },
      ],
      correctOptionId: 'tp_sp_i_1',
      explanation:
        'Como o array é não decrescente, qualquer elemento à direita de left possui valor >= numbers[left]. Assim, numbers[right] somado a eles resultaria em valor ainda maior que target, eliminando right com segurança.',
    },
  ],
  generateDryRun: (): AlgoDryRunSpec => {
    // Array ordenado de 6 elementos
    const base = [randInt(1, 4), randInt(5, 8), randInt(9, 12), randInt(13, 16), randInt(17, 20), randInt(21, 25)];
    base.sort((a, b) => a - b);

    // Escolhe dois indices distintos para formar o target
    const i = randInt(0, 2);
    const j = randInt(3, 5);
    const target = base[i] + base[j];

    const correctLabel = `[${i + 1}, ${j + 1}]`;
    const candidates = [
      `[${i + 1}, ${j}]`,
      `[${i + 2}, ${j + 1}]`,
      `[1, 6]`,
      `[2, 5]`,
      `[${i + 1}, ${Math.min(6, j + 2)}]`,
    ];

    const { options, correctOptionId } = createDryRunOptions(correctLabel, candidates);

    return {
      prompt: `Dado o array ordenado numbers = [${base.join(', ')}] e target = ${target}, quais são os índices 1-indexed [i, j] da solução?`,
      hint: 'Lembre-se de que os índices são 1-indexed (a primeira posição é 1).',
      options,
      correctOptionId,
      explanation: `Os elementos nas posições 1-indexed ${i + 1} (${base[i]}) e ${j + 1} (${base[j]}) somam exatamente ${target}: ${base[i]} + ${base[j]} = ${target}.`,
    };
  },
  synthesis: [
    'Array ordenado permite descartar metades do espaço de busca sem alocar memória extra.',
    'Padrão: Two Pointers nos extremos convergindo para o centro.',
    'Invariante: soma > target descarta right--; soma < target descarta left++.',
    'Complexidade: Tempo O(n), Espaço O(1).',
  ],
  tsSkeleton: `export function twoSumSorted(numbers: number[], target: number): [number, number] {
  let left = 0;
  let right = numbers.length - 1;

  while (left < right) {
    const sum = numbers[left] + numbers[right];

    if (sum === target) {
      // Retorna índices 1-indexed
      return [left + 1, right + 1];
    } else if (sum < target) {
      // Invariante: soma insuficiente, avança ponteiro esquerdo
      left++;
    } else {
      // Invariante: soma excessiva, recua ponteiro direito
      right--;
    }
  }

  throw new Error('Par não encontrado');
}`,
};

/**
 * 2.2 tp_max_area: Reservatório de Capacidade Máxima (Container With Most Water)
 */
const TP_MAX_AREA: AlgoProblemTemplate = {
  id: 'tp_max_area',
  patternId: 'two_pointers',
  title: 'Reservatório de Capacidade Máxima (Container With Most Water)',
  difficulty: 'Médio',
  constraints: [
    'Tamanho da lista: 2 até 100.000 hastes (O(n²) com ~5 bilhões de operações dá TLE)',
    'Alturas: inteiros de 0 a 10.000 (haste de altura 0 não segura água)',
    'Fórmula da área: min(height[l], height[r]) * (r - l)',
    'Tempo alvo: O(n) com Two Pointers nos extremos e espaço O(1)',
  ],
  statement:
    'Dado um array de inteiros height onde cada elemento representa a altura de uma haste vertical, encontre duas hastes que, com o eixo x, formem um reservatório com a maior capacidade de água possível. A área é calculada por: min(height[l], height[r]) * (r - l).',
  example: {
    input: 'height = [1, 8, 6, 2, 5, 4, 8, 3, 7]',
    output: '49',
    note: 'As hastes no índice 1 (altura 8) e índice 8 (altura 7) formam largura 7 e altura min(8, 7) = 7, totalizando área 7 * 7 = 49.',
  },
  traceSteps: [
    {
      moment: 'Início (left = 0 [1], right = 8 [7])',
      state: 'Largura = 8. Altura min(1, 7) = 1. Área = 8 * 1 = 8. maxWater = 8. Como height[0] (1) < height[8] (7), avança left++ (l = 1).',
    },
    {
      moment: 'Passo 1 (left = 1 [8], right = 8 [7])',
      state: 'Largura = 7. Altura min(8, 7) = 7. Área = 7 * 7 = 49. maxWater = 49. Como height[8] (7) <= height[1] (8), recua right-- (r = 7).',
    },
    {
      moment: 'Passo 2 (left = 1 [8], right = 7 [3])',
      state: 'Largura = 6. Altura min(8, 3) = 3. Área = 6 * 3 = 18. maxWater segue 49. Como height[7] (3) < height[1] (8), recua right-- (r = 6).',
    },
    {
      moment: 'Convergência final',
      state: 'Os ponteiros convergem descartando sempre a menor haste limitante. Nenhuma área subsequente supera 49. Retorna 49.',
    },
  ],
  steps: [
    {
      kind: 'bottleneck',
      title: 'Gargalo da Força Bruta O(n²)',
      prompt:
        'Qual é o custo de avaliar todas as combinações possíveis de hastes e por que isso falha para n = 10^5?',
      hint: 'Calcule n*(n-1)/2 para n = 100.000 e compare com a taxa de 10^8 operações por segundo de um juiz online.',
      options: [
        {
          id: 'tp_ma_b_1',
          label:
            'O(n²) no tempo com ~10^10 operações, excedendo o limite padrão de tempo de execução (TLE).',
        },
        {
          id: 'tp_ma_b_2',
          label:
            'O(n log n) no tempo, que falha devido ao custo de alocação de memória.',
        },
        {
          id: 'tp_ma_b_3',
          label:
            'O(n) no tempo, mas estoura a pilha de recursão para arrays longos.',
        },
        {
          id: 'tp_ma_b_4',
          label:
            'O(n) no espaço, violando a memória cache L1 do processador.',
        },
      ],
      correctOptionId: 'tp_ma_b_1',
      explanation:
        'Testar todos os pares de linhas resulta em (10^5)^2 / 2 = 5 * 10^9 operações, ultrapassando amplamente o limite padrão de 1 segundo (~10^8 ops).',
    },
    {
      kind: 'pattern',
      title: 'Padrão Two Pointers nos Extremos',
      prompt:
        'Como o padrão Two Pointers permite encontrar a área máxima em uma única passagem O(n)?',
      hint: 'A largura da base só diminui conforme os ponteiros convergem. A única chance de compensar essa perda é encontrar uma altura maior.',
      options: [
        {
          id: 'tp_ma_p_1',
          label:
            'Inicia com a largura máxima (l=0, r=n-1) e move o ponteiro da menor altura para dentro.',
        },
        {
          id: 'tp_ma_p_2',
          label:
            'Ordena o array de alturas e seleciona as duas maiores alturas adjacentes.',
        },
        {
          id: 'tp_ma_p_3',
          label:
            'Constrói uma tabela de programação dinâmica 2D de tamanho n x n.',
        },
        {
          id: 'tp_ma_p_4',
          label:
            'Calcula as somas de prefixo das alturas para obter a integral acumulada.',
        },
      ],
      correctOptionId: 'tp_ma_p_1',
      explanation:
        'Iniciando com a largura máxima (r - l), a capacidade é limitada pela haste mais baixa: min(height[l], height[r]). Mover a haste mais alta só diminuiria a largura sem qualquer chance de aumentar a altura limitante.',
    },
    {
      kind: 'invariant',
      title: 'Invariante do Gargalo de Altura',
      prompt:
        'Qual invariante matemático justifica mover estritamente o ponteiro da menor altura?',
      hint: 'Se height[l] < height[r], qualquer outro r interno terá largura menor e altura no máximo height[l], gerando área estritamente menor.',
      options: [
        {
          id: 'tp_ma_i_1',
          label:
            'O lado mais curto limita todos os retângulos formados com qualquer haste interna; logo, ele nunca poderá gerar área maior e pode ser descartado.',
        },
        {
          id: 'tp_ma_i_2',
          label:
            'Ambos os ponteiros devem ser movidos para o centro simultaneamente para manter a simetria.',
        },
        {
          id: 'tp_ma_i_3',
          label:
            'Mover o lado mais alto sempre aumenta a área porque reduz a turbulência da água.',
        },
        {
          id: 'tp_ma_i_4',
          label:
            'A escolha do ponteiro a mover é indiferente pois o produto final é comutativo.',
        },
      ],
      correctOptionId: 'tp_ma_i_1',
      explanation:
        'Se height[l] <= height[r], para qualquer k entre l e r, a área min(height[l], height[k]) * (k - l) <= height[l] * (k - l) < height[l] * (r - l). Portanto, o índice l já atingiu seu potencial máximo e pode ser avançado.',
    },
  ],
  generateDryRun: (): AlgoDryRunSpec => {
    // Array de 5 alturas
    const heights = [randInt(1, 8), randInt(2, 9), randInt(1, 9), randInt(3, 9), randInt(2, 8)];

    let maxArea = 0;
    let l = 0;
    let r = heights.length - 1;
    while (l < r) {
      const area = Math.min(heights[l], heights[r]) * (r - l);
      if (area > maxArea) maxArea = area;
      if (heights[l] < heights[r]) {
        l++;
      } else {
        r--;
      }
    }

    const correctLabel = `${maxArea} unidades`;
    const candidates = [
      `${Math.max(1, maxArea - 2)} unidades`,
      `${maxArea + 2} unidades`,
      `${maxArea + 4} unidades`,
      `${Math.max(1, maxArea - 4)} unidades`,
      `${maxArea + 6} unidades`,
    ];

    const { options, correctOptionId } = createDryRunOptions(correctLabel, candidates);

    return {
      prompt: `Considere as alturas height = [${heights.join(', ')}]. Qual é a capacidade máxima de água que pode ser armazenada?`,
      hint: 'Aplique o cálculo min(height[l], height[r]) * (r - l) iniciando pelos extremos l=0 e r=4.',
      options,
      correctOptionId,
      explanation: `Avaliando os pares com o algoritmo de Two Pointers, a área máxima encontrada é exatamente ${maxArea} unidades de água.`,
    };
  },
  synthesis: [
    'Força bruta O(n²) testa todos os pares de hastes.',
    'Padrão Two Pointers inicia com a maior largura e converge os extremos.',
    'Invariante: a haste menor é o gargalo limitante e pode ser descartada com segurança.',
    'Complexidade: Tempo O(n), Espaço O(1).',
  ],
  tsSkeleton: `export function maxArea(height: number[]): number {
  let left = 0;
  let right = height.length - 1;
  let maxWater = 0;

  while (left < right) {
    const width = right - left;
    const currentHeight = Math.min(height[left], height[right]);
    const area = width * currentHeight;

    if (area > maxWater) {
      maxWater = area;
    }

    // Invariante: descarta a haste menor que atua como gargalo limitante
    if (height[left] < height[right]) {
      left++;
    } else {
      right--;
    }
  }

  return maxWater;
}`,
};

// ============================================================================
// 3. SLIDING WINDOW
// ============================================================================

/**
 * 3.1 sw_max_window_sum: Pico de Latência em Janela Fixa K
 */
const SW_MAX_WINDOW_SUM: AlgoProblemTemplate = {
  id: 'sw_max_window_sum',
  patternId: 'sliding_window',
  title: 'Pico de Latência em Janela Fixa K',
  difficulty: 'Fácil',
  constraints: [
    'Tamanho da lista: k até 100.000 números (recalcular do zero a cada passo levaria O(n * k))',
    'Valores: latências de -10.000 a +10.000 (podem existir variações negativas)',
    'Tamanho da janela k: fixo de 1 até o tamanho total da lista',
    'Tempo alvo: O(n) atualizando a soma em O(1) ao deslizar a janela',
  ],
  statement:
    'Dado um array de inteiros nums representando métricas de latência e um inteiro k, encontre a soma máxima de qualquer subarray contíguo de tamanho exatamente k.',
  example: {
    input: 'nums = [2, 1, 5, 1, 3, 2], k = 3',
    output: '9',
    note: 'A janela de tamanho 3 com maior soma é [5, 1, 3], cuja soma é 5 + 1 + 3 = 9.',
  },
  traceSteps: [
    {
      moment: 'Janela Inicial (índices 0..2: [2, 1, 5])',
      state: 'Soma inicial = 2 + 1 + 5 = 8. Define maxSum = 8.',
    },
    {
      moment: 'Desliza para i = 3 (entra nums[3]=1, sai nums[0]=2)',
      state: 'Nova soma = 8 + 1 - 2 = 7. Janela [1, 5, 1]. maxSum continua 8.',
    },
    {
      moment: 'Desliza para i = 4 (entra nums[4]=3, sai nums[1]=1)',
      state: 'Nova soma = 7 + 3 - 1 = 9. Janela [5, 1, 3]. Atualiza maxSum = 9 (novo recorde!).',
    },
    {
      moment: 'Desliza para i = 5 (entra nums[5]=2, sai nums[2]=5)',
      state: 'Nova soma = 9 + 2 - 5 = 6. Janela [1, 3, 2]. Fim do array. Retorna maxSum = 9.',
    },
  ],
  steps: [
    {
      kind: 'bottleneck',
      title: 'Gargalo do Recálculo Ingênuo',
      prompt:
        'Por que recalcular a soma de k elementos do zero a cada posição inicial resulta em O(n * k)?',
      hint: 'Quando a janela avança 1 posição para a direita, quantos elementos continuam exatamente iguais?',
      options: [
        {
          id: 'sw_mw_b_1',
          label:
            'Soma repetidamente k-1 elementos sobrepostos que já foram processados na janela anterior.',
        },
        {
          id: 'sw_mw_b_2',
          label:
            'Exige ordenação interna da janela a cada passo para encontrar o maior valor.',
        },
        {
          id: 'sw_mw_b_3',
          label:
            'Aloca arrays auxiliares de tamanho k a cada iteração, estourando a heap.',
        },
        {
          id: 'sw_mw_b_4',
          label:
            'Causa perda de precisão de ponto flutuante em números inteiros grandes.',
        },
      ],
      correctOptionId: 'sw_mw_b_1',
      explanation:
        'Ao deslizar a janela de tamanho k por 1 passo, k-1 elementos permanecem idênticos. Recalcular a soma do zero desperdiça trabalho e leva a complexidade O(n * k).',
    },
    {
      kind: 'pattern',
      title: 'Padrão Sliding Window Fixa O(n)',
      prompt:
        'Como atualizar a soma da janela em tempo O(1) por passo ao avançar no array?',
      hint: 'A nova soma é simplesmente: soma_anterior + elemento_entrante - elemento_sainte.',
      options: [
        {
          id: 'sw_mw_p_1',
          label:
            'Adicionar o novo elemento que entra na direita e subtrair o elemento antigo que sai pela esquerda.',
        },
        {
          id: 'sw_mw_p_2',
          label:
            'Inserir os k elementos em um Max-Heap e extrair a raiz a cada passo.',
        },
        {
          id: 'sw_mw_p_3',
          label:
            'Fazer busca binária para encontrar o ponto médio de maior densidade na janela.',
        },
        {
          id: 'sw_mw_p_4',
          label:
            'Criar uma matriz de memoização 2D contendo todas as somas parciais.',
        },
      ],
      correctOptionId: 'sw_mw_p_1',
      explanation:
        'A técnica de Sliding Window fixa mantém o acumulador atualizado com apenas duas operações aritméticas por passo: windowSum += nums[i] - nums[i - k].',
    },
    {
      kind: 'invariant',
      title: 'Invariante da Janela Deslizante Fixa',
      prompt:
        'Qual invariante garante que o acumulador represente exatamente a soma do subarray de tamanho k?',
      hint: 'A janela inicia somando os primeiros k elementos (índices 0 a k-1) e depois mantém o tamanho k constante deslizando até o fim.',
      options: [
        {
          id: 'sw_mw_i_1',
          label:
            'Após o aquecimento dos primeiros k elementos, a janela sempre mantém exatamente k elementos: [i - k + 1 ... i].',
        },
        {
          id: 'sw_mw_i_2',
          label:
            'A soma da janela deve ser reiniciada para zero sempre que encontrar um número negativo.',
        },
        {
          id: 'sw_mw_i_3',
          label:
            'A janela deve dobrar de tamanho sempre que a soma atual superar o recorde anterior.',
        },
        {
          id: 'sw_mw_i_4',
          label:
            'Os elementos dentro da janela devem permanecer em ordem crescente a cada passo.',
        },
      ],
      correctOptionId: 'sw_mw_i_1',
      explanation:
        'O acumulador reflete fielmente o subarray [i - k + 1, i] ao subtrair nums[i - k] e somar nums[i], garantindo que o tamanho da janela permaneça constante e igual a k.',
    },
  ],
  generateDryRun: (): AlgoDryRunSpec => {
    const nums = [randInt(1, 10), randInt(1, 10), randInt(1, 10), randInt(1, 10), randInt(1, 10), randInt(1, 10)];
    const k = 3;

    let currentSum = nums[0] + nums[1] + nums[2];
    let maxSum = currentSum;

    for (let i = k; i < nums.length; i++) {
      currentSum += nums[i] - nums[i - k];
      if (currentSum > maxSum) maxSum = currentSum;
    }

    const correctLabel = `Soma = ${maxSum}`;
    const candidates = [
      `Soma = ${maxSum - 2}`,
      `Soma = ${maxSum + 2}`,
      `Soma = ${maxSum + 4}`,
      `Soma = ${maxSum - 3}`,
      `Soma = ${maxSum + 1}`,
    ];

    const { options, correctOptionId } = createDryRunOptions(correctLabel, candidates);

    return {
      prompt: `Considere nums = [${nums.join(', ')}] e k = ${k}. Qual é a soma máxima de qualquer janela contígua de tamanho 3?`,
      hint: 'Calcule a soma de cada trinca consecutiva: [0..2], [1..3], [2..4], [3..5] e tome o maior valor.',
      options,
      correctOptionId,
      explanation: `As trincas somam: [${nums.slice(0, 3).join('+')}=${nums[0] + nums[1] + nums[2]}], [${nums.slice(1, 4).join('+')}=${nums[1] + nums[2] + nums[3]}], [${nums.slice(2, 5).join('+')}=${nums[2] + nums[3] + nums[4]}], [${nums.slice(3, 6).join('+')}=${nums[3] + nums[4] + nums[5]}]. A soma máxima é ${maxSum}.`,
    };
  },
  synthesis: [
    'Recálculo do zero a cada passo resulta em O(n * k) desnecessário.',
    'Sliding Window fixa atualiza a soma em O(1): soma += entra - sai.',
    'Invariante: manter exatamente k elementos no intervalo [i - k + 1, i].',
    'Complexidade: Tempo O(n), Espaço O(1).',
  ],
  tsSkeleton: `export function maxSubarraySum(nums: number[], k: number): number {
  if (nums.length < k) return 0;

  // 1. Inicializa a primeira janela de tamanho k
  let windowSum = 0;
  for (let i = 0; i < k; i++) {
    windowSum += nums[i];
  }

  let maxSum = windowSum;

  // 2. Desliza a janela mantendo o tamanho fixo: adiciona nums[i] e remove nums[i - k]
  for (let i = k; i < nums.length; i++) {
    windowSum += nums[i] - nums[i - k];
    if (windowSum > maxSum) {
      maxSum = windowSum;
    }
  }

  return maxSum;
}`,
};

/**
 * 3.2 sw_longest_unique: Maior Trecho Sem Tokens Repetidos
 */
const SW_LONGEST_UNIQUE: AlgoProblemTemplate = {
  id: 'sw_longest_unique',
  patternId: 'sliding_window',
  title: 'Maior Trecho Sem Tokens Repetidos',
  difficulty: 'Médio',
  constraints: [
    'Tamanho da string: 0 até 50.000 caracteres (pode vir vazia "", gerando saída 0)',
    'Caracteres: letras, dígitos, espaços e símbolos imprimíveis',
    'Definição de substring: trecho contíguo de caracteres consecutivos',
    'Tempo alvo: O(n) com janela deslizante dinâmica e conjunto de caracteres vistos',
  ],
  statement:
    'Dada uma string s, encontre o comprimento da maior substring contígua que não contenha caracteres repetidos.',
  example: {
    input: 's = "abcabcbb"',
    output: '3',
    note: 'A maior substring contígua sem repetições é "abc" (ou "bca", "cab"), com tamanho 3.',
  },
  traceSteps: [
    {
      moment: 'Passos 0 a 2 (right = 0..2, chars "a", "b", "c")',
      state: 'Sem colisões. seen = {"a", "b", "c"}, janela "abc" [0..2]. maxLength = 3.',
    },
    {
      moment: 'Passo 3 (right = 3, char = "a")',
      state: 'Colisão com "a"! Remove s[left="a"], left vira 1. Insere novo "a". Janela "bca" [1..3]. maxLength = 3.',
    },
    {
      moment: 'Passo 4 (right = 4, char = "b")',
      state: 'Colisão com "b"! Remove s[left="b"], left vira 2. Insere novo "b". Janela "cab" [2..4]. maxLength = 3.',
    },
    {
      moment: 'Passos finais (right = 5..7, chars "c", "b", "b")',
      state: 'Janela contrai para expulsar duplicatas. Nenhuma janela supera tamanho 3. Retorna maxLength = 3.',
    },
  ],
  steps: [
    {
      kind: 'bottleneck',
      title: 'Gargalo da Verificação de Todas as Substrings',
      prompt:
        'Por que gerar e verificar a unicidade de todas as substrings possíveis custa O(n³)?',
      hint: 'Quantos pares de início e fim (i, j) existem em uma string de tamanho n, e quanto custa percorrer essa fatia?',
      options: [
        {
          id: 'sw_lu_b_1',
          label:
            'Existem O(n²) substrings possíveis e verificar a unicidade de cada uma leva O(n).',
        },
        {
          id: 'sw_lu_b_2',
          label:
            'Existem O(n) substrings e cada uma leva O(n log n) para ser ordenada.',
        },
        {
          id: 'sw_lu_b_3',
          label:
            'A árvore de sufixos consome O(2^n) de memória no pior caso.',
        },
        {
          id: 'sw_lu_b_4',
          label:
            'A checagem de caracteres causa recursão profunda de ordem O(n!).',
        },
      ],
      correctOptionId: 'sw_lu_b_1',
      explanation:
        'São n*(n+1)/2 substrings possíveis. Percorrer cada uma para checar duplicatas com um Set leva até O(n), totalizando O(n³).',
    },
    {
      kind: 'pattern',
      title: 'Padrão Sliding Window Dinâmica',
      prompt:
        'Como a Sliding Window com dois ponteiros (left, right) e um Set reduz o problema para O(n)?',
      hint: 'Quando s[right] já existe na janela atual, precisamos avançar left até que o caractere duplicado seja expelido.',
      options: [
        {
          id: 'sw_lu_p_1',
          label:
            'Expandir right incluindo caracteres e contrair left assim que surgir uma duplicata.',
        },
        {
          id: 'sw_lu_p_2',
          label:
            'Aplicar o algoritmo KMP para pré-processar a tabela de prefixos da string.',
        },
        {
          id: 'sw_lu_p_3',
          label:
            'Fazer busca binária no array de caracteres ordenados alfabeticamente.',
        },
        {
          id: 'sw_lu_p_4',
          label:
            'Calcular a distância de Levenshtein entre a string e sua versão invertida.',
        },
      ],
      correctOptionId: 'sw_lu_p_1',
      explanation:
        'Expandimos right acumulando caracteres no Set. Ao encontrar uma duplicata, avançamos left removendo s[left] do Set até expelir a repetição. Cada índice é visitado no máximo duas vezes: O(n).',
    },
    {
      kind: 'invariant',
      title: 'Invariante da Janela Livre de Duplicatas',
      prompt:
        'Qual invariante deve ser preservado ao final de cada iteração de expansão de right?',
      hint: 'O cálculo do tamanho máximo (right - left + 1) só é válido se a janela estiver livre de qualquer repetição.',
      options: [
        {
          id: 'sw_lu_i_1',
          label:
            'O intervalo [left, right] contém estritamente caracteres distintos registrados no Set.',
        },
        {
          id: 'sw_lu_i_2',
          label:
            'O tamanho da janela deve ser sempre mantido como uma potência de 2.',
        },
        {
          id: 'sw_lu_i_3',
          label:
            'A substring [left, right] deve formar um palíndromo perfeito a cada passo.',
        },
        {
          id: 'sw_lu_i_4',
          label:
            'O ponteiro left deve sempre voltar ao índice 0 após cada colisão.',
        },
      ],
      correctOptionId: 'sw_lu_i_1',
      explanation:
        'Ao contrair left até eliminar o caractere repetido antes de registrar o comprimento atual, garantimos que toda janela avaliada seja 100% livre de duplicatas.',
    },
  ],
  generateDryRun: (): AlgoDryRunSpec => {
    const chars = ['a', 'b', 'c', 'd', 'e'];
    // Gera string de 7 caracteres com algumas repetições
    const len = randInt(7, 8);
    const sArr: string[] = [];
    for (let i = 0; i < len; i++) {
      sArr.push(chars[randInt(0, 3)]);
    }
    const s = sArr.join('');

    // Algoritmo real de sliding window
    const seen = new Set<string>();
    let left = 0;
    let maxLen = 0;
    for (let right = 0; right < s.length; right++) {
      while (seen.has(s[right])) {
        seen.delete(s[left]);
        left++;
      }
      seen.add(s[right]);
      maxLen = Math.max(maxLen, right - left + 1);
    }

    const correctLabel = `Tamanho = ${maxLen}`;
    const candidates = [
      `Tamanho = ${Math.max(1, maxLen - 1)}`,
      `Tamanho = ${maxLen + 1}`,
      `Tamanho = ${maxLen + 2}`,
      `Tamanho = ${Math.max(1, maxLen - 2)}`,
      `Tamanho = 2`,
      `Tamanho = 4`,
    ];

    const { options, correctOptionId } = createDryRunOptions(correctLabel, candidates);

    return {
      prompt: `Dada a string s = "${s}", qual é o comprimento da maior substring contígua sem caracteres repetidos?`,
      hint: 'Encontre a mais longa sequência de letras consecutivas onde nenhuma letra se repete.',
      options,
      correctOptionId,
      explanation: `A maior substring sem caracteres repetidos em "${s}" possui comprimento ${maxLen}.`,
    };
  },
  synthesis: [
    'Verificar todas as substrings leva a O(n³).',
    'Sliding Window dinâmica expande right e contrai left sob colisão.',
    'Invariante: o intervalo [left, right] é sempre mantido estritamente sem duplicatas.',
    'Complexidade: Tempo O(n), Espaço O(min(n, m)) onde m é o tamanho do alfabeto.',
  ],
  tsSkeleton: `export function lengthOfLongestSubstring(s: string): number {
  const seen = new Set<string>();
  let left = 0;
  let maxLength = 0;

  for (let right = 0; right < s.length; right++) {
    const char = s[right];

    // Contrai a janela pela esquerda até remover o caractere duplicado
    while (seen.has(char)) {
      seen.delete(s[left]);
      left++;
    }

    seen.add(char);
    // Invariante: [left, right] contém apenas caracteres únicos
    maxLength = Math.max(maxLength, right - left + 1);
  }

  return maxLength;
}`,
};

// ============================================================================
// 4. BINARY SEARCH
// ============================================================================

/**
 * 4.1 bs_rotated_search: Busca em Log Rotacionado
 */
const BS_ROTATED_SEARCH: AlgoProblemTemplate = {
  id: 'bs_rotated_search',
  patternId: 'binary_search',
  title: 'Busca em Log Rotacionado',
  difficulty: 'Médio',
  constraints: [
    'Tamanho da lista: 1 até 5.000 números inteiros estritamente distintos',
    'Valores: inteiros entre -10.000 e 10.000',
    'Estrutura: array originalmente ordenado, rotacionado em um pivô desconhecido k',
    'Tempo obrigatório: O(log n) — varredura linear O(n) é reprovada no teste de escala',
  ],
  statement:
    'Dado um array de inteiros nums com valores distintos ordenados em ordem crescente, mas rotacionado em algum índice pivô desconhecido, e um valor target, retorne o índice de target se ele estiver no array, ou -1 caso contrário. A busca deve operar estritamente em tempo O(log n).',
  example: {
    input: 'nums = [4, 5, 6, 7, 0, 1, 2], target = 0',
    output: '4',
    note: 'O valor 0 está localizado no índice 4 do array rotacionado.',
  },
  traceSteps: [
    {
      moment: 'Iteração 1 (left = 0 [4], right = 6 [2])',
      state: 'mid = 3 (nums[3] = 7). Metade esquerda [4..7] está ordenada (4 <= 7). Como target 0 não está em [4, 7), busca na direita: left = 4.',
    },
    {
      moment: 'Iteração 2 (left = 4 [0], right = 6 [2])',
      state: 'mid = 5 (nums[5] = 1). Metade esquerda [0..1] está ordenada (0 <= 1). Como target (0) está no intervalo [0, 1), busca na esquerda: right = 4.',
    },
    {
      moment: 'Iteração 3 (left = 4 [0], right = 4 [0])',
      state: 'mid = 4 (nums[4] = 0). nums[4] === target (0). Encontrou o elemento! Retorna índice 4.',
    },
  ],
  steps: [
    {
      kind: 'bottleneck',
      title: 'Gargalo da Busca Linear O(n)',
      prompt:
        'Por que uma busca linear simples varrendo o array não atende os requisitos do problema?',
      hint: 'Varreduras elemento a elemento ignoram a estrutura ordenada em partes do array.',
      options: [
        {
          id: 'bs_rs_b_1',
          label:
            'A busca linear consome tempo O(n), violando a restrição estrita de O(log n).',
        },
        {
          id: 'bs_rs_b_2',
          label:
            'A busca linear exige alocação de memória auxiliar O(n).',
        },
        {
          id: 'bs_rs_b_3',
          label:
            'A busca linear falha em arrays rotacionados pois requer monotonicidade global.',
        },
        {
          id: 'bs_rs_b_4',
          label:
            'A busca linear causa estouro de pilha para arrays com pivô maior que n/2.',
        },
      ],
      correctOptionId: 'bs_rs_b_1',
      explanation:
        'Percorrer o array sequencialmente leva O(n). Com n = 5000 e restrição de O(log n), precisamos de no máximo ~13 comparações (log2(5000)), exigindo divisão binária do espaço de busca.',
    },
    {
      kind: 'pattern',
      title: 'Padrão Binary Search com Metade Ordenada',
      prompt:
        'Qual propriedade fundamental de um array ordenado rotacionado permite aplicar Binary Search?',
      hint: 'Inspecione nums[left] e nums[mid]: se nums[left] <= nums[mid], a metade esquerda não contém o ponto de rotação.',
      options: [
        {
          id: 'bs_rs_p_1',
          label:
            'Ao dividir o array no ponto médio mid, pelo menos uma das duas metades (esquerda ou direita) está garantidamente ordenada.',
        },
        {
          id: 'bs_rs_p_2',
          label:
            'É possível reordenar o array em O(1) antes de aplicar busca binária clássica.',
        },
        {
          id: 'bs_rs_p_3',
          label:
            'Apenas a metade que contém o valor mínimo global pode ser descartada.',
        },
        {
          id: 'bs_rs_p_4',
          label:
            'Ponteiros convergentes nos extremos resolvem em O(1) se somados ao target.',
        },
      ],
      correctOptionId: 'bs_rs_p_1',
      explanation:
        'A rotação divide o array em duas partes crescentes. Para qualquer mid, se nums[left] <= nums[mid], a metade esquerda está perfeitamente ordenada; caso contrário, a metade direita está garantidamente ordenada.',
    },
    {
      kind: 'invariant',
      title: 'Invariante de Decisão de Limites',
      prompt:
        'Como decidir com segurança se o target está dentro da metade ordenada [left, mid]?',
      hint: 'Como a metade esquerda está ordenada, o target só estará nela se pertencer ao intervalo fechado [nums[left], nums[mid]).',
      options: [
        {
          id: 'bs_rs_i_1',
          label:
            'Verificar se target >= nums[left] e target < nums[mid]; se sim, busca na esquerda (right = mid - 1); senão, na direita (left = mid + 1).',
        },
        {
          id: 'bs_rs_i_2',
          label:
            'Verificar apenas se target < nums[mid], sem considerar o limite inferior nums[left].',
        },
        {
          id: 'bs_rs_i_3',
          label:
            'Comparar o target apenas com nums[right] e descartar sempre a metade esquerda.',
        },
        {
          id: 'bs_rs_i_4',
          label:
            'Aplicar XOR entre nums[mid] e target para calcular a distância de Hamming.',
        },
      ],
      correctOptionId: 'bs_rs_i_1',
      explanation:
        'Se a metade esquerda é ordenada e target está entre nums[left] e nums[mid], podemos restringir a busca para a esquerda. Caso contrário, o target só pode estar na metade direita.',
    },
  ],
  generateDryRun: (): AlgoDryRunSpec => {
    // Array ordenado e rotacionado de 6 elementos
    const sorted = [2, 5, 8, 12, 17, 23];
    const shift = randInt(1, 4);
    const rotated = [...sorted.slice(shift), ...sorted.slice(0, shift)];

    // Escolhe um elemento presente
    const targetIdx = randInt(0, 5);
    const target = rotated[targetIdx];

    const correctLabel = `Índice ${targetIdx}`;
    const candidates = [
      `Índice ${(targetIdx + 1) % 6}`,
      `Índice ${(targetIdx + 2) % 6}`,
      `Índice ${(targetIdx + 3) % 6}`,
      `-1 (Não encontrado)`,
    ];

    const { options, correctOptionId } = createDryRunOptions(correctLabel, candidates);

    return {
      prompt: `Considere o array rotacionado nums = [${rotated.join(', ')}] e target = ${target}. Qual é o índice retornado pela busca binária em O(log n)?`,
      hint: 'Encontre a posição 0-indexed onde o valor target se encontra no array rotacionado.',
      options,
      correctOptionId,
      explanation: `O valor ${target} está exatamente na posição 0-indexed ${targetIdx} do array nums.`,
    };
  },
  synthesis: [
    'Busca linear O(n) falha na restrição O(log n).',
    'Padrão: em qualquer partição mid, ao menos uma metade está estritamente ordenada.',
    'Invariante: se a metade está ordenada, testamos se target está no intervalo [left, mid]; se não, descartamos essa metade.',
    'Complexidade: Tempo O(log n), Espaço O(1).',
  ],
  tsSkeleton: `export function searchRotated(nums: number[], target: number): number {
  let left = 0;
  let right = nums.length - 1;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);

    if (nums[mid] === target) {
      return mid;
    }

    // Invariante: verifica se a metade esquerda está ordenada
    if (nums[left] <= nums[mid]) {
      if (target >= nums[left] && target < nums[mid]) {
        right = mid - 1; // Target está no intervalo ordenado da esquerda
      } else {
        left = mid + 1;  // Target está na metade direita
      }
    } else {
      // Metade direita está ordenada
      if (target > nums[mid] && target <= nums[right]) {
        left = mid + 1;  // Target está no intervalo ordenado da direita
      } else {
        right = mid - 1; // Target está na metade esquerda
      }
    }
  }

  return -1;
}`,
};

/**
 * 4.2 bs_koko_rate: Taxa Mínima de Processamento (Binary Search on Answer)
 */
const BS_KOKO_RATE: AlgoProblemTemplate = {
  id: 'bs_koko_rate',
  patternId: 'binary_search',
  title: 'Taxa Mínima de Processamento (Binary Search on Answer)',
  difficulty: 'Médio',
  constraints: [
    'Quantidade de lotes: 1 até 10.000 pilhas (piles)',
    'Volume de cada lote: até 1 bilhão de itens (1 <= piles[i] <= 10^9)',
    'Prazo h: de piles.length até 1 bilhão de horas',
    'Tempo alvo: O(n * log(max(piles))) com busca binária no espaço de resposta [1, max(piles)]',
  ],
  statement:
    'Dada uma lista de lotes de dados piles, onde piles[i] representa o volume do lote i, e um tempo limite de h horas, determine a taxa inteira mínima k (unidades processadas por hora) para liquidar todos os lotes dentro de h horas. Em cada hora, processa-se até k itens de um único lote (se o lote tiver menos que k, a hora é gasta integralmente naquele lote).',
  example: {
    input: 'piles = [3, 6, 7, 11], h = 8',
    output: '4',
    note: 'Com taxa k = 4: lote 3 leva 1h, lote 6 leva 2h, lote 7 leva 2h, lote 11 leva 3h -> Total = 1+2+2+3 = 8h (cabe exatamente em h=8).',
  },
  traceSteps: [
    {
      moment: 'Início (left = 1, right = 11)',
      state: 'Espaço de busca de taxas: [1..11]. Testa ponto médio mid = 6. Horas: ceil(3/6)+ceil(6/6)+ceil(7/6)+ceil(11/6) = 1+1+2+2 = 6h <= 8h (Viável!). Salva minRate = 6, tenta menor: right = 5.',
    },
    {
      moment: 'Passo 1 (left = 1, right = 5)',
      state: 'Testa mid = 3. Horas: ceil(3/3)+ceil(6/3)+ceil(7/3)+ceil(11/3) = 1+2+3+4 = 10h > 8h (Inviável, estourou o prazo!). Precisa de taxa maior: left = 4.',
    },
    {
      moment: 'Passo 2 (left = 4, right = 5)',
      state: 'Testa mid = 4. Horas: ceil(3/4)+ceil(6/4)+ceil(7/4)+ceil(11/4) = 1+2+2+3 = 8h <= 8h (Viável!). Salva minRate = 4, tenta menor: right = 3.',
    },
    {
      moment: 'Convergência (left = 4 > right = 3)',
      state: 'Loop encerra pois left > right. A menor taxa inteira que respeita o prazo de 8 horas é minRate = 4.',
    },
  ],
  steps: [
    {
      kind: 'bottleneck',
      title: 'Gargalo da Busca Linear da Taxa',
      prompt:
        'Por que testar sequencialmente cada taxa k = 1, 2, 3, ... até max(piles) é inviável?',
      hint: 'Com n = 10^4 e max(piles) = 10^9, uma varredura linear faria até 10^13 operações.',
      options: [
        {
          id: 'bs_kr_b_1',
          label:
            'O valor de max(piles) pode chegar a 10^9, resultando em O(n * max(piles)) operações e TLE.',
        },
        {
          id: 'bs_kr_b_2',
          label:
            'Aloca memória proporcional a k para cada taxa testada.',
        },
        {
          id: 'bs_kr_b_3',
          label:
            'Taxas inteiras não podem ser verificadas sem divisão de ponto flutuante.',
        },
        {
          id: 'bs_kr_b_4',
          label:
            'Exige preenchimento de uma matriz de Programação Dinâmica de 10^9 colunas.',
        },
      ],
      correctOptionId: 'bs_kr_b_1',
      explanation:
        'Testar taxas uma a uma de 1 até max(piles) gera uma complexidade de O(n * M), onde M = 10^9. Com n = 10^4, isso totaliza ~10^13 operações, inviável.',
    },
    {
      kind: 'pattern',
      title: 'Padrão Binary Search no Espaço de Resposta',
      prompt:
        'Qual propriedade do problema permite aplicar Busca Binária no intervalo de taxas [1, max(piles)]?',
      hint: 'A função horasNecessarias(k) é estritamente não crescente conforme k aumenta (função predicado monótona).',
      options: [
        {
          id: 'bs_kr_p_1',
          label:
            'Monotonicidade: se uma taxa k é suficiente para terminar em <= h horas, qualquer taxa k > k também será suficiente.',
        },
        {
          id: 'bs_kr_p_2',
          label:
            'Os lotes em piles já estão ordenados em ordem crescente por padrão.',
        },
        {
          id: 'bs_kr_p_3',
          label:
            'A taxa mínima é sempre o máximo divisor comum (MDC) de todos os elementos de piles.',
        },
        {
          id: 'bs_kr_p_4',
          label:
            'Podemos escolher gulosamente a média aritmética de piles dividida por h.',
        },
      ],
      correctOptionId: 'bs_kr_p_1',
      explanation:
        'O espaço de resposta [1, max(piles)] é monótono: existe um ponto de corte onde taxas menores falham (horas > h) e taxas maiores ou iguais sucedem (horas <= h). Isso permite Binary Search em O(n * log(max(piles))).',
    },
    {
      kind: 'invariant',
      title: 'Invariante da Busca Binária de Resposta Mínima',
      prompt:
        'Ao testar uma taxa mid viável (tempoTotal <= h), como os limites de busca devem ser atualizados?',
      hint: 'Queremos a menor taxa possível. Se mid já funciona, ela pode ser a resposta ótima, mas devemos investigar se existe algo menor à esquerda.',
      options: [
        {
          id: 'bs_kr_i_1',
          label:
            'Salvar mid como melhor resposta viável até agora e buscar taxas ainda menores na esquerda: right = mid - 1.',
        },
        {
          id: 'bs_kr_i_2',
          label:
            'Descartar mid e buscar apenas taxas estritamente maiores: left = mid + 1.',
        },
        {
          id: 'bs_kr_i_3',
          label:
            'Interromper a busca imediatamente, pois a primeira taxa viável é garantidamente a mínima.',
        },
        {
          id: 'bs_kr_i_4',
          label:
            'Dobrar o valor de mid para verificar se o tempo cai pela metade.',
        },
      ],
      correctOptionId: 'bs_kr_i_1',
      explanation:
        'Se mid é viável (tempo <= h), registramos ans = mid e tentamos taxas menores com right = mid - 1. Se mid for inviável (tempo > h), precisamos de uma taxa maior: left = mid + 1.',
    },
  ],
  generateDryRun: (): AlgoDryRunSpec => {
    // 4 lotes pequenos
    const piles = [randInt(3, 9), randInt(4, 11), randInt(5, 12), randInt(3, 10)];
    const h = randInt(piles.length + 1, piles.length + 4);

    function hoursNeeded(speed: number): number {
      let total = 0;
      for (const p of piles) {
        total += Math.ceil(p / speed);
      }
      return total;
    }

    let left = 1;
    let right = Math.max(...piles);
    let minRate = right;

    while (left <= right) {
      const mid = Math.floor((left + right) / 2);
      if (hoursNeeded(mid) <= h) {
        minRate = mid;
        right = mid - 1;
      } else {
        left = mid + 1;
      }
    }

    const correctLabel = `k = ${minRate}`;
    const candidates = [
      `k = ${Math.max(1, minRate - 1)}`,
      `k = ${minRate + 1}`,
      `k = ${minRate + 2}`,
      `k = ${Math.max(1, minRate - 2)}`,
      `k = ${minRate + 3}`,
    ];

    const { options, correctOptionId } = createDryRunOptions(correctLabel, candidates);

    return {
      prompt: `Considere os lotes piles = [${piles.join(', ')}] e H = ${h} horas. Qual é a taxa mínima inteira de processamento por hora k para concluir tudo dentro do prazo?`,
      hint: 'Teste valores de k calculando a soma de ceil(pile / k) para cada lote até que o total seja <= H.',
      options,
      correctOptionId,
      explanation: `Com taxa k = ${minRate}, o tempo total gasto é de ${hoursNeeded(minRate)} horas, que é <= ${h} horas. Qualquer taxa k < ${minRate} excede o limite.`,
    };
  },
  synthesis: [
    'Busca linear de taxa O(n * max(piles)) gera TLE.',
    'Padrão: Binary Search no espaço de resposta monótono [1, max(piles)].',
    'Invariante: se viável(mid), salva resposta e busca menor à esquerda (right = mid - 1); se inviável, left = mid + 1.',
    'Complexidade: Tempo O(n * log(max(piles))), Espaço O(1).',
  ],
  tsSkeleton: `export function minProcessingRate(piles: number[], h: number): number {
  let left = 1;
  let right = Math.max(...piles);
  let minRate = right;

  function canProcessAll(rate: number): boolean {
    let totalHours = 0;
    for (const pile of piles) {
      totalHours += Math.ceil(pile / rate);
    }
    return totalHours <= h;
  }

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);

    if (canProcessAll(mid)) {
      // Invariante: mid é viável, salva e busca taxa menor à esquerda
      minRate = mid;
      right = mid - 1;
    } else {
      // Taxa insuficiente, precisa ser maior
      left = mid + 1;
    }
  }

  return minRate;
}`,
};

// ============================================================================
// EXPORT ALGO_CATALOG_A
// ============================================================================

export const ALGO_CATALOG_A: AlgoProblemTemplate[] = [
  HM_TWO_SUM,
  HM_GROUP_ANAGRAMS,
  TP_SORTED_PAIR,
  TP_MAX_AREA,
  SW_MAX_WINDOW_SUM,
  SW_LONGEST_UNIQUE,
  BS_ROTATED_SEARCH,
  BS_KOKO_RATE,
];
