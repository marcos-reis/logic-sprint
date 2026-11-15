import { pick, randInt, uid } from '../generators/utils';
import type {
  SysDesignDifficulty,
  SysDesignQuestion,
  SysDesignSkillId,
  UnitOption,
} from './types';

function round2(v: number): number {
  return Math.round(v * 100) / 100;
}

function formatIntBR(n: number): string {
  return n.toLocaleString('pt-BR');
}

// ---------------------------------------------------------------------------
// Skill 1: Traffic RPS (DAU -> RPS)
// ---------------------------------------------------------------------------

const TRAFFIC_UNITS: UnitOption[] = [
  { unit: 'RPS', multiplier: 1 },
  { unit: 'K RPS', multiplier: 1000 },
];

interface DomainContext {
  tag: string;
  name: string;
  action: string;
}

const TRAFFIC_DOMAINS: DomainContext[] = [
  { tag: 'Gateway PIX', name: 'o gateway de pagamentos instantâneos PIX', action: 'transações financeiras' },
  { tag: 'Feed Social', name: 'o serviço de feed da rede social', action: 'visualizações de postagens' },
  { tag: 'E-commerce', name: 'o marketplace de e-commerce', action: 'consultas de catálogo de produtos' },
  { tag: 'Streaming de Vídeo', name: 'a plataforma de streaming de vídeo', action: 'requisições de reprodução de vídeo' },
  { tag: 'Telemetria IoT', name: 'a frota de sensores veiculares IoT', action: 'pings de telemetria' },
  { tag: 'Logs de API', name: 'o gateway de microsserviços', action: 'chamadas de API autenticadas' },
  { tag: 'Notificações Push', name: 'o hub central de notificações push', action: 'disparos de mensagens' },
];

function generateTrafficRps(level: SysDesignDifficulty): SysDesignQuestion {
  const domain = pick(TRAFFIC_DOMAINS);

  if (level === 1) {
    // L1: Average RPS from DAU * req/day
    const dauMillions = pick([1, 2, 4.32, 5, 8.64, 10, 15, 20]);
    const dau = Math.round(dauMillions * 1_000_000);
    const reqPerDay = pick([10, 20, 24, 50, 100]);
    const totalReq = dau * reqPerDay;

    const exactRps = totalReq / 86400;
    const interviewRps = totalReq / 100000;

    const exactValue = round2(exactRps);
    const interviewValue = round2(interviewRps);

    const prompt = `Em uma estimativa de capacidade para ${domain.name} (${domain.tag}), o sistema possui ${formatIntBR(dau)} usuários ativos diários (DAU), e cada usuário realiza em média ${reqPerDay} ${domain.action} ao longo do dia. Qual é o RPS médio (requisições por segundo) esperado?`;

    return {
      id: uid('sd_traffic_l1'),
      skillId: 'traffic_rps',
      level: 1,
      contextTag: domain.tag,
      prompt,
      unitOptions: TRAFFIC_UNITS,
      defaultUnit: 'RPS',
      canonicalUnit: 'RPS',
      exactValue,
      interviewValue,
      toleranceRatio: 0.18,
      interviewShortcutSteps: [
        `Atalho de entrevista: aproxime 1 dia (86.400s) para 100.000s (10⁵ s).`,
        `Total de requisições/dia = ${formatIntBR(dau)} DAU × ${reqPerDay} req/usuário = ${formatIntBR(totalReq)} req/dia.`,
        `RPS Médio Rápido = ${formatIntBR(totalReq)} ÷ 100.000s = ${interviewValue} RPS.`,
      ],
      exactCalcSteps: [
        `Total de requisições/dia = ${formatIntBR(dau)} DAU × ${reqPerDay} = ${formatIntBR(totalReq)} req/dia.`,
        `Segundos em 1 dia = 24 × 3.600 = 86.400s.`,
        `RPS Médio Exato = ${formatIntBR(totalReq)} ÷ 86.400s = ${exactValue} RPS.`,
      ],
    };
  }

  if (level === 2) {
    // L2: Peak RPS with peakFactor
    const dauMillions = pick([2, 5, 8.64, 10, 20, 25, 40]);
    const dau = Math.round(dauMillions * 1_000_000);
    const reqPerDay = pick([20, 40, 50, 80, 100]);
    const peakFactor = pick([2, 3, 4, 5]);
    const totalReq = dau * reqPerDay;

    const avgExactRps = totalReq / 86400;
    const avgInterviewRps = totalReq / 100000;

    const peakExactRps = avgExactRps * peakFactor;
    const peakInterviewRps = avgInterviewRps * peakFactor;

    const exactValue = round2(peakExactRps);
    const interviewValue = round2(peakInterviewRps);

    const prompt = `Projetando a infraestrutura de ${domain.name} (${domain.tag}), temos ${formatIntBR(dau)} DAU gerando uma média de ${reqPerDay} ${domain.action} por dia. O tráfego não é uniforme e o fator de pico estimado é de ${peakFactor}× em relação à média diária. Qual é o Peak RPS (RPS de pico) que o sistema deve suportar?`;

    return {
      id: uid('sd_traffic_l2'),
      skillId: 'traffic_rps',
      level: 2,
      contextTag: domain.tag,
      prompt,
      unitOptions: TRAFFIC_UNITS,
      defaultUnit: 'RPS',
      canonicalUnit: 'RPS',
      exactValue,
      interviewValue,
      toleranceRatio: 0.18,
      interviewShortcutSteps: [
        `Atalho de entrevista: 1 dia ≈ 100.000s.`,
        `Total req/dia = ${formatIntBR(dau)} × ${reqPerDay} = ${formatIntBR(totalReq)} req/dia.`,
        `RPS Médio = ${formatIntBR(totalReq)} ÷ 100.000 = ${round2(avgInterviewRps)} RPS.`,
        `Peak RPS (${peakFactor}×) = ${round2(avgInterviewRps)} × ${peakFactor} = ${interviewValue} RPS.`,
      ],
      exactCalcSteps: [
        `Total req/dia = ${formatIntBR(dau)} × ${reqPerDay} = ${formatIntBR(totalReq)} req/dia.`,
        `RPS Médio Exato = ${formatIntBR(totalReq)} ÷ 86.400 = ${round2(avgExactRps)} RPS.`,
        `Peak RPS (${peakFactor}×) = ${round2(avgExactRps)} × ${peakFactor} = ${exactValue} RPS.`,
      ],
    };
  }

  // L3: High DAU scale (10M-80M) + Peak RPS with canonicalUnit 'K RPS'
  const dauMillions = pick([10, 20, 30, 40, 50, 60, 80]);
  const dau = dauMillions * 1_000_000;
  const reqPerDay = pick([50, 100, 120, 150, 200]);
  const peakFactor = pick([2, 3, 4, 5]);
  const totalReq = dau * reqPerDay;

  const avgExactRps = totalReq / 86400;
  const avgInterviewRps = totalReq / 100000;

  const peakExactRps = avgExactRps * peakFactor;
  const peakInterviewRps = avgInterviewRps * peakFactor;

  const exactValue = round2(peakExactRps / 1000);
  const interviewValue = round2(peakInterviewRps / 1000);

  const prompt = `Em escala global para ${domain.name} (${domain.tag}), a aplicação atende ${formatIntBR(dau)} DAU com cada usuário gerando em média ${reqPerDay} ${domain.action} diariamente. Considerando picos de carga de ${peakFactor}× sobre a média diária, calcule o Peak RPS em K RPS (milhares de requisições por segundo).`;

  return {
    id: uid('sd_traffic_l3'),
    skillId: 'traffic_rps',
    level: 3,
    contextTag: domain.tag,
    prompt,
    unitOptions: TRAFFIC_UNITS,
    defaultUnit: 'RPS',
    canonicalUnit: 'K RPS',
    exactValue,
    interviewValue,
    toleranceRatio: 0.18,
    interviewShortcutSteps: [
      `Atalho de entrevista: 1 dia ≈ 100.000s.`,
      `Total req/dia = ${formatIntBR(dau)} × ${reqPerDay} = ${formatIntBR(totalReq)} req/dia.`,
      `RPS Médio = ${formatIntBR(totalReq)} ÷ 100.000 = ${round2(avgInterviewRps)} RPS (${round2(avgInterviewRps / 1000)} K RPS).`,
      `Peak RPS (${peakFactor}×) = ${round2(avgInterviewRps / 1000)} × ${peakFactor} = ${interviewValue} K RPS.`,
    ],
    exactCalcSteps: [
      `Total req/dia = ${formatIntBR(dau)} × ${reqPerDay} = ${formatIntBR(totalReq)} req/dia.`,
      `RPS Médio Exato = ${formatIntBR(totalReq)} ÷ 86.400 = ${round2(avgExactRps)} RPS.`,
      `Peak RPS Exato = (${round2(avgExactRps)} × ${peakFactor}) ÷ 1.000 = ${exactValue} K RPS.`,
    ],
  };
}

