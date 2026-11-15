/**
 * Utility helpers and data pools for LogicSprint question generators.
 */

export function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function pick<T>(arr: readonly T[]): T {
  if (arr.length === 0) {
    throw new Error('Cannot pick from an empty array');
  }
  return arr[randInt(0, arr.length - 1)];
}

export function pickDistinct<T>(arr: readonly T[], count: number): T[] {
  const copy = [...arr];
  const n = Math.min(count, copy.length);
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = copy[i];
    copy[i] = copy[j];
    copy[j] = temp;
  }
  return copy.slice(0, n);
}

export function shuffle<T>(arr: readonly T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = copy[i];
    copy[i] = copy[j];
    copy[j] = temp;
  }
  return copy;
}

let counter = 0;
export function uid(prefix: string = 'q'): string {
  counter = (counter + 1) % 1_000_000;
  const rnd = Math.random().toString(36).substring(2, 7);
  return `${prefix}_${Date.now().toString(36)}_${counter}_${rnd}`;
}

export const NAMES: readonly string[] = [
  'Ana',
  'Bruno',
  'Carlos',
  'Camila',
  'Diego',
  'Eduardo',
  'Fernanda',
  'Gabriel',
  'Helena',
  'Igor',
  'Juliana',
  'Lucas',
  'Mariana',
  'Otávio',
  'Paula',
  'Rafael',
  'Sofia',
  'Thiago',
  'Beatriz',
  'Rodrigo',
  'Larissa',
  'Marcelo',
  'Vanessa',
  'Felipe',
  'Renata',
  'Guilherme',
  'Letícia',
  'Matheus',
  'Aline',
  'Leandro',
];

export const TECH_TERMS: readonly string[] = [
  'microsserviços',
  'endpoints',
  'deploys',
  'pipelines CI/CD',
  'containers Docker',
  'requisições HTTP',
  'servidores cloud',
  'módulos de software',
  'bancos de dados',
  'clusters Kubernetes',
  'queries SQL',
  'camadas de cache',
  'workers assíncronos',
  'filas de mensagens',
  'instâncias EC2',
  'pods de produção',
  'jobs em background',
  'APIs REST',
  'rotinas de backup',
  'testes automatizados',
];

export const PRODUCTS: readonly string[] = [
  'laptops de alto desempenho',
  'licenças de IDE profissional',
  'monitores ultrawide 4K',
  'servidores dedicados',
  'teclados mecânicos ergonômicos',
  'assinaturas SaaS Enterprise',
  'headsets com cancelamento de ruído',
  'tokens de segurança FIDO2',
  'switches de rede 10Gbps',
  'no-breaks senoidais',
];

export const COMPANIES: readonly string[] = [
  'NuvemTech',
  'ByteCorp',
  'DataFlow Labs',
  'LogiScale',
  'Nexus Digital',
  'DevSolutions',
  'CloudPeak',
  'FinScale',
  'Veloce Sistemas',
  'Alpha Software',
];
