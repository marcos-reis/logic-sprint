import { pick, randInt, shuffle } from '../generators/utils';
import type { AlgoDryRunSpec, AlgoOption, AlgoProblemTemplate } from './types';

/**
 * Helper to construct 4 guaranteed unique options with random position for the correct answer.
 */
function makeOptions(
  correctLabel: string,
  distractorLabels: string[],
): { options: AlgoOption[]; correctOptionId: string } {
  const uniqueDistractors: string[] = [];
  for (const d of distractorLabels) {
    if (d !== correctLabel && !uniqueDistractors.includes(d)) {
      uniqueDistractors.push(d);
    }
    if (uniqueDistractors.length === 3) break;
  }

  let padIdx = 1;
  while (uniqueDistractors.length < 3) {
    const candidate = `${correctLabel} (alt ${padIdx})`;
    if (candidate !== correctLabel && !uniqueDistractors.includes(candidate)) {
      uniqueDistractors.push(candidate);
    }
    padIdx++;
  }

  const allLabels = [correctLabel, ...uniqueDistractors.slice(0, 3)];
  const shuffled = shuffle(allLabels);
  const correctIdx = shuffled.indexOf(correctLabel);

  const options: AlgoOption[] = shuffled.map((label, idx) => ({
    id: `opt_${idx}`,
    label,
  }));

  return {
    options,
    correctOptionId: `opt_${correctIdx}`,
  };
}

// ---------------------------------------------------------------------------
// 1. MONOTONIC STACK: Next Warmer (Daily Temperatures)
// ---------------------------------------------------------------------------
const msNextWarmer: AlgoProblemTemplate = {
  id: 'ms_next_warmer',
  patternId: 'monotonic_stack',
  title: 'Próximo Pico Maior (Next Greater / Daily Temperatures)',
  difficulty: 'Médio',
  constraints: [
    'Lista de temperaturas: 1 até 100.000 dias (exige O(n), O(n²) estoura o tempo)',
    'Valores térmicos: inteiros entre 30°C e 100°C',
    'Retorno: array de mesmo tamanho com dias de espera (0 se nunca esquentar)',
    'Espaço auxiliar: O(n) permitido para a pilha de índices pendentes',
  ],
  statement:
    'Dada uma lista de temperaturas diárias "temperatures", calcule para cada dia o número de dias até o próximo dia com temperatura estritamente maior. Se não houver dia mais quente no futuro para aquela posição, retorne 0.',
  example: {
    input: 'temperatures = [73, 74, 71, 75]',
    output: '[1, 2, 1, 0]',
    note: 'Dia 0 (73) esquenta no dia 1 (74 → 1). Dia 1 (74) esquenta no dia 3 (75 → 2). Dia 2 (71) esquenta no dia 3 (75 → 1). Dia 3 (75) não tem maior → 0.',
  },
  steps: [
    {
      kind: 'bottleneck',
      title: 'Gargalo do Brute Force',
      prompt:
        'Qual é a principal ineficiência de buscar o próximo dia mais quente para cada posição usando loops aninhados?',
      hint: 'Pense no número de verificações repetidas quando o array tem longas sequências estritamente decrescentes.',
      options: [
        {
          id: 'bf_0',
          label: 'A busca precisa alocar matrizes bidimensionais para armazenar os pares de dias.',
        },
        {
          id: 'bf_1',
          label: 'No pior caso (temperaturas decrescentes), cada índice varre todos os elementos à direita, gerando O(n^2).',
        },
        {
          id: 'bf_2',
          label: 'A verificação linear perde a precisão numérica ao converter temperaturas para inteiros.',
        },
        {
          id: 'bf_3',
          label: 'O algoritmo precisa ordenar o array previamente, o que quebra a ordem cronológica original.',
        },
      ],
      correctOptionId: 'bf_1',
      explanation:
        'O brute force percorre elementos à frente para cada índice i. Em arrays decrescentes, isso resulta em n*(n-1)/2 comparações, totalizando O(n^2).',
    },
    {
      kind: 'pattern',
      title: 'Reconhecimento do Padrão',
      prompt:
        'Por que uma Monotonic Stack (pilha monotônica decrescente de índices) é a estrutura ideal para resolver este problema em O(n)?',
      hint: 'Observe que os dias frios pendentes aguardam até que um valor maior apareça no stream para resolver suas distâncias.',
      options: [
        {
          id: 'pat_0',
          label: 'A pilha ordena todos os elementos em tempo O(1) usando swaps de ponteiros.',
        },
        {
          id: 'pat_1',
          label: 'A pilha armazena índices pendentes e, ao encontrar um valor maior, resolve e desempilha todos os menores em O(1) amortizado.',
        },
        {
          id: 'pat_2',
          label: 'A pilha divide o array recursivamente ao meio, garantindo complexidade O(n log n).',
        },
        {
          id: 'pat_3',
          label: 'A pilha permite acesso aleatório a qualquer índice anterior sem precisar desempilhar.',
        },
      ],
      correctOptionId: 'pat_1',
      explanation:
        'A pilha mantém índices cujos próximos dias mais quentes ainda não foram encontrados. Como cada índice é empilhado e desempilhado no máximo uma vez, o tempo total é O(n).',
    },
    {
      kind: 'invariant',
      title: 'Invariante da Pilha Monotônica',
      prompt:
        'Ao iterar no índice atual "curr" com valor T[curr], qual regra mantém o invariante da pilha decrescente?',
      hint: 'O que devemos fazer com todos os índices no topo da pilha cujo valor seja menor que T[curr]?',
      options: [
        {
          id: 'inv_0',
          label: 'Enquanto T[curr] > T[stack.top], desempilhamos prevIdx, definimos answer[prevIdx] = curr - prevIdx, e depois empilhamos curr.',
        },
        {
          id: 'inv_1',
          label: 'Empilhamos curr imediatamente e só desempilhamos quando a pilha atingir o tamanho máximo n.',
        },
        {
          id: 'inv_2',
          label: 'Substituímos o topo da pilha por curr somente se T[curr] for menor que T[stack.top].',
        },
        {
          id: 'inv_3',
          label: 'Limpamos a pilha inteira e reiniciamos a contagem sempre que encontramos um número par.',
        },
      ],
      correctOptionId: 'inv_0',
      explanation:
        'O elemento atual T[curr] é o próximo maior para todos os elementos no topo da pilha que forem estritamente menores que ele. Calculamos a distância curr - prevIdx e empilhamos curr.',
    },
  ],
  generateDryRun: (): AlgoDryRunSpec => {
    // Gera 5 temperaturas realistas
    const temps = [
      randInt(68, 75),
      randInt(71, 78),
      randInt(74, 82),
      randInt(69, 75),
      randInt(65, 72),
    ];

    // Executa Monotonic Stack real
    const n = temps.length;
    const ans = new Array<number>(n).fill(0);
    const stack: number[] = [];

    for (let i = 0; i < n; i++) {
      while (stack.length > 0 && temps[i] > temps[stack[stack.length - 1]]) {
        const prev = stack.pop()!;
        ans[prev] = i - prev;
      }
      stack.push(i);
    }

    const correctStr = JSON.stringify(ans);

    // Distratores plausíveis
    const d1 = JSON.stringify(ans.map((x) => (x > 0 ? x + 1 : 0)));
    const d2 = JSON.stringify(ans.slice().reverse());
    const d3 = JSON.stringify(
      temps.map((_, i) => {
        for (let j = i + 1; j < n; j++) {
          if (temps[j] >= temps[i]) return temps[j] - temps[i];
        }
        return 0;
      }),
    );
    const d4 = JSON.stringify(ans.map((x, i) => (x === 0 ? n - 1 - i : x)));

    const { options, correctOptionId } = makeOptions(correctStr, [d1, d2, d3, d4]);

    return {
      prompt: `Dadas as temperaturas diárias ${JSON.stringify(temps)}, qual é o array resultante com os dias de espera até o próximo dia mais quente?`,
      hint: 'Simule a pilha de índices da esquerda para a direita. Quando encontrar uma temperatura maior que o topo, calcule a distância curr - topo.',
      options,
      correctOptionId,
      explanation: `Rastreamento da pilha:\nTemperaturas: ${JSON.stringify(temps)}\nResultado calculado: ${correctStr}. Elementos que não encontram valor maior à direita permanecem com 0.`,
    };
  },
  synthesis: [
    'Cada índice entra e sai da pilha no máximo uma única vez, garantindo O(n) amortizado.',
    'Armazenar índices na pilha (em vez de apenas valores) permite calcular a distância temporal (curr - prevIdx) em O(1).',
    'Índices restantes na pilha ao final da varredura não possuem dia mais quente no futuro e mantêm o valor padrão 0.',
  ],
  tsSkeleton: `function dailyTemperatures(temperatures: number[]): number[] {
  const n = temperatures.length;
  const result = new Array<number>(n).fill(0);
  const stack: number[] = []; // índices de temperaturas decrescentes

  for (let i = 0; i < n; i++) {
    while (stack.length > 0 && temperatures[i] > temperatures[stack[stack.length - 1]]) {
      const prevIdx = stack.pop()!;
      result[prevIdx] = i - prevIdx;
    }
    stack.push(i);
  }

  return result;
}`,
  traceSteps: [
    {
      moment: 'Momento 1 (dia 0, temp = 73)',
      state: 'Pilha vazia → empilha índice 0. Pilha: [0]',
    },
    {
      moment: 'Momento 2 (dia 1, temp = 74)',
      state: '74 > 73 (topo=0) → desempilha 0, ans[0] = 1 - 0 = 1. Pilha fica vazia → empilha índice 1. Pilha: [1]',
    },
    {
      moment: 'Momento 3 (dia 2, temp = 71)',
      state: '71 < 74 (topo=1) → não desempilha, empilha índice 2. Pilha: [1, 2]',
    },
    {
      moment: 'Momento 4 (dia 3, temp = 75)',
      state: '75 > 71 (topo=2) → desempilha 2, ans[2] = 3 - 2 = 1. 75 > 74 (topo=1) → desempilha 1, ans[1] = 3 - 1 = 2. Empilha 3. Fim → ans[3] = 0. Resultado: [1, 2, 1, 0]',
    },
  ],
};