// ---------------------------------------------------------------------------
// Skill 2: Read/Write ratio & Little's Law (read_write_little)
// ---------------------------------------------------------------------------

const RW_UNITS: UnitOption[] = [
  { unit: 'RPS', multiplier: 1 },
  { unit: 'K RPS', multiplier: 1000 },
];

const LITTLE_UNITS: UnitOption[] = [
  { unit: 'conexões', multiplier: 1 },
  { unit: 'K conexões', multiplier: 1000 },
];

const READ_WRITE_DOMAINS: DomainContext[] = [
  { tag: 'Feed Social', name: 'o serviço de postagens e timeline', action: 'interações' },
  { tag: 'E-commerce', name: 'o catálogo de produtos e checkout', action: 'operações' },
  { tag: 'Gateway PIX', name: 'o ledger financeiro de transferências', action: 'transações' },
  { tag: 'Logs de API', name: 'o pipeline de ingestão e visualização de logs', action: 'eventos' },
  { tag: 'Telemetria IoT', name: 'o broker de telemetria e dashboard de veículos', action: 'mensagens' },
];

function generateReadWriteLittle(level: SysDesignDifficulty): SysDesignQuestion {
  const domain = pick(READ_WRITE_DOMAINS);

  if (level === 1) {
    // L1: Read/Write split ratio
    const totalRps = pick([1000, 2000, 5000, 10000, 20000, 50000, 100000]);
    const ratioData = pick([
      { readParts: 9, writeParts: 1, label: '9:1' },
      { readParts: 19, writeParts: 1, label: '19:1' },
      { readParts: 49, writeParts: 1, label: '49:1' },
      { readParts: 4, writeParts: 1, label: '4:1' },
    ]);

    const isWriteTarget = randInt(0, 1) === 1;
    const targetType = isWriteTarget ? 'Escrita (Write RPS)' : 'Leitura (Read RPS)';
    const totalParts = ratioData.readParts + ratioData.writeParts;
    const targetParts = isWriteTarget ? ratioData.writeParts : ratioData.readParts;
    const targetFraction = targetParts / totalParts;
    const resultRps = totalRps * targetFraction;

    const useK = resultRps >= 1000 && randInt(0, 1) === 1;
    const canonicalUnit = useK ? 'K RPS' : 'RPS';
    const exactValue = round2(useK ? resultRps / 1000 : resultRps);
    const interviewValue = exactValue;

    const percentText = `${Math.round(targetFraction * 100)}%`;

    const prompt = `Em ${domain.name} (${domain.tag}), o tráfego total de entrada é de ${formatIntBR(totalRps)} RPS. A proporção entre requisições de leitura e escrita é de ${ratioData.label} (Leitura : Escrita). Calcule a taxa de requisições de ${targetType}.`;

    return {
      id: uid('sd_rw_l1'),
      skillId: 'read_write_little',
      level: 1,
      contextTag: domain.tag,
      prompt,
      unitOptions: RW_UNITS,
      defaultUnit: 'RPS',
      canonicalUnit,
      exactValue,
      interviewValue,
      toleranceRatio: 0.15,
      interviewShortcutSteps: [
        `Proporção ${ratioData.label}: total de partes = ${ratioData.readParts} + ${ratioData.writeParts} = ${totalParts} partes.`,
        `Fração de ${targetType}: ${targetParts}/${totalParts} (${percentText}).`,
        `Taxa = ${formatIntBR(totalRps)} RPS × (${targetParts}/${totalParts}) = ${exactValue} ${canonicalUnit}.`,
      ],
      exactCalcSteps: [
        `Total de partes = ${ratioData.readParts} + ${ratioData.writeParts} = ${totalParts}.`,
        `Fração alvo = ${targetParts} ÷ ${totalParts} = ${targetFraction}.`,
        `RPS alvo = ${formatIntBR(totalRps)} × ${targetFraction} = ${exactValue} ${canonicalUnit}.`,
      ],
    };
  }

  if (level === 2) {
    // L2: Little's Law (L = lambda * W)
    const rps = pick([1000, 2000, 4000, 5000, 10000, 20000, 40000, 50000]);
    const latencyMs = pick([50, 100, 200, 250, 500]);
    const latencySec = latencyMs / 1000;
    const concurrentConns = rps * latencySec;

    const useK = concurrentConns >= 1000 && randInt(0, 1) === 1;
    const canonicalUnit = useK ? 'K conexões' : 'conexões';
    const exactValue = round2(useK ? concurrentConns / 1000 : concurrentConns);
    const interviewValue = exactValue;

    const prompt = `Pela Lei de Little ($L = \\lambda \\times W$), dimensionamos o pool de conexões simultâneas de ${domain.name} (${domain.tag}). Se o serviço processa ${formatIntBR(rps)} RPS (taxa de chegada $\\lambda$) com tempo médio de resposta de ${latencyMs} ms ($W$), quantas conexões concorrentes ativas ($L$) o servidor mantém em regime permanente?`;

    return {
      id: uid('sd_little_l2'),
      skillId: 'read_write_little',
      level: 2,
      contextTag: domain.tag,
      prompt,
      unitOptions: LITTLE_UNITS,
      defaultUnit: 'conexões',
      canonicalUnit,
      exactValue,
      interviewValue,
      toleranceRatio: 0.15,
      interviewShortcutSteps: [
        `Lei de Little: L = λ × W (onde λ = taxa de chegada em req/s e W = latência em segundos).`,
        `W = ${latencyMs} ms = ${latencySec} s.`,
        `L = ${formatIntBR(rps)} req/s × ${latencySec} s = ${exactValue} ${canonicalUnit}.`,
      ],
      exactCalcSteps: [
        `Converter latência para segundos: ${latencyMs} ms ÷ 1.000 = ${latencySec} s.`,
        `Aplicar L = λ × W: ${formatIntBR(rps)} × ${latencySec} = ${round2(concurrentConns)} conexões.`,
        `Resultado na unidade canônica = ${exactValue} ${canonicalUnit}.`,
      ],
    };
  }

  // L3: Combined DAU + req/day + avg latency(ms) -> concurrent connections at Peak (2x or 3x)
  const dauMillions = pick([5, 10, 20, 30, 50]);
  const dau = dauMillions * 1_000_000;
  const reqPerDay = pick([10, 20, 50, 100]);
  const peakFactor = pick([2, 3]);
  const latencyMs = pick([50, 100, 200, 250, 500]);
  const latencySec = latencyMs / 1000;

  const totalReq = dau * reqPerDay;
  const avgExactRps = totalReq / 86400;
  const avgInterviewRps = totalReq / 100000;

  const peakExactRps = avgExactRps * peakFactor;
  const peakInterviewRps = avgInterviewRps * peakFactor;

  const lExact = peakExactRps * latencySec;
  const lInterview = peakInterviewRps * latencySec;

  const useK = lExact >= 1000;
  const canonicalUnit = useK ? 'K conexões' : 'conexões';
  const exactValue = round2(useK ? lExact / 1000 : lExact);
  const interviewValue = round2(useK ? lInterview / 1000 : lInterview);

  const prompt = `Dimensionando a capacidade de sockets simultâneos em ${domain.name} (${domain.tag}): o sistema atende ${formatIntBR(dau)} DAU, cada usuário faz ${reqPerDay} requisições/dia, o fator de pico é de ${peakFactor}× e a latência média do endpoint é de ${latencyMs} ms. Pela Lei de Little, quantas conexões concorrentes o cluster precisa suportar durante o horário de pico?`;

  return {
    id: uid('sd_little_l3'),
    skillId: 'read_write_little',
    level: 3,
    contextTag: domain.tag,
    prompt,
    unitOptions: LITTLE_UNITS,
    defaultUnit: 'conexões',
    canonicalUnit,
    exactValue,
    interviewValue,
    toleranceRatio: 0.18,
    interviewShortcutSteps: [
      `Atalho de entrevista: 1 dia ≈ 100.000s.`,
      `Total req/dia = ${formatIntBR(dau)} × ${reqPerDay} = ${formatIntBR(totalReq)} req/dia.`,
      `RPS Médio = ${formatIntBR(totalReq)} ÷ 100.000 = ${round2(avgInterviewRps)} RPS.`,
      `Peak RPS (${peakFactor}×) = ${round2(avgInterviewRps)} × ${peakFactor} = ${round2(peakInterviewRps)} RPS.`,
      `Conexões de Pico (L = λ × W) = ${round2(peakInterviewRps)} RPS × ${latencySec}s = ${interviewValue} ${canonicalUnit}.`,
    ],
    exactCalcSteps: [
      `Total req/dia = ${formatIntBR(dau)} × ${reqPerDay} = ${formatIntBR(totalReq)} req/dia.`,
      `RPS Médio Exato = ${formatIntBR(totalReq)} ÷ 86.400 = ${round2(avgExactRps)} RPS.`,
      `Peak RPS (${peakFactor}×) = ${round2(avgExactRps)} × ${peakFactor} = ${round2(peakExactRps)} RPS.`,
      `Conexões Exatas = ${round2(peakExactRps)} × ${latencySec}s = ${exactValue} ${canonicalUnit}.`,
    ],
  };
}

// ---------------------------------------------------------------------------
// Skill 3: Storage & Retention (storage)
// ---------------------------------------------------------------------------

const STORAGE_UNITS: UnitOption[] = [
  { unit: 'MB', multiplier: 1 },
  { unit: 'GB', multiplier: 1000 },
  { unit: 'TB', multiplier: 1_000_000 },
];

const STORAGE_DOMAINS: DomainContext[] = [
  { tag: 'Logs de API', name: 'o cluster de auditoria e logs estruturados', action: 'registros de log' },
  { tag: 'Telemetria IoT', name: 'a base de séries temporais de sensores', action: 'leituras de telemetria' },
  { tag: 'Feed Social', name: 'o banco de postagens e metadados', action: 'posts de usuários' },
  { tag: 'Gateway PIX', name: 'o repositório de comprovantes e transações', action: 'recibos financeiros' },
  { tag: 'E-commerce', name: 'o histórico de pedidos e eventos de checkout', action: 'pedidos concluídos' },
];

function generateStorage(level: SysDesignDifficulty): SysDesignQuestion {
  const domain = pick(STORAGE_DOMAINS);

  if (level === 1) {
    // L1: Daily storage (events/day * payload bytes/KB)
    const eventsMillions = pick([5, 10, 20, 50, 100]);
    const events = eventsMillions * 1_000_000;
    const payloadBytes = pick([200, 500, 1000, 2000, 5000]); // 200B to 5KB
    const payloadLabel = payloadBytes >= 1000 ? `${payloadBytes / 1000} KB` : `${payloadBytes} Bytes`;

    const totalBytes = events * payloadBytes;
    const totalMB = totalBytes / 1_000_000;
    const totalGB = totalMB / 1000;

    const isGB = totalGB >= 1;
    const canonicalUnit = isGB ? 'GB' : 'MB';
    const defaultUnit = 'MB';
    const exactValue = round2(isGB ? totalGB : totalMB);
    const interviewValue = exactValue;

    const prompt = `Em ${domain.name} (${domain.tag}), o sistema recebe ${formatIntBR(events)} ${domain.action} por dia. Cada evento gera um payload médio de ${payloadLabel} de dados no disco. Qual é o volume de armazenamento diário necessário?`;

    return {
      id: uid('sd_storage_l1'),
      skillId: 'storage',
      level: 1,
      contextTag: domain.tag,
      prompt,
      unitOptions: STORAGE_UNITS,
      defaultUnit,
      canonicalUnit,
      exactValue,
      interviewValue,
      toleranceRatio: 0.15,
      interviewShortcutSteps: [
        `Volume Diário = ${formatIntBR(events)} eventos × ${payloadBytes} bytes.`,
        `Total em Bytes = ${formatIntBR(totalBytes)} B.`,
        `Conversão decimal (1 MB = 10⁶ B, 1 GB = 10⁹ B): ${formatIntBR(totalBytes)} B = ${exactValue} ${canonicalUnit}.`,
      ],
      exactCalcSteps: [
        `Total = ${formatIntBR(events)} × ${payloadBytes} B = ${formatIntBR(totalBytes)} Bytes.`,
        `Volume em MB = ${formatIntBR(totalBytes)} ÷ 10⁶ = ${round2(totalMB)} MB.`,
        `Volume Canônico = ${exactValue} ${canonicalUnit}.`,
      ],
    };
  }

  if (level === 2) {
    // L2: Monthly (30 days) or Annual (365 days) storage
    const isMonthly = randInt(0, 1) === 1;
    const periodDays = isMonthly ? 30 : 365;
    const periodName = isMonthly ? 'mensal (30 dias)' : 'anual (365 dias)';

    const dailyGB = pick([10, 20, 50, 100, 200, 500]);
    const totalGB = dailyGB * periodDays;
    const totalTB = totalGB / 1000;

    const isTB = totalTB >= 1;
    const canonicalUnit = isTB ? 'TB' : 'GB';
    const defaultUnit = 'GB';

    const exactValue = round2(isTB ? totalTB : totalGB);
    // Shortcut for annual: 360 days or 365 days; let's allow 360d shortcut for annual
    const interviewGB = isMonthly ? totalGB : dailyGB * 360;
    const interviewValue = round2(isTB ? interviewGB / 1000 : interviewGB);

    const prompt = `Calculando a retenção de dados para ${domain.name} (${domain.tag}): o volume diário de novos dados gravados é de ${dailyGB} GB/dia. Qual é o volume de armazenamento total necessário para a retenção ${periodName}?`;

    return {
      id: uid('sd_storage_l2'),
      skillId: 'storage',
      level: 2,
      contextTag: domain.tag,
      prompt,
      unitOptions: STORAGE_UNITS,
      defaultUnit,
      canonicalUnit,
      exactValue,
      interviewValue,
      toleranceRatio: 0.15,
      interviewShortcutSteps: [
        isMonthly
          ? `Período mensal: ${dailyGB} GB/dia × 30 dias = ${interviewGB} GB (${interviewValue} ${canonicalUnit}).`
          : `Atalho de entrevista (ano ≈ 360 dias): ${dailyGB} GB/dia × 360 dias = ${interviewGB} GB (${interviewValue} ${canonicalUnit}).`,
      ],
      exactCalcSteps: [
        `Volume Diário = ${dailyGB} GB/dia.`,
        `Período = ${periodDays} dias.`,
        `Volume Exato = ${dailyGB} × ${periodDays} = ${totalGB} GB = ${exactValue} ${canonicalUnit}.`,
      ],
    };
  }

  // L3: Annual storage WITH replication factor (3x replicas), defaultUnit 'MB'
  const dailyGB = pick([20, 50, 100, 200, 400]);
  const replicationFactor = 3;
  const rawAnnualGB = dailyGB * 365;
  const totalAnnualGB_exact = rawAnnualGB * replicationFactor;
  const totalAnnualGB_interview = (dailyGB * 360) * replicationFactor;

  const totalTB_exact = totalAnnualGB_exact / 1000;
  const totalTB_interview = totalAnnualGB_interview / 1000;

  const isTB = totalTB_exact >= 1;
  const canonicalUnit = isTB ? 'TB' : 'GB';
  const defaultUnit = 'MB';

  const exactValue = round2(isTB ? totalTB_exact : totalAnnualGB_exact);
  const interviewValue = round2(isTB ? totalTB_interview : totalAnnualGB_interview);

  const prompt = `Para o projeto de banco de dados distribuído de ${domain.name} (${domain.tag}), a ingestão bruta diária é de ${dailyGB} GB/dia. Os dados devem ser retidos por 1 ano (365 dias) com fator de replicação de ${replicationFactor}× (3 cópias no cluster para tolerância a falhas). Qual é a capacidade total de armazenamento físico necessária?`;

  return {
    id: uid('sd_storage_l3'),
    skillId: 'storage',
    level: 3,
    contextTag: domain.tag,
    prompt,
    unitOptions: STORAGE_UNITS,
    defaultUnit,
    canonicalUnit,
    exactValue,
    interviewValue,
    toleranceRatio: 0.15,
    interviewShortcutSteps: [
      `Atalho de entrevista: 1 ano ≈ 360 dias.`,
      `Dados brutos anuais = ${dailyGB} GB/dia × 360 dias = ${dailyGB * 360} GB.`,
      `Com replicação (${replicationFactor}×) = ${dailyGB * 360} GB × ${replicationFactor} = ${totalAnnualGB_interview} GB = ${interviewValue} ${canonicalUnit}.`,
    ],
    exactCalcSteps: [
      `Dados brutos anuais = ${dailyGB} GB/dia × 365 dias = ${rawAnnualGB} GB.`,
      `Com replicação de ${replicationFactor}× = ${rawAnnualGB} GB × ${replicationFactor} = ${totalAnnualGB_exact} GB.`,
      `Capacidade final = ${exactValue} ${canonicalUnit}.`,
    ],
  };
}