// ---------------------------------------------------------------------------
// 2. MONOTONIC STACK: Stock Span
// ---------------------------------------------------------------------------
const msStockSpan: AlgoProblemTemplate = {
  id: 'ms_stock_span',
  patternId: 'monotonic_stack',
  title: 'Span de Estabilidade Consecutiva',
  difficulty: 'Médio',
  constraints: [
    'Fluxo de cotações: até 100.000 chamadas diárias consecutivas',
    'Preços: inteiros entre 1 e 100.000',
    'Complexidade obrigatória: O(1) amortizado por consulta diária',
    'O span conta dias consecutivos para trás onde preço <= preço de hoje (mínimo 1)',
  ],
  statement:
    'Dada uma sequência diária de cotações "prices", calcule o span de cada dia. O span do dia i é definido como o número máximo de dias consecutivos anteriores (incluindo o próprio dia i) nos quais o preço da ação foi menor ou igual a prices[i].',
  example: {
    input: 'prices = [100, 80, 60, 70, 75]',
    output: '[1, 1, 1, 2, 4]',
    note: 'No preço 75 (dia 4), ele supera 70 (que cobria o 60), somando 1 (dia 4) + 2 (do 70) + 1 (do 60) = 4 dias consecutivos.',
  },
  steps: [
    {
      kind: 'bottleneck',
      title: 'Gargalo do Retrocesso Linear',
      prompt:
        'Por que retroceder linearmente no histórico de preços para cada novo dia é ineficiente em sequências longas?',
      hint: 'Considere o que acontece quando os preços estão em tendência estritamente crescente.',
      options: [
        {
          id: 'bf_0',
          label: 'Em arrays estritamente crescentes, cada dia i retrocede por todos os i dias anteriores, gerando complexidade O(n^2).',
        },
        {
          id: 'bf_1',
          label: 'A busca reversa altera os valores do array original durante a contagem.',
        },
        {
          id: 'bf_2',
          label: 'A contagem reversa exige recalculação de médias móveis exponenciais.',
        },
        {
          id: 'bf_3',
          label: 'O retrocesso linear perde a referência do índice base em arrays maiores que 1000 elementos.',
        },
      ],
      correctOptionId: 'bf_0',
      explanation:
        'Se cada dia i precisar inspecionar todos os dias de 0 até i-1, o total de operações é 1 + 2 + ... + n = O(n^2).',
    },
    {
      kind: 'pattern',
      title: 'Reconhecimento do Padrão',
      prompt:
        'Como a Monotonic Stack de pares [preço, span_acumulado] permite responder ao span de cada dia em O(1) amortizado?',
      hint: 'Se o preço de hoje for maior que o preço de ontem, o span de ontem já cobre dias ainda mais antigos.',
      options: [
        {
          id: 'pat_0',
          label: 'A pilha converte os preços em logaritmos para realizar busca binária.',
        },
        {
          id: 'pat_1',
          label: 'Ao encontrar elementos menores ou iguais no topo, somamos o span acumulado desses blocos em saltos imediatos.',
        },
        {
          id: 'pat_2',
          label: 'A pilha armazena apenas a média ponderada dos últimos 7 dias de cotação.',
        },
        {
          id: 'pat_3',
          label: 'A pilha descarta qualquer dia cujo valor seja ímpar para manter monotonicidade.',
        },
      ],
      correctOptionId: 'pat_1',
      explanation:
        'Cada entrada na pilha agrega o span de todo o bloco de dias que ela dominava. Assim, pulamos blocos inteiros em vez de inspecionar dia por dia.',
    },
    {
      kind: 'invariant',
      title: 'Invariante de Compressão de Span',
      prompt:
        'Ao processar o preço do dia atual "price", qual é o procedimento exato de atualização da pilha?',
      hint: 'Qual valor inicial de span atribuímos ao dia atual e quando paramos de desempilhar?',
      options: [
        {
          id: 'inv_0',
          label: 'Iniciamos span = 0 e desempilhamos todos os elementos maiores que price.',
        },
        {
          id: 'inv_1',
          label: 'Iniciamos span = 1; enquanto stack.top.price <= price, somamos stack.pop().span ao nosso span e ao final empilhamos [price, span].',
        },
        {
          id: 'inv_2',
          label: 'Se price for maior que o topo, substituímos o topo sem alterar o valor de span.',
        },
        {
          id: 'inv_3',
          label: 'Empilhamos [price, 1] e executamos um sort completo na pilha para reordená-la.',
        },
      ],
      correctOptionId: 'inv_1',
      explanation:
        'O dia atual conta como 1 dia (ele mesmo). Enquanto o topo tiver preço <= price, absorvemos o span acumulado daquele topo e o removemos, mantendo a pilha estritamente decrescente.',
    },
  ],
  generateDryRun: (): AlgoDryRunSpec => {
    // 5 preços aleatórios
    const prices = [
      randInt(80, 100),
      randInt(60, 80),
      randInt(55, 75),
      randInt(70, 90),
      randInt(75, 95),
    ];

    // Algoritmo real de Stock Span
    const spans: number[] = [];
    const stack: { price: number; span: number }[] = [];

    for (const p of prices) {
      let span = 1;
      while (stack.length > 0 && stack[stack.length - 1].price <= p) {
        span += stack.pop()!.span;
      }
      stack.push({ price: p, span });
      spans.push(span);
    }

    const correctStr = JSON.stringify(spans);

    // Distratores
    const d1 = JSON.stringify(spans.map((s, i) => (i === 0 ? 1 : s + 1)));
    const d2 = JSON.stringify(prices.map((_, i) => i + 1));
    const d3 = JSON.stringify([1, 1, 1, 1, 1]);
    const d4 = JSON.stringify(spans.slice().reverse());

    const { options, correctOptionId } = makeOptions(correctStr, [d1, d2, d3, d4]);

    return {
      prompt: `Dadas as cotações diárias de ações ${JSON.stringify(prices)}, qual é o array de spans correspondente a cada dia?`,
      hint: 'O span inicial do dia é sempre 1. Ao encontrar preços menores ou iguais no topo da pilha, absorva seus spans.',
      options,
      correctOptionId,
      explanation: `Cotações: ${JSON.stringify(prices)}\nSpans calculados: ${correctStr}.\nCada pico absorve os dias consecutivos anteriores com cotação menor ou igual.`,
    };
  },
  synthesis: [
    'A pilha armazena pares [preço, span] mantendo uma ordem estritamente decrescente de preços.',
    'A compressão de blocos anteriores permite calcular o span agregado em tempo amortizado O(1) por dia.',
    'A complexidade de espaço é O(n) no pior caso de preços estritamente decrescentes.',
  ],
  tsSkeleton: `function calculateSpans(prices: number[]): number[] {
  const result: number[] = [];
  const stack: { price: number; span: number }[] = [];

  for (const price of prices) {
    let span = 1;
    while (stack.length > 0 && stack[stack.length - 1].price <= price) {
      span += stack.pop()!.span;
    }
    stack.push({ price, span });
    result.push(span);
  }

  return result;
}`,
  traceSteps: [
    {
      moment: 'Momento 1 (dia 0, price = 100)',
      state: 'Pilha vazia → span = 1. Empilha [100, 1]. Pilha: [[100, 1]] → span: 1',
    },
    {
      moment: 'Momento 2 (dia 1..2, prices = 80, 60)',
      state: '80 < 100 → span = 1, empilha [80, 1]. 60 < 80 → span = 1, empilha [60, 1]. Pilha: [[100, 1], [80, 1], [60, 1]]',
    },
    {
      moment: 'Momento 3 (dia 3, price = 70)',
      state: '70 >= 60 (topo) → desempilha [60, 1], span = 1 + 1 = 2. Topo agora é 80 > 70. Empilha [70, 2]. Pilha: [[100, 1], [80, 1], [70, 2]] → span: 2',
    },
    {
      moment: 'Momento 4 (dia 4, price = 75)',
      state: '75 >= 70 → desempilha [70, 2], span = 1 + 2 = 3. Topo agora é 60 já absorvido antes e 80 > 75. Empilha [75, 4]. Pilha: [[100, 1], [80, 1], [75, 4]] → span: 4',
    },
  ],
};

// ---------------------------------------------------------------------------
// 3. BFS / DFS: Grid Shortest Path
// ---------------------------------------------------------------------------
const bdGridShortest: AlgoProblemTemplate = {
  id: 'bd_grid_shortest',
  patternId: 'bfs_dfs',
  title: 'Menor Caminho em Grid com Obstáculos (BFS)',
  difficulty: 'Médio',
  constraints: [
    'Dimensões do grid: R x C de 3x3 até 100x100 células (tempo O(R*C))',
    'Células: 0 representa caminho livre transitável, 1 representa parede/obstáculo',
    'Movimentos: 4 direções cardeais (cima, baixo, esquerda, direita) com custo 1 por passo',
    'Retorno: menor número de passos de (0,0) até (R-1, C-1), ou -1 se bloqueado',
  ],
  statement:
    'Dado um grid binário onde 0 representa uma célula livre e 1 uma parede intransponível, determine o número mínimo de passos para ir de (0,0) até (R-1, C-1). Se não houver caminho possível, retorne -1.',
  example: {
    input: 'grid = [[0, 0, 0], [1, 1, 0], [0, 0, 0]]',
    output: '4 passos',
    note: 'Caminho ótimo contornando a parede: (0,0) → (0,1) → (0,2) → (1,2) → (2,2), totalizando 4 passos.',
  },
  steps: [
    {
      kind: 'bottleneck',
      title: 'Inadequação do DFS para Menor Caminho',
      prompt:
        'Por que o algoritmo DFS (Depth-First Search) não garante encontrar o menor caminho na primeira vez que atinge o destino?',
      hint: 'Pense na ordem de exploração do DFS: ele aprofunda ramos arbitrários antes de retroceder.',
      options: [
        {
          id: 'bf_0',
          label: 'O DFS consome mais memória que a BFS ao visitar células livres.',
        },
        {
          id: 'bf_1',
          label: 'O DFS só funciona em grafos direcionados com pesos negativos.',
        },
        {
          id: 'bf_2',
          label: 'O DFS pode encontrar um caminho longo primeiro e precisaria explorar todas as ramificações exponenciais para provar o mínimo.',
        },
        {
          id: 'bf_3',
          label: 'O DFS é incapaz de detectar obstáculos e paredes no grid.',
        },
      ],
      correctOptionId: 'bf_2',
      explanation:
        'O DFS explora em profundidade. Para garantir a menor distância com DFS, seria necessário avaliar todos os caminhos possíveis (tempo exponencial).',
    },
    {
      kind: 'pattern',
      title: 'Reconhecimento do Padrão BFS',
      prompt:
        'Por que a BFS (Breadth-First Search) com fila FIFO garante encontrar a menor distância em tempo O(R * C)?',
      hint: 'Em que ordem de distância a partir da origem os nós são explorados por uma fila FIFO?',
      options: [
        {
          id: 'pat_0',
          label: 'A BFS expande o grafo em camadas concêntricas de distância k antes de k+1, garantindo que o primeiro encontro seja a menor distância.',
        },
        {
          id: 'pat_1',
          label: 'A BFS calcula a heurística Euclidiana de cada célula antes de inseri-la na fila.',
        },
        {
          id: 'pat_2',
          label: 'A BFS ordena todas as células por distância Manhattan usando um Heap.',
        },
        {
          id: 'pat_3',
          label: 'A BFS elimina todos os caminhos que possuem curvas ou mudanças de direção.',
        },
      ],
      correctOptionId: 'pat_0',
      explanation:
        'Em grafos não ponderados (onde cada passo custa 1), a BFS visita os nós em ordem crescente de distância. O primeiro momento em que (R-1, C-1) é desenfileirado corresponde ao menor caminho.',
    },
    {
      kind: 'invariant',
      title: 'Invariante de Visitação Imediata',
      prompt:
        'Para evitar enfileirar a mesma célula repetidamente no mesmo nível da BFS, quando devemos marcá-la como visitada?',
      hint: 'O que acontece se a marcação for adiada para o momento em que o nó é retirado da fila (shift)?',
      options: [
        {
          id: 'inv_0',
          label: 'Apenas após verificar todos os 4 vizinhos da célula.',
        },
        {
          id: 'inv_1',
          label: 'No momento em que ela é retirada da fila com shift().',
        },
        {
          id: 'inv_2',
          label: 'Somente se ela fizer parte da linha central do grid.',
        },
        {
          id: 'inv_3',
          label: 'No momento exato em que a célula é adicionada à fila (push).',
        },
      ],
      correctOptionId: 'inv_3',
      explanation:
        'Marcar a célula como visitada no momento do push impede que múltiplos nós vizinhos do mesmo nível a adicionem novamente à fila, evitando explosão de memória e tempo redundante.',
    },
  ],
  generateDryRun: (): AlgoDryRunSpec => {
    // Gera grid 3x4 garantidamente solúvel
    const rows = 3;
    const cols = 4;
    let grid: number[][] = [];
    let dist = -1;

    for (let attempt = 0; attempt < 20; attempt++) {
      grid = [
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ];
      // Adiciona 1 ou 2 obstáculos sem bloquear (0,0) e (2,3)
      const wallCandidates = [
        [0, 2],
        [1, 1],
        [1, 2],
        [2, 1],
      ];
      const selectedWall = pick(wallCandidates);
      grid[selectedWall[0]][selectedWall[1]] = 1;

      // Executa BFS real
      const queue: [number, number, number][] = [[0, 0, 0]];
      const visited = new Set<string>(['0,0']);
      const dirs = [
        [0, 1],
        [1, 0],
        [0, -1],
        [-1, 0],
      ];
      dist = -1;

      while (queue.length > 0) {
        const [r, c, d] = queue.shift()!;
        if (r === rows - 1 && c === cols - 1) {
          dist = d;
          break;
        }

        for (const [dr, dc] of dirs) {
          const nr = r + dr;
          const nc = c + dc;
          const key = `${nr},${nc}`;
          if (
            nr >= 0 &&
            nr < rows &&
            nc >= 0 &&
            nc < cols &&
            grid[nr][nc] === 0 &&
            !visited.has(key)
          ) {
            visited.add(key);
            queue.push([nr, nc, d + 1]);
          }
        }
      }

      if (dist > 0) break;
    }

    const gridStr = grid.map((row) => `  [${row.join(', ')}]`).join('\n');
    const correctLabel = `${dist} passos`;
    const d1 = `${dist + 2} passos`;
    const d2 = `${dist - 1 > 0 ? dist - 1 : dist + 3} passos`;
    const d3 = `${dist + 1} passos`;
    const d4 = `${dist + 4} passos`;

    const { options, correctOptionId } = makeOptions(correctLabel, [d1, d2, d3, d4]);

    return {
      prompt: `Considere o grid 3x4 abaixo (0 = livre, 1 = parede):\n[\n${gridStr}\n]\nQual é o menor número de passos de (0,0) até (2,3)?`,
      hint: 'Simule a expansão nível a nível da BFS a partir de (0,0), contando 1 passo para cada movimento ortogonal válido.',
      options,
      correctOptionId,
      explanation: `A BFS encontra o caminho mais curto até (2,3) em exatamente ${dist} passos, contornando quaisquer paredes no caminho.`,
    };
  },
  synthesis: [
    'A BFS garante a distância mínima em grafos com arestas de peso uniforme.',
    'A marcação de visitados no momento do push evita enfileiramentos duplicados.',
    'Complexidade de tempo e espaço é estritamente O(R * C), visitando cada célula no máximo uma vez.',
  ],
  tsSkeleton: `function shortestPathBinaryMatrix(grid: number[][]): number {
  const rows = grid.length;
  const cols = grid[0].length;
  if (grid[0][0] === 1 || grid[rows - 1][cols - 1] === 1) return -1;

  const queue: [number, number, number][] = [[0, 0, 0]]; // [r, c, dist]
  const visited = new Set<string>(['0,0']);
  const dirs = [[0, 1], [1, 0], [0, -1], [-1, 0]];

  while (queue.length > 0) {
    const [r, c, dist] = queue.shift()!;
    if (r === rows - 1 && c === cols - 1) return dist;

    for (const [dr, dc] of dirs) {
      const nr = r + dr;
      const nc = c + dc;
      const key = \`\${nr},\${nc}\`;
      if (
        nr >= 0 && nr < rows &&
        nc >= 0 && nc < cols &&
        grid[nr][nc] === 0 &&
        !visited.has(key)
      ) {
        visited.add(key);
        queue.push([nr, nc, dist + 1]);
      }
    }
  }

  return -1;
}`,
  traceSteps: [
    {
      moment: 'Momento 1 (Início em dist = 0)',
      state: 'Fila: [ (0,0, dist: 0) ]. Visitados: {(0,0)}. Origem livre e pronta para expandir.',
    },
    {
      moment: 'Momento 2 (Expansão da camada dist = 1)',
      state: 'Desenfileira (0,0). Vizinho (1,0) é parede (1). Vizinho (0,1) é livre (0) → enfileira (0,1, dist: 1), marca visitado. Fila: [ (0,1, dist: 1) ]',
    },
    {
      moment: 'Momento 3 (Expansão da camada dist = 2 e 3)',
      state: 'De (0,1) alcança (0,2, dist: 2). De (0,2) o vizinho abaixo (1,2) é livre → enfileira (1,2, dist: 3). Fila: [ (1,2, dist: 3) ]',
    },
    {
      moment: 'Momento 4 (Chegada ao destino)',
      state: 'De (1,2) expande para o destino (2,2, dist: 4). Como é o primeiro alcance via BFS FIFO, 4 é garantidamente a menor distância.',
    },
  ],
};