// ---------------------------------------------------------------------------
// Skill 4: Cache & Memory (80/20 Rule) (cache)
// ---------------------------------------------------------------------------

const CACHE_UNITS: UnitOption[] = [
  { unit: 'MB', multiplier: 1 },
  { unit: 'GB', multiplier: 1000 },
  { unit: 'TB', multiplier: 1_000_000 },
];

const CACHE_DOMAINS: DomainContext[] = [
  { tag: 'Feed Social', name: 'o cluster Redis de cache de posts quentes', action: 'posts ativos' },
  { tag: 'E-commerce', name: 'a camada Memcached de páginas de produtos', action: 'itens de catálogo' },
  { tag: 'Streaming de Vídeo', name: 'o cache de metadados de vídeos em alta', action: 'vídeos ativos' },
  { tag: 'Gateway PIX', name: 'o cache de chaves de endereçamento PIX', action: 'chaves consultadas' },
  { tag: 'Notificações Push', name: 'o cache de tokens de dispositivos móveis', action: 'tokens de sessão' },
];

function generateCache(level: SysDesignDifficulty): SysDesignQuestion {
  const domain = pick(CACHE_DOMAINS);

  if (level === 1) {
    // L1: 80/20 rule on basic scale
    const itemsMillions = pick([1, 2, 5, 10, 20]);
    const items = itemsMillions * 1_000_000;
    const itemSizeKb = pick([1, 2, 5, 10, 20]);

    const hotItems = items * 0.20;
    const cacheSizeBytes = hotItems * (itemSizeKb * 1000);
    const cacheSizeMb = cacheSizeBytes / 1_000_000;
    const cacheSizeGb = cacheSizeMb / 1000;

    const isGb = cacheSizeGb >= 1;
    const canonicalUnit = isGb ? 'GB' : 'MB';
    const defaultUnit = 'MB';

    const exactValue = round2(isGb ? cacheSizeGb : cacheSizeMb);
    const interviewValue = exactValue;

    const prompt = `Aplicando a regra de Pareto (80/20) para dimensionar a RAM do ${domain.name} (${domain.tag}): o sistema possui ${formatIntBR(items)} ${domain.action} acessados por dia, e cada item ocupa em média ${itemSizeKb} KB. Se desejamos armazenar em cache os 20% de itens mais acessados (dados quentes), quanta memória RAM é necessária?`;

    return {
      id: uid('sd_cache_l1'),
      skillId: 'cache',
      level: 1,
      contextTag: domain.tag,
      prompt,
      unitOptions: CACHE_UNITS,
      defaultUnit,
      canonicalUnit,
      exactValue,
      interviewValue,
      toleranceRatio: 0.15,
      interviewShortcutSteps: [
        `Regra 80/20: 20% dos itens geram 80% do tráfego.`,
        `Itens em cache = 20% de ${formatIntBR(items)} = ${formatIntBR(hotItems)} itens.`,
        `RAM = ${formatIntBR(hotItems)} itens × ${itemSizeKb} KB = ${formatIntBR(hotItems * itemSizeKb)} KB = ${exactValue} ${canonicalUnit}.`,
      ],
      exactCalcSteps: [
        `Itens quentes (20%) = ${formatIntBR(items)} × 0,20 = ${formatIntBR(hotItems)}.`,
        `Volume total = ${formatIntBR(hotItems)} × ${itemSizeKb} KB = ${round2(cacheSizeMb)} MB.`,
        `Resultado na unidade canônica = ${exactValue} ${canonicalUnit}.`,
      ],
    };
  }

  if (level === 2) {
    // L2: 80/20 rule on higher scale
    const itemsMillions = pick([20, 50, 100, 200]);
    const items = itemsMillions * 1_000_000;
    const itemSizeKb = pick([2, 5, 10, 20, 50]);

    const hotItems = items * 0.20;
    const cacheSizeBytes = hotItems * (itemSizeKb * 1000);
    const cacheSizeMb = cacheSizeBytes / 1_000_000;
    const cacheSizeGb = cacheSizeMb / 1000;
    const cacheSizeTb = cacheSizeGb / 1000;

    const isTb = cacheSizeTb >= 1;
    const canonicalUnit = isTb ? 'TB' : 'GB';
    const defaultUnit = 'MB';

    const exactValue = round2(isTb ? cacheSizeTb : cacheSizeGb);
    const interviewValue = exactValue;

    const prompt = `Em alta escala para ${domain.name} (${domain.tag}), o catálogo possui ${formatIntBR(items)} ${domain.action} ativos diariamente, com tamanho médio de ${itemSizeKb} KB por registro. Seguindo a regra 80/20 (armazenando os 20% mais frequentes em memória), calcule a capacidade de RAM total necessária para o cluster de cache.`;

    return {
      id: uid('sd_cache_l2'),
      skillId: 'cache',
      level: 2,
      contextTag: domain.tag,
      prompt,
      unitOptions: CACHE_UNITS,
      defaultUnit,
      canonicalUnit,
      exactValue,
      interviewValue,
      toleranceRatio: 0.15,
      interviewShortcutSteps: [
        `Itens quentes (20%) = 20% × ${formatIntBR(items)} = ${formatIntBR(hotItems)} itens.`,
        `Tamanho = ${formatIntBR(hotItems)} × ${itemSizeKb} KB = ${formatIntBR(hotItems * itemSizeKb)} KB.`,
        `Conversão: ${formatIntBR(hotItems * itemSizeKb)} KB = ${round2(cacheSizeGb)} GB = ${exactValue} ${canonicalUnit}.`,
      ],
      exactCalcSteps: [
        `Itens a cachear = ${formatIntBR(items)} × 0,20 = ${formatIntBR(hotItems)}.`,
        `Volume em KB = ${formatIntBR(hotItems)} × ${itemSizeKb} KB.`,
        `Volume em GB = (${formatIntBR(hotItems)} × ${itemSizeKb}) ÷ 10⁶ = ${round2(cacheSizeGb)} GB (${exactValue} ${canonicalUnit}).`,
      ],
    };
  }

  // L3: 80/20 rule with metadata overhead or cluster replication
  const itemsMillions = pick([100, 200, 500]);
  const items = itemsMillions * 1_000_000;
  const itemSizeKb = pick([5, 10, 20, 50]);
  const overheadFactor = pick([1.25, 1.5, 2.0]);
  const overheadPercent = Math.round((overheadFactor - 1) * 100);

  const hotItems = items * 0.20;
  const rawCacheBytes = hotItems * (itemSizeKb * 1000);
  const totalCacheBytes = rawCacheBytes * overheadFactor;
  const totalGb = totalCacheBytes / 1_000_000_000;
  const totalTb = totalGb / 1000;

  const isTb = totalTb >= 1;
  const canonicalUnit = isTb ? 'TB' : 'GB';
  const defaultUnit = 'MB';

  const exactValue = round2(isTb ? totalTb : totalGb);
  const interviewValue = exactValue;

  const overheadLabel =
    overheadFactor === 2.0
      ? 'uma réplica secundária para alta disponibilidade (2× no total)'
      : `${overheadPercent}% adicional de overhead de metadados de chaves e ponteiros`;

  const prompt = `No dimensionamento do cluster de cache em memória para ${domain.name} (${domain.tag}), há ${formatIntBR(items)} ${domain.action} diários de ${itemSizeKb} KB cada. Aplicamos a regra 80/20 (20% dos itens quentes em cache) e adicionamos ${overheadLabel}. Qual é a capacidade de RAM total necessária para o cluster?`;

  return {
    id: uid('sd_cache_l3'),
    skillId: 'cache',
    level: 3,
    contextTag: domain.tag,
    prompt,
    unitOptions: CACHE_UNITS,
    defaultUnit,
    canonicalUnit,
    exactValue,
    interviewValue,
    toleranceRatio: 0.15,
    interviewShortcutSteps: [
      `Itens quentes (20%) = ${formatIntBR(items)} × 0,20 = ${formatIntBR(hotItems)} itens.`,
      `Dados brutos = ${formatIntBR(hotItems)} × ${itemSizeKb} KB = ${round2(rawCacheBytes / 1_000_000_000)} GB.`,
      `Com overhead (${overheadFactor}×) = ${round2(rawCacheBytes / 1_000_000_000)} GB × ${overheadFactor} = ${round2(totalGb)} GB = ${exactValue} ${canonicalUnit}.`,
    ],
    exactCalcSteps: [
      `Volume base = ${formatIntBR(hotItems)} itens × ${itemSizeKb} KB = ${rawCacheBytes / 1_000_000_000} GB.`,
      `Multiplicador com overhead = ${overheadFactor}×.`,
      `Capacidade final = (${rawCacheBytes / 1_000_000_000} × ${overheadFactor}) = ${exactValue} ${canonicalUnit}.`,
    ],
  };
}