// ---------------------------------------------------------------------------
// 4. BFS / DFS: Count Connected Islands
// ---------------------------------------------------------------------------
const bdCountIslands: AlgoProblemTemplate = {
  id: 'bd_count_islands',
  patternId: 'bfs_dfs',
  title: 'Contagem de Clusters Conectados (DFS/BFS)',
  difficulty: 'Médio',
  constraints: [
    'Dimensões do mapa: M x N de 1x1 até 300x300 células (até 90.000 posições)',
    'Células: 1 representa terra firme, 0 representa água',
    'Conexão: estritamente ortogonal (4 direções: horizontal e vertical)',
    'Complexidade exigida: O(M * N) no tempo e espaço',
  ],
  statement:
    'Dado um grid 2D onde 1 representa terra e 0 representa água, calcule o número total de ilhas. Uma ilha é formada por células de terra adjacentes conectadas nas quatro direções cardeais e cercadas por água.',
  example: {
    input: 'grid = [[1, 1, 0, 0], [1, 1, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]]',
    output: '3 ilhas',
    note: 'O bloco 2x2 no topo esquerdo forma 1 ilha conexa. As terras em (2,2) e (3,3) estão desconexas e formam mais 2 ilhas individuais.',
  },
  steps: [
    {
      kind: 'bottleneck',
      title: 'Inviabilidade de Regras Locais',
      prompt:
        'Por que inspecionar apenas os vizinhos imediatos de cada célula com contagem local não é suficiente para contar ilhas?',
      hint: 'Pense em ilhas que se estendem em formatos de ferradura, ziguezague ou "C" por várias linhas.',
      options: [
        {
          id: 'bf_0',
          label: 'Regras locais exigem multiplicação de matrizes complexas.',
        },
        {
          id: 'bf_1',
          label: 'Uma mesma ilha pode se estender por múltiplos ramos; sem travessia completa (Flood-Fill), partes da mesma ilha seriam contadas várias vezes.',
        },
        {
          id: 'bf_2',
          label: 'Grids binários não permitem leitura sequencial de linhas.',
        },
        {
          id: 'bf_3',
          label: 'O grid se torna desconexo sempre que uma célula é 0.',
        },
      ],
      correctOptionId: 'bf_1',
      explanation:
        'Uma ilha é uma componente conexa arbitrária. Apenas um algoritmo de travessia (DFS ou BFS) consegue marcar toda a extensão conectada a partir de uma célula inicial.',
    },
    {
      kind: 'pattern',
      title: 'Reconhecimento do Padrão Flood-Fill',
      prompt:
        'Qual é a estratégia de Flood-Fill para contar componentes conexas em um grid?',
      hint: 'O que devemos fazer sempre que iteramos sobre o grid e encontramos uma célula 1 não visitada?',
      options: [
        {
          id: 'pat_0',
          label: 'Substituir todas as células 0 por 1 e somar o total de posições.',
        },
        {
          id: 'pat_1',
          label: 'Ordenar as linhas do grid em ordem lexicográfica.',
        },
        {
          id: 'pat_2',
          label: 'Ao encontrar uma célula 1, incrementamos o contador de ilhas e disparamos DFS/BFS para marcar toda a terra conectada como visitada.',
        },
        {
          id: 'pat_3',
          label: 'Contar o número de zeros na borda do grid e subtrair de M*N.',
        },
      ],
      correctOptionId: 'pat_2',
      explanation:
        'Sempre que encontramos terra não visitada, encontramos uma nova ilha. O Flood-Fill "afunda" ou marca toda a ilha, garantindo que suas outras células não incrementem o contador novamente.',
    },
    {
      kind: 'invariant',
      title: 'Invariante de Base e Afundamento',
      prompt:
        'Ao implementar o DFS recursivo para afundar a ilha, qual é a condição de parada (base case) correta?',
      hint: 'Quais condições indicam que a chamada recursiva ultrapassou os limites do grid ou chegou em água?',
      options: [
        {
          id: 'inv_0',
          label: 'Se r < 0, r >= rows, c < 0, c >= cols ou grid[r][c] !== 1, a função retorna imediatamente sem prosseguir.',
        },
        {
          id: 'inv_1',
          label: 'Se r === rows - 1 e c === cols - 1, a função lança uma exceção de parada.',
        },
        {
          id: 'inv_2',
          label: 'Se a soma das coordenadas r + c for um número primo.',
        },
        {
          id: 'inv_3',
          label: 'Apenas quando o número de ilhas for maior que 10.',
        },
      ],
      correctOptionId: 'inv_0',
      explanation:
        'O base case protege contra índices fora do grid e interrompe a recursão se a célula atual for água (0) ou já tiver sido visitada.',
    },
  ],
  generateDryRun: (): AlgoDryRunSpec => {
    // Gera grid 3x4
    const rows = 3;
    const cols = 4;
    const grid: number[][] = [
      [pick([1, 1, 0]), pick([1, 0, 0]), pick([0, 1, 0]), pick([1, 0, 0])],
      [pick([0, 1, 0]), pick([1, 1, 0]), pick([0, 0, 0]), pick([1, 1, 0])],
      [pick([1, 0, 0]), pick([0, 0, 0]), pick([1, 1, 0]), pick([1, 0, 0])],
    ];

    // Clona para contagem DFS
    const copy = grid.map((r) => [...r]);
    let islands = 0;

    function dfs(r: number, c: number): void {
      if (r < 0 || r >= rows || c < 0 || c >= cols || copy[r][c] !== 1) return;
      copy[r][c] = 0;
      dfs(r + 1, c);
      dfs(r - 1, c);
      dfs(r, c + 1);
      dfs(r, c - 1);
    }

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (copy[r][c] === 1) {
          islands++;
          dfs(r, c);
        }
      }
    }

    const gridStr = grid.map((row) => `  [${row.join(', ')}]`).join('\n');
    const correctLabel = `${islands} ${islands === 1 ? 'ilha' : 'ilhas'}`;
    const d1 = `${islands + 1} ilhas`;
    const d2 = `${Math.max(0, islands - 1)} ${Math.max(0, islands - 1) === 1 ? 'ilha' : 'ilhas'}`;
    const d3 = `${islands + 2} ilhas`;
    const d4 = `${islands + 3} ilhas`;

    const { options, correctOptionId } = makeOptions(correctLabel, [d1, d2, d3, d4]);

    return {
      prompt: `Dado o mapa binário 3x4 abaixo (1 = terra, 0 = água):\n[\n${gridStr}\n]\nQuantas ilhas conectadas (nas 4 direções) existem no mapa?`,
      hint: 'Identifique cada grupo contíguo de 1s conectados na vertical ou horizontal.',
      options,
      correctOptionId,
      explanation: `O algoritmo de Flood-Fill identifica exatamente ${correctLabel} conectadas no grid.`,
    };
  },
  synthesis: [
    'Cada célula é visitada no loop externo e no Flood-Fill no máximo uma vez, garantindo O(M * N).',
    'Afundar a terra (mutar 1 para 0) economiza memória ao dispensar matriz de visitados.',
    'A pilha de recursão consome no pior caso O(M * N) de espaço em ilhas que cobrem o grid todo.',
  ],
  tsSkeleton: `function numIslands(grid: number[][]): number {
  if (grid.length === 0) return 0;
  const rows = grid.length;
  const cols = grid[0].length;
  let count = 0;

  function dfs(r: number, c: number): void {
    if (r < 0 || r >= rows || c < 0 || c >= cols || grid[r][c] !== 1) {
      return;
    }
    grid[r][c] = 0; // afunda a terra para marcar como visitada
    dfs(r + 1, c);
    dfs(r - 1, c);
    dfs(r, c + 1);
    dfs(r, c - 1);
  }

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c] === 1) {
        count++;
        dfs(r, c);
      }
    }
  }

  return count;
}`,
  traceSteps: [
    {
      moment: 'Momento 1 (Varredura em (0,0))',
      state: 'grid[0][0] = 1 (terra não visitada) → incrementa ilhas = 1. Dispara Flood-Fill DFS/BFS a partir de (0,0).',
    },
    {
      moment: 'Momento 2 (Afundamento da 1ª Ilha)',
      state: 'DFS visita e afunda (muta para 0) as células conectadas (0,0), (0,1), (1,0) e (1,1). Toda a ilha 1 agora é 0.',
    },
    {
      moment: 'Momento 3 (Varredura em (2,2))',
      state: 'Varredura linear ignora os zeros e encontra terra em (2,2) → incrementa ilhas = 2. DFS afunda (2,2).',
    },
    {
      moment: 'Momento 4 (Varredura em (3,3) e Fim)',
      state: 'Encontra terra isolada em (3,3) → incrementa ilhas = 3. DFS afunda (3,3). Fim da matriz, total: 3 ilhas.',
    },
  ],
};

// ---------------------------------------------------------------------------
// 5. HEAP & INTERVALS: Merge Intervals
// ---------------------------------------------------------------------------
const hiMergeIntervals: AlgoProblemTemplate = {
  id: 'hi_merge_intervals',
  patternId: 'heap_intervals',
  title: 'Fusão de Janelas de Manutenção (Merge Intervals)',
  difficulty: 'Médio',
  constraints: [
    'Volume: 1 até 100.000 pares [início, fim] potencialmente desordenados',
    'Limites temporais: 0 <= início <= fim <= 10.000',
    'Complexidade de tempo esperada: O(n log n) dominada pela ordenação inicial',
    'Espaço auxiliar: O(n) para armazenar os intervalos consolidados',
  ],
  statement:
    'Dado um array de intervalos onde intervals[i] = [start_i, end_i], funda todos os intervalos sobrepostos e retorne um array de intervalos não sobrepostos que cubram todos os intervalos da entrada.',
  example: {
    input: 'intervals = [[1, 3], [8, 10], [2, 6], [15, 18]]',
    output: '[[1, 6], [8, 10], [15, 18]]',
    note: 'Após ordenar para [[1,3], [2,6], [8,10], [15,18]], os intervalos [1,3] e [2,6] colidem (2 <= 3) e se fundem em [1, 6].',
  },
  steps: [
    {
      kind: 'bottleneck',
      title: 'Gargalo da Desordem Temporal',
      prompt:
        'Por que tentar fundir intervalos sem ordenação prévia resulta em complexidade quadrática O(n^2)?',
      hint: 'Se os intervalos estiverem desordenados, como saber se um intervalo no fim da lista se sobrepõe ao primeiro?',
      options: [
        {
          id: 'bf_0',
          label: 'Intervalos desordenados exigem arredondamento de casas decimais.',
        },
        {
          id: 'bf_1',
          label: 'A ausência de ordenação impede o cálculo de distâncias euclidianas.',
        },
        {
          id: 'bf_2',
          label: 'Sem ordenação, qualquer par de intervalos pode se sobrepor, exigindo comparações cruzadas e fusões repetidas.',
        },
        {
          id: 'bf_3',
          label: 'Intervalos fora de ordem não podem ser representados em arrays no TypeScript.',
        },
      ],
      correctOptionId: 'bf_2',
      explanation:
        'Sem ordenação temporal, um intervalo pode sobrepor qualquer outro no conjunto, forçando comparações O(n^2) para cada fusão.',
    },
    {
      kind: 'pattern',
      title: 'Reconhecimento do Padrão Sort + Sweep',
      prompt:
        'Qual critério de ordenação transforma o problema de fusão em uma varredura linear O(n)?',
      hint: 'Se ordenarmos pelo ponto inicial (start), onde estarão localizados os intervalos que podem se sobrepor?',
      options: [
        {
          id: 'pat_0',
          label: 'Ordenar pelo tamanho da janela (end - start) em ordem decrescente.',
        },
        {
          id: 'pat_1',
          label: 'Ordenar pelo ponto de início (start); com isso, intervalos sobrepostos tornam-se vizinhos consecutivos.',
        },
        {
          id: 'pat_2',
          label: 'Ordenar pelo ponto médio (start + end) / 2.',
        },
        {
          id: 'pat_3',
          label: 'Ordenar pelo resto da divisão de start por 2.',
        },
      ],
      correctOptionId: 'pat_1',
      explanation:
        'Ao ordenar por start ascendente, se um intervalo não se sobrepõe ao atual, nenhum intervalo futuro poderá se sobrepor a ele, permitindo fusão em uma única passada.',
    },
    {
      kind: 'invariant',
      title: 'Invariante de Fusão Linear',
      prompt:
        'Dado o último intervalo fundido [lastStart, lastEnd] e o intervalo atual [currStart, currEnd], qual é a regra exata de fusão?',
      hint: 'O que indica que o intervalo atual começa antes ou no momento em que o anterior termina?',
      options: [
        {
          id: 'inv_0',
          label: 'Se currStart <= lastEnd, há sobreposição: atualizamos lastEnd = Math.max(lastEnd, currEnd); caso contrário, adicionamos [currStart, currEnd] à lista.',
        },
        {
          id: 'inv_1',
          label: 'Se currStart === lastEnd, substituímos lastStart por currEnd.',
        },
        {
          id: 'inv_2',
          label: 'Se currEnd > lastEnd, descartamos o intervalo anterior e mantemos apenas o atual.',
        },
        {
          id: 'inv_3',
          label: 'Somamos currStart + lastStart e dividimos por 2 para criar um ponto médio.',
        },
      ],
      correctOptionId: 'inv_0',
      explanation:
        'Se currStart <= lastEnd, eles colidem no tempo. O novo limite final é Math.max(lastEnd, currEnd), pois o intervalo atual pode terminar antes ou depois do anterior.',
    },
  ],
  generateDryRun: (): AlgoDryRunSpec => {
    // Gera 4 intervalos com sobreposições controladas
    const rawIntervals: [number, number][] = [
      [1, randInt(3, 5)],
      [randInt(2, 4), randInt(6, 8)],
      [randInt(9, 10), randInt(11, 13)],
      [randInt(12, 14), randInt(16, 18)],
    ];

    const inputShuffled = shuffle(rawIntervals);

    // Executa sort e merge real
    const sorted = [...inputShuffled].sort((a, b) => a[0] - b[0]);
    const merged: [number, number][] = [sorted[0]];

    for (let i = 1; i < sorted.length; i++) {
      const curr = sorted[i];
      const last = merged[merged.length - 1];
      if (curr[0] <= last[1]) {
        last[1] = Math.max(last[1], curr[1]);
      } else {
        merged.push(curr);
      }
    }

    const correctStr = JSON.stringify(merged);

    // Distratores
    const d1 = JSON.stringify(sorted);
    const d2 = JSON.stringify([[sorted[0][0], sorted[sorted.length - 1][1]]]);
    const d3 = JSON.stringify(
      merged.map((iv, i) => [iv[0], i === 0 ? iv[1] + 1 : iv[1]]),
    );
    const d4 = JSON.stringify(
      merged.map((iv) => [iv[0] + 1, iv[1] + 1]),
    );

    const { options, correctOptionId } = makeOptions(correctStr, [d1, d2, d3, d4]);

    return {
      prompt: `Dado o conjunto de intervalos desordenados ${JSON.stringify(inputShuffled)}, qual é o resultado após a fusão de todas as sobreposições?`,
      hint: 'Ordene primeiro por start e depois percorra linearmente expandindo o limite final com Math.max(lastEnd, currEnd).',
      options,
      correctOptionId,
      explanation: `Intervalos ordenados: ${JSON.stringify(sorted)}\nResultado fundido: ${correctStr}.`,
    };
  },
  synthesis: [
    'A ordenação por start_i em O(n log n) transforma o problema de sobreposição em uma varredura linear O(n).',
    'A atualização lastEnd = Math.max(lastEnd, currEnd) é indispensável para cobrir intervalos totalmente contidos.',
    'A complexidade de espaço é O(n) para armazenar os intervalos fundidos.',
  ],
  tsSkeleton: `function mergeIntervals(intervals: number[][]): number[][] {
  if (intervals.length <= 1) return intervals;

  // 1. Ordena os intervalos pelo ponto inicial
  intervals.sort((a, b) => a[0] - b[0]);

  const merged: number[][] = [intervals[0]];

  for (let i = 1; i < intervals.length; i++) {
    const current = intervals[i];
    const lastMerged = merged[merged.length - 1];

    if (current[0] <= lastMerged[1]) {
      // Sobreposição: expande o limite final
      lastMerged[1] = Math.max(lastMerged[1], current[1]);
    } else {
      // Sem sobreposição: inicia novo intervalo
      merged.push(current);
    }
  }

  return merged;
}`,
  traceSteps: [
    {
      moment: 'Momento 1 (Ordenação pelo início start)',
      state: 'Entrada desordenada é ordenada por start_i → [[1, 3], [2, 6], [8, 10], [15, 18]]. Inicializa merged = [[1, 3]].',
    },
    {
      moment: 'Momento 2 (Inspeciona [2, 6])',
      state: 'currStart (2) <= lastEnd (3) → há sobreposição! Expande: lastEnd = max(3, 6) = 6. Lista merged: [[1, 6]]',
    },
    {
      moment: 'Momento 3 (Inspeciona [8, 10])',
      state: 'currStart (8) > lastEnd (6) → sem sobreposição. Adiciona [8, 10] como novo bloco. Lista merged: [[1, 6], [8, 10]]',
    },
    {
      moment: 'Momento 4 (Inspeciona [15, 18])',
      state: 'currStart (15) > lastEnd (10) → sem colisão. Adiciona [15, 18]. Resultado final: [[1, 6], [8, 10], [15, 18]]',
    },
  ],
};