// ---------------------------------------------------------------------------
// Skill 5: Bandwidth & Throughput (bandwidth)
// ---------------------------------------------------------------------------

const BANDWIDTH_BYTE_UNITS: UnitOption[] = [
  { unit: 'KB/s', multiplier: 1 },
  { unit: 'MB/s', multiplier: 1000 },
  { unit: 'GB/s', multiplier: 1_000_000 },
];

const BANDWIDTH_BIT_UNITS: UnitOption[] = [
  { unit: 'Mbps', multiplier: 1 },
  { unit: 'Gbps', multiplier: 1000 },
];

const BANDWIDTH_DOMAINS: DomainContext[] = [
  { tag: 'Streaming de Vídeo', name: 'a CDN de entrega de mídia e streaming', action: 'chunks de vídeo' },
  { tag: 'Feed Social', name: 'o serviço de upload e visualização de imagens', action: 'requisições de mídia' },
  { tag: 'Gateway PIX', name: 'o endpoint de liquidação de pagamentos', action: 'transações assinadas' },
  { tag: 'Logs de API', name: 'o pipeline de ingestão de telemetria e logs', action: 'lotes de logs' },
  { tag: 'E-commerce', name: 'a API de renderização de páginas e catálogo', action: 'chamadas de catálogo' },
];