// ---------------------------------------------------------------------------
// 6. HEAP & INTERVALS: Top-K Frequent Elements
// ---------------------------------------------------------------------------
const hiTopKFrequent: AlgoProblemTemplate = {
  id: 'hi_top_k_frequent',
  patternId: 'heap_intervals',
  title: 'Top-K Eventos Mais Frequentes',
  difficulty: 'Médio',
  constraints: [
    'Tamanho da lista: 1 até 100.000 elementos (exige O(n log k), O(n log n) é subótimo)',
    'Parâmetro k: 1 até a quantidade U de números únicos no array',
    'Elementos: inteiros quaisquer (positivos ou negativos)',
    'Espaço auxiliar: O(n) para o mapa de frequência e heap de tamanho k',
  ],
  statement:
    'Dado um array de inteiros "nums" e um valor "k", retorne os k elementos que aparecem com maior frequência. O resultado deve listar os k elementos ordenados por frequência decrescente.',
  example: {
    input: 'nums = [1, 1, 1, 2, 2, 3], k = 2',
    output: '[1, 2]',
    note: 'O número 1 aparece 3 vezes, o 2 aparece 2 vezes e o 3 aparece 1 vez. Os 2 mais frequentes são [1, 2].',
  },
  steps: [
    {
      kind: 'bottleneck',
      title: 'Gargalo do Sort Integral',
      prompt:
        'Por que ordenar todas as U chaves únicas por frequência com QuickSort O(U log U) é subótimo quando k << U?',
      hint: 'Pense no esforço computacional desperdiçado ao ordenar elementos que jamais farão parte do Top-K.',
      options: [
        {
          id: 'bf_0',
          label: 'O QuickSort não funciona com contagens de frequência em tabelas hash.',
        },
        {
          id: 'bf_1',
          label: 'Ordenar todos os U elementos gasta O(U log U), enquanto manter apenas os k mais frequentes em um Min-Heap custa apenas O(U log k).',
        },
        {
          id: 'bf_2',
          label: 'O sort integral inverte os sinais dos números inteiros no array.',
        },
        {
          id: 'bf_3',
          label: 'A ordenação consome espaço quadrático na memória heap do JavaScript.',
        },
      ],
      correctOptionId: 'bf_1',
      explanation:
        'Quando k é pequeno (ex: top 3 em 1.000.000 de chaves), ordenar o milhão inteiro é um desperdício massivo. Um Min-Heap de tamanho k processa cada chave em log(k).',
    },
    {
      kind: 'pattern',
      title: 'Reconhecimento do Padrão Min-Heap de Tamanho Fixo',
      prompt:
        'Como um Min-Heap mantido com tamanho máximo k descarta os elementos menos frequentes eficientemente?',
      hint: 'Qual elemento fica na raiz do Min-Heap e por que ele é o primeiro a ser eliminado quando o heap atinge tamanho k + 1?',
      options: [
        {
          id: 'pat_0',
          label: 'O Min-Heap mantém a menor frequência dos top-k na raiz. Ao exceder tamanho k, removemos a raiz, retendo sempre os k maiores.',
        },
        {
          id: 'pat_1',
          label: 'O Min-Heap inverte as frequências para que todos os números fiquem negativos.',
        },
        {
          id: 'pat_2',
          label: 'O Min-Heap calcula a mediana das frequências em tempo constante O(1).',
        },
        {
          id: 'pat_3',
          label: 'O Min-Heap agrupa elementos em buckets de tamanho 2^k.',
        },
      ],
      correctOptionId: 'pat_0',
      explanation:
        'No Min-Heap, o elemento de menor prioridade (menor frequência) fica no topo. Ao desempilhar sempre que size > k, eliminamos os menores candidatos e preservamos os k mais frequentes.',
    },
    {
      kind: 'invariant',
      title: 'Invariante do Min-Heap Limitado',
      prompt:
        'Qual invariante é preservado no Min-Heap durante a varredura das frequências?',
      hint: 'O que o heap contém exatamente após processar qualquer quantidade de chaves?',
      options: [
        {
          id: 'inv_0',
          label: 'O heap contém todos os números pares encontrados no array original.',
        },
        {
          id: 'inv_1',
          label: 'O heap contém exatamente k elementos, que representam os k de maior frequência observados até aquele momento.',
        },
        {
          id: 'inv_2',
          label: 'O heap mantém a soma acumulada de todas as frequências menor que k.',
        },
        {
          id: 'inv_3',
          label: 'O heap armazena apenas chaves com frequência exatamente igual a k.',
        },
      ],
      correctOptionId: 'inv_1',
      explanation:
        'O Min-Heap de tamanho k atua como um filtro: a qualquer instante, ele guarda os k maiores candidatos vistos até o momento, com o menor deles pronto para ser substituído na raiz.',
    },
  ],
  generateDryRun: (): AlgoDryRunSpec => {
    // Gera elementos com frequências bem definidas
    const valA = randInt(1, 4);
    const valB = valA + randInt(1, 3);
    const valC = valB + randInt(1, 3);
    const valD = valC + randInt(1, 3);

    const nums = [
      valA,
      valA,
      valA,
      valA, // 4 vezes
      valB,
      valB,
      valB, // 3 vezes
      valC,
      valC, // 2 vezes
      valD, // 1 vez
    ];
    const k = 2;

    // Contagem e ordenação real
    const freq = new Map<number, number>();
    for (const x of nums) {
      freq.set(x, (freq.get(x) || 0) + 1);
    }
    const entries = Array.from(freq.entries()).sort((a, b) => b[1] - a[1]);
    const topK = entries.slice(0, k).map(([num]) => num);

    const correctStr = JSON.stringify(topK);

    // Distratores
    const d1 = JSON.stringify([valC, valD]);
    const d2 = JSON.stringify([valA, valC]);
    const d3 = JSON.stringify([valB, valD]);
    const d4 = JSON.stringify([valB, valA]);

    const { options, correctOptionId } = makeOptions(correctStr, [d1, d2, d3, d4]);

    return {
      prompt: `Dado o array nums = ${JSON.stringify(shuffle(nums))} e k = ${k}, quais são os ${k} elementos mais frequentes (em ordem decrescente de frequência)?`,
      hint: 'Conte a ocorrência de cada número distinto e selecione os k elementos com maiores contagens.',
      options,
      correctOptionId,
      explanation: `Frequências: ${valA} (4x), ${valB} (3x), ${valC} (2x), ${valD} (1x).\nOs top-${k} mais frequentes são ${correctStr}.`,
    };
  },
  synthesis: [
    'Fase 1: Mapeamento de contagem com HashMap em O(n).',
    'Fase 2: Filtro com Min-Heap de tamanho k em O(U log k), descartando candidatos de menor frequência pelo topo.',
    'Excelente para cenários de streaming onde os dados chegam continuamente e mantemos apenas os k líderes.',
  ],
  tsSkeleton: `function topKFrequent(nums: number[], k: number): number[] {
  const freqMap = new Map<number, number>();
  for (const n of nums) {
    freqMap.set(n, (freqMap.get(n) || 0) + 1);
  }

  // Ordena por frequência decrescente (ou mantém Min-Heap de tamanho k)
  const entries = Array.from(freqMap.entries());
  entries.sort((a, b) => b[1] - a[1]);

  return entries.slice(0, k).map(([num]) => num);
}`,
  traceSteps: [
    {
      moment: 'Momento 1 (Contagem de frequências com HashMap)',
      state: 'Varredura linear constrói freqMap: { 1: 3, 2: 2, 3: 1 }. Total de 3 chaves únicas.',
    },
    {
      moment: 'Momento 2 (Alimentação do Min-Heap com tamanho k=2)',
      state: 'Insere (1, freq: 3) e (2, freq: 2) no heap. Min-Heap: [ (2, freq: 2), (1, freq: 3) ] com menor frequência no topo.',
    },
    {
      moment: 'Momento 3 (Processa chave 3 e descarte pelo topo)',
      state: 'Chave 3 tem freq: 1. Como freq 1 < topo (freq 2), ela é descartada sem entrar no top-k. O heap retém os líderes.',
    },
    {
      moment: 'Momento 4 (Extração do resultado)',
      state: 'Extrai os k elementos do heap e ordena por frequência decrescente → [1, 2].',
    },
  ],
};