function generateBandwidth(level: SysDesignDifficulty): SysDesignQuestion {
  const domain = pick(BANDWIDTH_DOMAINS);

  if (level === 1) {
    // L1: RPS * payload -> MB/s
    const rps = pick([500, 1000, 2000, 4000, 5000]);
    const payloadKb = pick([10, 20, 50, 100, 250]);

    const throughputKbS = rps * payloadKb;
    const throughputMbS = throughputKbS / 1000;

    const canonicalUnit = 'MB/s';
    const defaultUnit = 'KB/s';
    const exactValue = round2(throughputMbS);
    const interviewValue = exactValue;

    const prompt = `Calculando a largura de banda de saída (egress) em ${domain.name} (${domain.tag}): o sistema atende ${formatIntBR(rps)} RPS, com cada resposta HTTP transferindo em média ${payloadKb} KB de payload. Qual é o throughput de rede gerado em MB/s?`;

    return {
      id: uid('sd_bw_l1'),
      skillId: 'bandwidth',
      level: 1,
      contextTag: domain.tag,
      prompt,
      unitOptions: BANDWIDTH_BYTE_UNITS,
      defaultUnit,
      canonicalUnit,
      exactValue,
      interviewValue,
      toleranceRatio: 0.15,
      interviewShortcutSteps: [
        `Throughput = RPS × Tamanho do Payload.`,
        `Taxa = ${formatIntBR(rps)} req/s × ${payloadKb} KB = ${formatIntBR(throughputKbS)} KB/s.`,
        `Conversão para MB/s (1 MB = 1.000 KB): ${formatIntBR(throughputKbS)} ÷ 1.000 = ${exactValue} MB/s.`,
      ],
      exactCalcSteps: [
        `Throughput = ${formatIntBR(rps)} × ${payloadKb} KB/s = ${formatIntBR(throughputKbS)} KB/s.`,
        `Conversão = ${formatIntBR(throughputKbS)} KB/s ÷ 1.000 = ${exactValue} MB/s.`,
      ],
    };
  }

  if (level === 2) {
    // L2: High RPS * payload -> GB/s (or MB/s)
    const rps = pick([10000, 20000, 25000, 40000, 50000]);
    const payloadKb = pick([50, 100, 200, 250, 500]);

    const throughputKbS = rps * payloadKb;
    const throughputMbS = throughputKbS / 1000;
    const throughputGbS = throughputMbS / 1000;

    const isGbS = throughputGbS >= 1;
    const canonicalUnit = isGbS ? 'GB/s' : 'MB/s';
    const defaultUnit = 'MB/s';
    const exactValue = round2(isGbS ? throughputGbS : throughputMbS);
    const interviewValue = exactValue;

    const prompt = `Em horário de pico para ${domain.name} (${domain.tag}), a camada de borda (edge) atende ${formatIntBR(rps)} RPS com payload médio de resposta de ${payloadKb} KB. Qual é a taxa de transferência total de rede que o link deve suportar?`;

    return {
      id: uid('sd_bw_l2'),
      skillId: 'bandwidth',
      level: 2,
      contextTag: domain.tag,
      prompt,
      unitOptions: BANDWIDTH_BYTE_UNITS,
      defaultUnit,
      canonicalUnit,
      exactValue,
      interviewValue,
      toleranceRatio: 0.15,
      interviewShortcutSteps: [
        `Throughput = ${formatIntBR(rps)} RPS × ${payloadKb} KB = ${formatIntBR(throughputKbS)} KB/s.`,
        `Em MB/s = ${formatIntBR(throughputKbS)} ÷ 1.000 = ${formatIntBR(throughputMbS)} MB/s.`,
        `Em GB/s = ${throughputMbS} ÷ 1.000 = ${exactValue} ${canonicalUnit}.`,
      ],
      exactCalcSteps: [
        `Taxa bruta = ${formatIntBR(rps)} × ${payloadKb} KB/s = ${formatIntBR(throughputKbS)} KB/s.`,
        `Taxa em MB/s = ${throughputMbS} MB/s.`,
        `Taxa Canônica = ${exactValue} ${canonicalUnit}.`,
      ],
    };
  }

  // L3: Bit-rate scenarios (Mbps / Gbps with 1 Byte = 8 bits) OR Ultra-high GB/s scenarios
  const isBitRate = randInt(0, 1) === 1;

  if (isBitRate) {
    const rps = pick([2000, 5000, 10000, 20000, 40000]);
    const payloadKb = pick([50, 100, 250, 500]);

    const throughputKbS = rps * payloadKb;
    const throughputMbS = throughputKbS / 1000;
    const throughputMbps = throughputMbS * 8; // 1 byte = 8 bits
    const throughputGbps = throughputMbps / 1000;

    const isGbps = throughputGbps >= 1;
    const canonicalUnit = isGbps ? 'Gbps' : 'Mbps';
    const defaultUnit = 'Mbps';
    const exactValue = round2(isGbps ? throughputGbps : throughputMbps);
    const interviewValue = exactValue;

    const prompt = `Projetando o enlace de rede para ${domain.name} (${domain.tag}): o serviço atende ${formatIntBR(rps)} RPS com payload médio de ${payloadKb} KB por requisição. Considerando que 1 Byte = 8 bits (ou seja, 1 MB/s = 8 Mbps), calcule a largura de banda necessária para o link em Gigabit por segundo (Gbps) ou Megabit por segundo (Mbps).`;

    return {
      id: uid('sd_bw_l3_bit'),
      skillId: 'bandwidth',
      level: 3,
      contextTag: domain.tag,
      prompt,
      unitOptions: BANDWIDTH_BIT_UNITS,
      defaultUnit,
      canonicalUnit,
      exactValue,
      interviewValue,
      toleranceRatio: 0.15,
      interviewShortcutSteps: [
        `Taxa em Bytes/s = ${formatIntBR(rps)} RPS × ${payloadKb} KB = ${formatIntBR(throughputMbS)} MB/s.`,
        `Conversão para bits: 1 Byte = 8 bits → ${formatIntBR(throughputMbS)} MB/s × 8 = ${formatIntBR(throughputMbps)} Mbps.`,
        `Conversão final: ${formatIntBR(throughputMbps)} Mbps = ${exactValue} ${canonicalUnit}.`,
      ],
      exactCalcSteps: [
        `Throughput = ${formatIntBR(rps)} × ${payloadKb} KB/s = ${throughputMbS} MB/s.`,
        `Taxa em bits = ${throughputMbS} MB/s × 8 = ${throughputMbps} Mbps.`,
        `Taxa Canônica = ${exactValue} ${canonicalUnit}.`,
      ],
    };
  }

  // Ultra-high GB/s scenario
  const rps = pick([40000, 50000, 80000, 100000]);
  const payloadKb = pick([250, 500, 1000]); // up to 1MB

  const throughputKbS = rps * payloadKb;
  const throughputMbS = throughputKbS / 1000;
  const throughputGbS = throughputMbS / 1000;

  const canonicalUnit = 'GB/s';
  const defaultUnit = 'MB/s';
  const exactValue = round2(throughputGbS);
  const interviewValue = exactValue;

  const prompt = `Em escala extrema de infraestrutura para ${domain.name} (${domain.tag}), o tráfego atinge ${formatIntBR(rps)} RPS com payload médio de ${payloadKb} KB. Qual é o throughput de saída agregado necessário em GB/s?`;

  return {
    id: uid('sd_bw_l3_gb'),
    skillId: 'bandwidth',
    level: 3,
    contextTag: domain.tag,
    prompt,
    unitOptions: BANDWIDTH_BYTE_UNITS,
    defaultUnit,
    canonicalUnit,
    exactValue,
    interviewValue,
    toleranceRatio: 0.15,
    interviewShortcutSteps: [
      `Throughput = ${formatIntBR(rps)} RPS × ${payloadKb} KB = ${formatIntBR(throughputKbS)} KB/s.`,
      `Em MB/s = ${formatIntBR(throughputMbS)} MB/s.`,
      `Em GB/s = ${formatIntBR(throughputMbS)} ÷ 1.000 = ${exactValue} GB/s.`,
    ],
    exactCalcSteps: [
      `Taxa bruta = ${formatIntBR(rps)} × ${payloadKb} KB/s = ${formatIntBR(throughputKbS)} KB/s.`,
      `Conversão = ${formatIntBR(throughputKbS)} ÷ 1.000.000 = ${exactValue} GB/s.`,
    ],
  };
}

// ---------------------------------------------------------------------------
// Main Generator Entrypoint
// ---------------------------------------------------------------------------

export function generateSysDesignQuestion(
  skillId: SysDesignSkillId,
  level: SysDesignDifficulty,
): SysDesignQuestion {
  switch (skillId) {
    case 'traffic_rps':
      return generateTrafficRps(level);
    case 'read_write_little':
      return generateReadWriteLittle(level);
    case 'storage':
      return generateStorage(level);
    case 'cache':
      return generateCache(level);
    case 'bandwidth':
      return generateBandwidth(level);
  }
}