// ---------------------------------------------------------------------------
// 7. DP 1D: House Robber
// ---------------------------------------------------------------------------
const dpHouseRobber: AlgoProblemTemplate = {
  id: 'dp_house_robber',
  patternId: 'dp_1d',
  title: 'Escalonamento Máximo Sem Adjacentes (House Robber)',
  difficulty: 'Médio',
  constraints: [
    'Tamanho da lista de tarefas/casas: 1 até 10.000 elementos (exige O(n) no tempo)',
    'Valores/Pontuações: inteiros de 0 a 1.000',
    'Restrição: proibido selecionar elementos vizinhos contíguos (i e i+1)',
    'Espaço de memória: estritamente O(1) usando apenas duas variáveis de estado anterior',
  ],
  statement:
    'Você possui uma lista de tarefas com pontuações "nums" e deve selecionar um subconjunto para maximizar a pontuação total, com a restrição de que nunca pode selecionar duas tarefas adjacentes. Retorne o valor máximo possível.',
  example: {
    input: 'nums = [2, 7, 9, 3, 1]',
    output: '12',
    note: 'A seleção ótima é escolher os índices 0 (2), 2 (9) e 4 (1), somando 2 + 9 + 1 = 12 (sem nenhum par adjacente).',
  },
  steps: [
    {
      kind: 'bottleneck',
      title: 'Gargalo da Árvore de Decisão Exponencial',
      prompt:
        'Por que tentar todas as combinações válidas com recursão simples sem memoization gera complexidade O(2^n)?',
      hint: 'Observe quantos ramos da árvore recalculam o mesmo valor ótimo a partir do índice i.',
      options: [
        {
          id: 'bf_0',
          label: 'A cada elemento há bifurcação (pegar ou pular), gerando 2^n folhas com sobreposição massiva de subproblemas repetidos.',
        },
        {
          id: 'bf_1',
          label: 'A recursão inverte a paridade dos elementos a cada nível da árvore.',
        },
        {
          id: 'bf_2',
          label: 'O compilador transforma recursão em busca ternária exponencial.',
        },
        {
          id: 'bf_3',
          label: 'O cálculo exige divisão por zero quando o array tem tamanho ímpar.',
        },
      ],
      correctOptionId: 'bf_0',
      explanation:
        'A árvore de decisão recursiva recalcula repetidamente o mesmo subproblema rob(i+2) através de múltiplos caminhos, explodindo para O(2^n).',
    },
    {
      kind: 'pattern',
      title: 'Reconhecimento do Padrão DP 1D',
      prompt:
        'Qual relação de recorrência formaliza a decisão ótima de "incluir ou não incluir" o elemento nums[i]?',
      hint: 'Se decidirmos incluir nums[i], de qual subproblema anterior podemos aproveitar o resultado ótimo?',
      options: [
        {
          id: 'pat_0',
          label: 'dp[i] = dp[i - 1] + dp[i - 2] * nums[i]',
        },
        {
          id: 'pat_1',
          label: 'dp[i] = Math.min(dp[i - 1], nums[i])',
        },
        {
          id: 'pat_2',
          label: 'dp[i] = Math.max(dp[i - 1], dp[i - 2] + nums[i])',
        },
        {
          id: 'pat_3',
          label: 'dp[i] = (dp[i - 1] + nums[i]) / 2',
        },
      ],
      correctOptionId: 'pat_2',
      explanation:
        'A cada casa i, ou não a roubamos (ficando com o ótimo acumulado de dp[i-1]), ou a roubamos (somando nums[i] ao ótimo de dp[i-2]). O máximo entre essas duas opções define dp[i].',
    },
    {
      kind: 'invariant',
      title: 'Invariante de Otimização de Espaço O(1)',
      prompt:
        'Como atualizar as variáveis de estado no loop para manter a memória em O(1)?',
      hint: 'Quantos valores anteriores imediatos são necessários para calcular o valor do estado atual?',
      options: [
        {
          id: 'inv_0',
          label: 'Armazenar todos os valores em uma matriz quadrada de adjacência.',
        },
        {
          id: 'inv_1',
          label: 'Manter apenas duas variáveis (prev2 para i-2 e prev1 para i-1) e avançá-las a cada iteração: curr = Math.max(prev1, prev2 + x); prev2 = prev1; prev1 = curr.',
        },
        {
          id: 'inv_2',
          label: 'Recalcular a média de todos os elementos anteriores em cada passo.',
        },
        {
          id: 'inv_3',
          label: 'Limpar o array nums in-place trocando elementos negativos por zero.',
        },
      ],
      correctOptionId: 'inv_1',
      explanation:
        'Como dp[i] depende unicamente de dp[i-1] e dp[i-2], duas variáveis numéricas bastam para propagar o estado ótimo ao longo do array.',
    },
  ],
  generateDryRun: (): AlgoDryRunSpec => {
    // 5 valores positivos aleatórios
    const nums = [
      randInt(2, 6),
      randInt(7, 12),
      randInt(8, 14),
      randInt(3, 7),
      randInt(1, 5),
    ];

    // DP real O(1) space
    let prev2 = 0;
    let prev1 = 0;

    for (const x of nums) {
      const current = Math.max(prev1, prev2 + x);
      prev2 = prev1;
      prev1 = current;
    }

    const answer = prev1;

    // Distratores
    const evensSum = nums[0] + nums[2] + nums[4];
    const oddsSum = nums[1] + nums[3];
    const d1 = `${evensSum}`;
    const d2 = `${oddsSum}`;
    const d3 = `${answer + randInt(2, 4)}`;
    const d4 = `${Math.max(1, answer - randInt(2, 4))}`;

    const { options, correctOptionId } = makeOptions(`${answer}`, [d1, d2, d3, d4]);

    return {
      prompt: `Dado o array de pontuações nums = ${JSON.stringify(nums)}, qual é a pontuação máxima possível sem selecionar elementos adjacentes?`,
      hint: 'Calcule o ótimo progressivo usando a transição: curr = Math.max(prev1, prev2 + x).',
      options,
      correctOptionId,
      explanation: `Array: ${JSON.stringify(nums)}\nProgresso da DP: o valor ótimo final acumulado é ${answer}.`,
    };
  },
  synthesis: [
    'dp[i] resume a melhor decisão acumulada até o índice i sem violar a restrição de não adjacência.',
    'A relação dp[i] = Math.max(dp[i-1], dp[i-2] + nums[i]) examina exatamente as duas decisões possíveis.',
    'O uso de duas variáveis (prev1 e prev2) reduz a complexidade de espaço de O(n) para O(1).',
  ],
  tsSkeleton: `function rob(nums: number[]): number {
  let prev2 = 0; // dp[i-2]
  let prev1 = 0; // dp[i-1]

  for (const num of nums) {
    const current = Math.max(prev1, prev2 + num);
    prev2 = prev1;
    prev1 = current;
  }

  return prev1;
}`,
  traceSteps: [
    {
      moment: 'Momento 1 (Inicialização dos estados)',
      state: 'prev2 = 0 (ótimo de i-2), prev1 = 0 (ótimo de i-1).',
    },
    {
      moment: 'Momento 2 (Iterando elemento 2 e 7)',
      state: 'x = 2: curr = max(0, 0 + 2) = 2 → [prev2=0, prev1=2]. x = 7: curr = max(2, 0 + 7) = 7 → [prev2=2, prev1=7].',
    },
    {
      moment: 'Momento 3 (Iterando elemento 9)',
      state: 'x = 9: curr = max(prev1, prev2 + 9) = max(7, 2 + 9) = 11 → [prev2=7, prev1=11].',
    },
    {
      moment: 'Momento 4 (Iterando elementos 3 e 1 → Fim)',
      state: 'x = 3: curr = max(11, 7 + 3) = 11 → [prev2=11, prev1=11]. x = 1: curr = max(11, 11 + 1) = 12 → [prev2=11, prev1=12]. Retorno: 12.',
    },
  ],
};

// ---------------------------------------------------------------------------
// 8. DP 1D: Coin Change (Minimum Coins)
// ---------------------------------------------------------------------------
const dpCoinChange: AlgoProblemTemplate = {
  id: 'dp_coin_change',
  patternId: 'dp_1d',
  title: 'Mínimo de Pacotes para Capacidade Alvo (Coin Change)',
  difficulty: 'Médio',
  constraints: [
    'Valor alvo (amount): 0 até 10.000 (exige DP bottom-up em O(coins * amount))',
    'Denominações: 1 até 12 moedas com valores entre 1 e 10.000',
    'Disponibilidade: suprimento infinito de moedas de cada denominação',
    'Retorno: quantidade mínima inteira de moedas, ou -1 se for impossível compor o valor',
  ],
  statement:
    'Dado um conjunto de moedas de diferentes denominações "coins" e um valor total "amount", calcule o número mínimo de moedas necessárias para formar exatamente esse valor. Se não for possível formar o valor com nenhuma combinação, retorne -1. Cada moeda pode ser usada infinitas vezes.',
  example: {
    input: 'coins = [1, 3, 4], amount = 6',
    output: '2 moedas',
    note: 'A abordagem gulosa pegaria 4 + 1 + 1 (3 moedas). A solução ótima com DP encontra 3 + 3 = 6 usando apenas 2 moedas.',
  },
  steps: [
    {
      kind: 'bottleneck',
      title: 'Armadilha da Abordagem Gulosa (Greedy Trap)',
      prompt:
        'Por que escolher sempre a maior moeda possível (estratégia gulosa) falha em encontrar a quantidade mínima para sistemas arbitrários de moedas?',
      hint: 'Considere moedas [1, 3, 4] e amount = 6: a escolha gulosa de 4 deixa 2, exigindo 4 + 1 + 1 (3 moedas), enquanto 3 + 3 usa apenas 2.',
      options: [
        {
          id: 'bf_0',
          label: 'A estratégia gulosa causa estouro de pilha por recursão infinita.',
        },
        {
          id: 'bf_1',
          label: 'A escolha da maior moeda localmente pode forçar o uso de muitas moedas pequenas no restante, perdendo combinações balanceadas mais eficientes.',
        },
        {
          id: 'bf_2',
          label: 'A abordagem gulosa só funciona se todas as moedas forem números primos.',
        },
        {
          id: 'bf_3',
          label: 'Moedas maiores têm custo de processamento exponencial no hardware.',
        },
      ],
      correctOptionId: 'bf_1',
      explanation:
        'A decisão míope da maior moeda pode deixar um resto desfavorável. Em sistemas não canônicos, apenas Programação Dinâmica explora todas as transições de subproblemas para garantir o mínimo global.',
    },
    {
      kind: 'pattern',
      title: 'Reconhecimento do Padrão DP Bottom-Up',
      prompt:
        'Qual é a relação de recorrência para preencher o array dp[a] representando o número mínimo de moedas para atingir a quantia a (de 1 até amount)?',
      hint: 'Para cada moeda c menor ou igual a, como o subproblema dp[a - c] se relaciona com dp[a]?',
      options: [
        {
          id: 'pat_0',
          label: 'dp[a] = dp[a - 1] + dp[a - 2]',
        },
        {
          id: 'pat_1',
          label: 'dp[a] = Math.min(dp[a], 1 + dp[a - c]) para toda moeda c <= a.',
        },
        {
          id: 'pat_2',
          label: 'dp[a] = Math.max(dp[a], dp[a - c] * c)',
        },
        {
          id: 'pat_3',
          label: 'dp[a] = (dp[a - c] + a) / 2',
        },
      ],
      correctOptionId: 'pat_1',
      explanation:
        'Se usarmos uma moeda de valor c para completar o valor a, o custo total é 1 moeda mais o custo mínimo já computado para formar o valor restante (a - c), isto é, 1 + dp[a - c].',
    },
    {
      kind: 'invariant',
      title: 'Invariante de Inicialização e Minimização',
      prompt:
        'Como o array dp de tamanho amount + 1 deve ser inicializado antes do loop principal?',
      hint: 'Qual é o custo de formar amount = 0 e qual valor inicial representa quantias ainda inalcançáveis?',
      options: [
        {
          id: 'inv_0',
          label: 'dp[0] = 0 (caso base) e todas as outras posições com Infinity (ou amount + 1) para que Math.min substitua apenas caminhos válidos.',
        },
        {
          id: 'inv_1',
          label: 'Todas as posições preenchidas com 0.',
        },
        {
          id: 'inv_2',
          label: 'Todas as posições preenchidas com -1 e dp[0] = 1.',
        },
        {
          id: 'inv_3',
          label: 'dp preenchido com números aleatórios positivos.',
        },
      ],
      correctOptionId: 'inv_0',
      explanation:
        'Formar valor 0 exige 0 moedas. Inicializar com Infinity permite que a operação Math.min adote novos caminhos descobertos e ignore estados que ainda não têm solução viável.',
    },
  ],
  generateDryRun: (): AlgoDryRunSpec => {
    // Escolhe moedas (sempre incluindo 1 para garantir solução)
    const coinSet = pick([
      [1, 3, 4],
      [1, 3, 5],
      [1, 2, 5],
      [1, 4, 6],
    ]);
    const amount = randInt(6, 12);

    // DP real Bottom-Up
    const dp = new Array<number>(amount + 1).fill(Infinity);
    dp[0] = 0;

    for (let a = 1; a <= amount; a++) {
      for (const c of coinSet) {
        if (a - c >= 0 && dp[a - c] !== Infinity) {
          dp[a] = Math.min(dp[a], dp[a - c] + 1);
        }
      }
    }

    const answer = dp[amount];

    // Calcula solução gulosa ingênua para gerar distrator plausível
    let remaining = amount;
    let greedyCount = 0;
    const sortedCoins = [...coinSet].sort((a, b) => b - a);
    for (const c of sortedCoins) {
      while (remaining >= c) {
        remaining -= c;
        greedyCount++;
      }
    }

    const correctLabel = `${answer} ${answer === 1 ? 'moeda' : 'moedas'}`;
    const d1 = `${greedyCount > answer ? greedyCount : answer + 2} moedas`;
    const d2 = `${answer + 1} moedas`;
    const d3 = `${Math.max(1, answer - 1)} ${Math.max(1, answer - 1) === 1 ? 'moeda' : 'moedas'}`;
    const d4 = `${answer + 3} moedas`;

    const { options, correctOptionId } = makeOptions(correctLabel, [d1, d2, d3, d4]);

    return {
      prompt: `Dadas as moedas ${JSON.stringify(coinSet)} e o valor amount = ${amount}, qual é o número mínimo de moedas para formar exatamente esse valor?`,
      hint: 'Preencha o vetor dp de 0 até amount usando a transição: dp[a] = Math.min(dp[a], 1 + dp[a - c]).',
      options,
      correctOptionId,
      explanation: `Moedas: ${JSON.stringify(coinSet)}, Valor: ${amount}.\nO número mínimo ótimo de moedas calculado pela DP é ${correctLabel}.`,
    };
  },
  synthesis: [
    'A estratégia gulosa falha em sistemas não canônicos; DP garante a solução ótima global.',
    'A transição dp[a] = Math.min(dp[a], 1 + dp[a - c]) avalia o melhor último passo para compor o valor a.',
    'Complexidade de tempo é O(coins.length * amount) e espaço é O(amount).',
  ],
  tsSkeleton: `function coinChange(coins: number[], amount: number): number {
  const dp = new Array<number>(amount + 1).fill(Infinity);
  dp[0] = 0;

  for (let a = 1; a <= amount; a++) {
    for (const coin of coins) {
      if (a - coin >= 0 && dp[a - coin] !== Infinity) {
        dp[a] = Math.min(dp[a], dp[a - coin] + 1);
      }
    }
  }

  return dp[amount] === Infinity ? -1 : dp[amount];
}`,
  traceSteps: [
    {
      moment: 'Momento 1 (Inicialização da tabela DP)',
      state: 'Cria dp[0..6] preenchido com Infinity. Caso base: dp[0] = 0 (0 moedas para compor valor 0).',
    },
    {
      moment: 'Momento 2 (Calculando quantias 1 a 3)',
      state: 'dp[1] = 1 (moeda 1). dp[2] = 2 (1+1). dp[3] = min(dp[2]+1, dp[0]+1) = 1 (moeda 3). dp: [0, 1, 2, 1, Inf, Inf, Inf]',
    },
    {
      moment: 'Momento 3 (Calculando quantias 4 e 5)',
      state: 'dp[4] = 1 (moeda 4). dp[5] = min(dp[4]+1, dp[2]+1, dp[1]+1) = 2 (moedas 4+1 ou 1+4). dp: [0, 1, 2, 1, 1, 2, Inf]',
    },
    {
      moment: 'Momento 4 (Calculando amount = 6)',
      state: 'dp[6] = min(dp[5]+1 com m=1 → 3, dp[3]+1 com m=3 → 2, dp[2]+1 com m=4 → 3) = 2 (3 + 3). Retorno final: 2 moedas.',
    },
  ],
};

// ---------------------------------------------------------------------------
// Export catalog B (8 problems across 4 patterns)
// ---------------------------------------------------------------------------
export const ALGO_CATALOG_B: AlgoProblemTemplate[] = [
  msNextWarmer,
  msStockSpan,
  bdGridShortest,
  bdCountIslands,
  hiMergeIntervals,
  hiTopKFrequent,
  dpHouseRobber,
  dpCoinChange,
];
