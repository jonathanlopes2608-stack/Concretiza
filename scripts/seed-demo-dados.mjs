/**
 * Dados de demonstração para dashboard / apresentação ao cliente.
 * Idempotente: remove propostas DEMO/* e recria.
 *
 * Uso: node scripts/seed-demo-dados.mjs
 *      npm run db:seed-demo
 */
import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

const DEMO_PREFIX = "DEMO/";

function daysAgo(days, hours = 10) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(hours, 0, 0, 0);
  return d;
}

function hoursFromNow(hours) {
  return new Date(Date.now() + hours * 60 * 60 * 1000);
}

function hoursAgo(hours) {
  return new Date(Date.now() - hours * 60 * 60 * 1000);
}

/**
 * Movimentações ricas (linha do tempo). `d` = dias atrás, `h` = hora do dia.
 * Usadas em 10 processos; os demais mantêm histórico simples.
 * @typedef {{ d: number, h?: number, de: string | null, para: string, obs: string }} MovDemo
 */

const usuariosDemo = [
  {
    email: "coordenador@concretiza.local",
    nome: "Carla",
    sobrenome: "Mendes",
    role: "COORDENADOR",
  },
  {
    email: "ana.analista@concretiza.local",
    nome: "Ana",
    sobrenome: "Oliveira",
    role: "ANALISTA",
  },
  {
    email: "bruno.analista@concretiza.local",
    nome: "Bruno",
    sobrenome: "Santos",
    role: "ANALISTA",
  },
  {
    email: "diego.analista@concretiza.local",
    nome: "Diego",
    sobrenome: "Ferreira",
    role: "ANALISTA",
  },
];

/**
 * 20 clientes (compradores). Os 15 primeiros = processos ativos em fases
 * distintas; os 5 últimos = terminal (finalizado / cancelado / reprovada).
 * @type {Array<Record<string, unknown>>}
 */
const propostasDemo = [
  // —— 15 processos ativos ——
  {
    seq: 1,
    fase: "ENTRADA",
    agingDias: 0,
    prioridade: "NORMAL",
    modalidade: "SBPE",
    analistaKey: null,
    sla: "ok",
    comprador: { nome: "Amanda Ribeiro Costa", cpf: "52998224725" },
    cidade: "São Paulo",
    uf: "SP",
    valorFin: 320000,
    despachante: "Bruno",
    bloqueios: [],
  },
  {
    seq: 2,
    fase: "ENTRADA",
    agingDias: 1,
    prioridade: "ALTA",
    modalidade: "FGTS",
    analistaKey: "ana",
    sla: "ok",
    comprador: { nome: "Carlos Eduardo Mendes", cpf: "39053344705" },
    cidade: "Guarulhos",
    uf: "SP",
    valorFin: 210000,
    despachante: "Patricia",
    bloqueios: [
      {
        dep: "CLIENTE",
        titulo: "Enviar comprovante de renda atualizado",
        diasAberto: 1,
      },
    ],
  },
  {
    seq: 3,
    fase: "ANALISE",
    agingDias: 2,
    prioridade: "NORMAL",
    modalidade: "SBPE",
    analistaKey: "ana",
    sla: "ok",
    comprador: { nome: "Fernanda Lima Souza", cpf: "15350946078" },
    cidade: "Campinas",
    uf: "SP",
    valorFin: 450000,
    despachante: "Bruno",
    bloqueios: [
      {
        dep: "DESPACHANTE",
        titulo: "Aguardando matrícula atualizada",
        diasAberto: 2,
      },
    ],
  },
  {
    seq: 4,
    fase: "ANALISE",
    agingDias: 4,
    prioridade: "URGENTE",
    modalidade: "PRO_COTISTA",
    analistaKey: "bruno",
    sla: "estourado",
    comprador: { nome: "Gabriel Nogueira Alves", cpf: "88641577953" },
    cidade: "Osasco",
    uf: "SP",
    valorFin: 280000,
    despachante: "Patricia",
    bloqueios: [
      {
        dep: "CLIENTE",
        titulo: "CNH vencida — enviar documento válido",
        diasAberto: 3,
      },
      {
        dep: "ANALISTA",
        titulo: "Revisão EN QA da documentação do vendedor",
        diasAberto: 1,
      },
    ],
    movimentacoes: [
      { d: 28, h: 9, de: null, para: "ENTRADA", obs: "Criação da proposta" },
      { d: 28, h: 11, de: "ENTRADA", para: "ENTRADA", obs: "Avaliação de risco" },
      { d: 28, h: 15, de: "ENTRADA", para: "ENTRADA", obs: "Avaliação da operação" },
      { d: 22, h: 10, de: "ENTRADA", para: "ANALISE", obs: "Início da análise documental" },
      { d: 18, h: 14, de: "ANALISE", para: "ANALISE", obs: "Solicitação de documentos ao cliente" },
      { d: 12, h: 9, de: "ANALISE", para: "ANALISE", obs: "Retorno parcial da documentação" },
      { d: 7, h: 16, de: "ANALISE", para: "ANALISE", obs: "Bloqueio aberto: CNH vencida" },
      { d: 4, h: 11, de: "ANALISE", para: "ANALISE", obs: "Revisão EN QA da documentação do vendedor" },
    ],
  },
  {
    seq: 5,
    fase: "ANALISE",
    agingDias: 1,
    prioridade: "NORMAL",
    modalidade: "SBPE",
    analistaKey: "diego",
    sla: "ok",
    comprador: { nome: "Helena Martins Rocha", cpf: "23100299900" },
    cidade: "Santo André",
    uf: "SP",
    valorFin: 390000,
    despachante: "Bruno",
    bloqueios: [],
  },
  {
    seq: 6,
    fase: "RESTRICAO",
    agingDias: 5,
    prioridade: "ALTA",
    modalidade: "FGTS",
    analistaKey: "bruno",
    sla: "estourado",
    comprador: { nome: "Igor Batista Pereira", cpf: "07427511090" },
    cidade: "São Bernardo do Campo",
    uf: "SP",
    valorFin: 195000,
    despachante: "Patricia",
    bloqueios: [
      {
        dep: "BANCO_AGENCIA",
        titulo: "Aguardando liberação de restrição cadastral",
        diasAberto: 5,
      },
    ],
    movimentacoes: [
      { d: 35, h: 10, de: null, para: "ENTRADA", obs: "Criação da proposta" },
      { d: 35, h: 14, de: "ENTRADA", para: "ENTRADA", obs: "Avaliação de risco" },
      { d: 30, h: 9, de: "ENTRADA", para: "ANALISE", obs: "Início da análise" },
      { d: 24, h: 11, de: "ANALISE", para: "ANALISE", obs: "Consulta restritiva no SCR" },
      { d: 18, h: 15, de: "ANALISE", para: "RESTRICAO", obs: "Identificação de restrição cadastral" },
      { d: 12, h: 10, de: "RESTRICAO", para: "RESTRICAO", obs: "Envio ao cliente para sanar restrição" },
      { d: 8, h: 16, de: "RESTRICAO", para: "RESTRICAO", obs: "Retorno incompleto do cliente" },
      { d: 5, h: 9, de: "RESTRICAO", para: "RESTRICAO", obs: "Aguardando liberação de restrição cadastral" },
    ],
  },
  {
    seq: 7,
    fase: "ENGENHARIA",
    agingDias: 8,
    prioridade: "NORMAL",
    modalidade: "SBPE",
    analistaKey: "ana",
    sla: "ok",
    comprador: { nome: "Juliana Castro Freitas", cpf: "61289435016" },
    cidade: "Ribeirão Preto",
    uf: "SP",
    valorFin: 520000,
    despachante: "Bruno",
    bloqueios: [
      {
        dep: "ENGENHARIA",
        titulo: "Laudo de engenharia pendente (OS Caixa)",
        diasAberto: 6,
      },
    ],
    movimentacoes: [
      { d: 48, h: 9, de: null, para: "ENTRADA", obs: "Criação da proposta" },
      { d: 48, h: 11, de: "ENTRADA", para: "ENTRADA", obs: "Avaliação de risco" },
      { d: 48, h: 15, de: "ENTRADA", para: "ENTRADA", obs: "Avaliação da operação" },
      { d: 42, h: 10, de: "ENTRADA", para: "ANALISE", obs: "Início da análise documental" },
      { d: 36, h: 14, de: "ANALISE", para: "ANALISE", obs: "Validação da proposta" },
      { d: 30, h: 9, de: "ANALISE", para: "ENGENHARIA", obs: "Início da avaliação do imóvel" },
      { d: 24, h: 11, de: "ENGENHARIA", para: "ENGENHARIA", obs: "Avaliação do imóvel" },
      { d: 16, h: 16, de: "ENGENHARIA", para: "ENGENHARIA", obs: "OS Caixa aberta para laudo" },
      { d: 8, h: 10, de: "ENGENHARIA", para: "ENGENHARIA", obs: "Laudo de engenharia pendente (OS Caixa)" },
    ],
  },
  {
    seq: 8,
    fase: "ENGENHARIA",
    agingDias: 3,
    prioridade: "NORMAL",
    modalidade: "OUTRO",
    analistaKey: "diego",
    sla: "ok",
    comprador: { nome: "Lucas Henrique Vieira", cpf: "04897563022" },
    cidade: "Sorocaba",
    uf: "SP",
    valorFin: 340000,
    despachante: "Patricia",
    bloqueios: [
      {
        dep: "ENGENHARIA",
        titulo: "Vistoria agendada — aguardando retorno",
        diasAberto: 2,
      },
      {
        dep: "DESPACHANTE",
        titulo: "Complementar plantas do imóvel",
        diasAberto: 1,
      },
    ],
  },
  {
    seq: 9,
    fase: "DEBITO_FGTS",
    agingDias: 4,
    prioridade: "ALTA",
    modalidade: "FGTS",
    analistaKey: "bruno",
    sla: "estourado",
    comprador: { nome: "Mariana Duarte Lopes", cpf: "78512694039" },
    cidade: "Jundiaí",
    uf: "SP",
    valorFin: 265000,
    despachante: "Bruno",
    bloqueios: [
      {
        dep: "CLIENTE",
        titulo: "Autorização de débito FGTS não assinada",
        diasAberto: 4,
      },
    ],
    movimentacoes: [
      { d: 40, h: 9, de: null, para: "ENTRADA", obs: "Criação da proposta" },
      { d: 39, h: 14, de: "ENTRADA", para: "ENTRADA", obs: "Avaliação da operação" },
      { d: 34, h: 10, de: "ENTRADA", para: "ANALISE", obs: "Início da análise" },
      { d: 28, h: 11, de: "ANALISE", para: "ENGENHARIA", obs: "Início da avaliação do imóvel" },
      { d: 22, h: 15, de: "ENGENHARIA", para: "ENGENHARIA", obs: "Avaliação do imóvel" },
      { d: 18, h: 9, de: "ENGENHARIA", para: "ENGENHARIA", obs: "Conclusão da avaliação do imóvel" },
      { d: 12, h: 10, de: "ENGENHARIA", para: "DEBITO_FGTS", obs: "Solicitação de débito FGTS" },
      { d: 8, h: 16, de: "DEBITO_FGTS", para: "DEBITO_FGTS", obs: "Envio da autorização ao cliente" },
      { d: 4, h: 11, de: "DEBITO_FGTS", para: "DEBITO_FGTS", obs: "Autorização de débito FGTS não assinada" },
    ],
  },
  {
    seq: 10,
    fase: "CONFORMIDADE",
    agingDias: 2,
    prioridade: "NORMAL",
    modalidade: "SBPE",
    analistaKey: "ana",
    sla: "ok",
    comprador: { nome: "Nicolas Azevedo Pinto", cpf: "36984125047" },
    cidade: "São Paulo",
    uf: "SP",
    valorFin: 610000,
    despachante: "Patricia",
    bloqueios: [
      {
        dep: "ANALISTA",
        titulo: "Checklist: validar IPTU e habite-se",
        diasAberto: 1,
      },
    ],
    movimentacoes: [
      { d: 49, h: 9, de: null, para: "ENTRADA", obs: "Criação da proposta" },
      { d: 49, h: 11, de: "ENTRADA", para: "ENTRADA", obs: "Avaliação de risco" },
      { d: 49, h: 15, de: "ENTRADA", para: "ENTRADA", obs: "Avaliação da operação" },
      { d: 43, h: 10, de: "ENTRADA", para: "ANALISE", obs: "Início da análise documental" },
      { d: 37, h: 14, de: "ANALISE", para: "ENGENHARIA", obs: "Início da avaliação do imóvel" },
      { d: 31, h: 9, de: "ENGENHARIA", para: "ENGENHARIA", obs: "Avaliação do imóvel" },
      { d: 27, h: 16, de: "ENGENHARIA", para: "ENGENHARIA", obs: "Conclusão da avaliação do imóvel" },
      { d: 20, h: 10, de: "ENGENHARIA", para: "CONFORMIDADE", obs: "Envio da conformidade" },
      { d: 14, h: 11, de: "CONFORMIDADE", para: "CONFORMIDADE", obs: "Validação da proposta" },
      { d: 8, h: 15, de: "CONFORMIDADE", para: "CONFORMIDADE", obs: "Pendência de IPTU aberta" },
      { d: 2, h: 9, de: "CONFORMIDADE", para: "CONFORMIDADE", obs: "Checklist: validar IPTU e habite-se" },
    ],
  },
  {
    seq: 11,
    fase: "CONFORMIDADE",
    agingDias: 6,
    prioridade: "URGENTE",
    modalidade: "PRO_COTISTA",
    analistaKey: "diego",
    sla: "estourado",
    comprador: { nome: "Olivia Fernandes Dias", cpf: "95147386058" },
    cidade: "Barueri",
    uf: "SP",
    valorFin: 475000,
    despachante: "Bruno",
    bloqueios: [
      {
        dep: "CLIENTE",
        titulo: "Certidão de estado civil divergente",
        diasAberto: 5,
      },
      {
        dep: "DESPACHANTE",
        titulo: "Retificar dados do vendedor no dossiê",
        diasAberto: 3,
      },
    ],
    movimentacoes: [
      { d: 55, h: 9, de: null, para: "ENTRADA", obs: "Criação da proposta" },
      { d: 54, h: 14, de: "ENTRADA", para: "ENTRADA", obs: "Avaliação de risco" },
      { d: 50, h: 10, de: "ENTRADA", para: "ANALISE", obs: "Início da análise" },
      { d: 44, h: 11, de: "ANALISE", para: "ANALISE", obs: "Solicitação de certidões" },
      { d: 38, h: 15, de: "ANALISE", para: "ENGENHARIA", obs: "Início da avaliação do imóvel" },
      { d: 32, h: 9, de: "ENGENHARIA", para: "ENGENHARIA", obs: "Conclusão da avaliação do imóvel" },
      { d: 26, h: 10, de: "ENGENHARIA", para: "CONFORMIDADE", obs: "Envio da conformidade" },
      { d: 20, h: 14, de: "CONFORMIDADE", para: "CONFORMIDADE", obs: "Validação da proposta" },
      { d: 14, h: 9, de: "CONFORMIDADE", para: "CONFORMIDADE", obs: "Retorno da conformidade com pendências" },
      { d: 10, h: 16, de: "CONFORMIDADE", para: "CONFORMIDADE", obs: "Certidão de estado civil divergente" },
      { d: 6, h: 11, de: "CONFORMIDADE", para: "CONFORMIDADE", obs: "Retificar dados do vendedor no dossiê" },
    ],
  },
  {
    seq: 12,
    fase: "DECISAO",
    agingDias: 1,
    prioridade: "NORMAL",
    modalidade: "SBPE",
    analistaKey: "ana",
    sla: "ok",
    comprador: { nome: "Pedro Henrique Barbosa", cpf: "14725836901" },
    cidade: "Santos",
    uf: "SP",
    valorFin: 355000,
    despachante: "Patricia",
    bloqueios: [
      {
        dep: "BANCO_AGENCIA",
        titulo: "Aguardando decisão da agência Caixa",
        diasAberto: 1,
      },
    ],
    movimentacoes: [
      { d: 44, h: 9, de: null, para: "ENTRADA", obs: "Criação da proposta" },
      { d: 44, h: 14, de: "ENTRADA", para: "ENTRADA", obs: "Avaliação da operação" },
      { d: 38, h: 10, de: "ENTRADA", para: "ANALISE", obs: "Início da análise documental" },
      { d: 32, h: 11, de: "ANALISE", para: "ENGENHARIA", obs: "Início da avaliação do imóvel" },
      { d: 26, h: 15, de: "ENGENHARIA", para: "ENGENHARIA", obs: "Avaliação do imóvel" },
      { d: 22, h: 9, de: "ENGENHARIA", para: "ENGENHARIA", obs: "Conclusão da avaliação do imóvel" },
      { d: 16, h: 10, de: "ENGENHARIA", para: "CONFORMIDADE", obs: "Envio da conformidade" },
      { d: 10, h: 14, de: "CONFORMIDADE", para: "CONFORMIDADE", obs: "Validação da proposta" },
      { d: 6, h: 11, de: "CONFORMIDADE", para: "CONFORMIDADE", obs: "Retorno da conformidade" },
      { d: 3, h: 9, de: "CONFORMIDADE", para: "DECISAO", obs: "Encaminhado para decisão da agência" },
      { d: 1, h: 16, de: "DECISAO", para: "DECISAO", obs: "Aguardando decisão da agência Caixa" },
    ],
  },
  {
    seq: 13,
    fase: "EM_CARTORIO",
    agingDias: 7,
    prioridade: "NORMAL",
    modalidade: "SBPE",
    analistaKey: "bruno",
    sla: "ok",
    comprador: { nome: "Renata Souza Almeida", cpf: "25836914712" },
    cidade: "São José dos Campos",
    uf: "SP",
    valorFin: 420000,
    despachante: "Bruno",
    bloqueios: [
      {
        dep: "CARTORIO",
        titulo: "Aguardando registro da escritura",
        diasAberto: 7,
      },
    ],
    movimentacoes: [
      { d: 60, h: 9, de: null, para: "ENTRADA", obs: "Criação da proposta" },
      { d: 60, h: 11, de: "ENTRADA", para: "ENTRADA", obs: "Avaliação de risco" },
      { d: 55, h: 10, de: "ENTRADA", para: "ANALISE", obs: "Início da análise" },
      { d: 48, h: 14, de: "ANALISE", para: "ENGENHARIA", obs: "Início da avaliação do imóvel" },
      { d: 42, h: 9, de: "ENGENHARIA", para: "ENGENHARIA", obs: "Avaliação do imóvel" },
      { d: 38, h: 16, de: "ENGENHARIA", para: "ENGENHARIA", obs: "Conclusão da avaliação do imóvel" },
      { d: 32, h: 10, de: "ENGENHARIA", para: "CONFORMIDADE", obs: "Envio da conformidade" },
      { d: 26, h: 11, de: "CONFORMIDADE", para: "CONFORMIDADE", obs: "Validação da proposta" },
      { d: 22, h: 15, de: "CONFORMIDADE", para: "CONFORMIDADE", obs: "Retorno da conformidade" },
      { d: 18, h: 9, de: "CONFORMIDADE", para: "DECISAO", obs: "Aprovação da operação" },
      { d: 14, h: 10, de: "DECISAO", para: "EM_CARTORIO", obs: "Envio ao cartório" },
      { d: 7, h: 14, de: "EM_CARTORIO", para: "EM_CARTORIO", obs: "Aguardando registro da escritura" },
    ],
  },
  {
    seq: 14,
    fase: "EM_CARTORIO",
    agingDias: 3,
    prioridade: "ALTA",
    modalidade: "FGTS",
    analistaKey: "diego",
    sla: "ok",
    comprador: { nome: "Thiago Moreira Campos", cpf: "36914725823" },
    cidade: "Mogi das Cruzes",
    uf: "SP",
    valorFin: 298000,
    despachante: "Patricia",
    bloqueios: [
      {
        dep: "CARTORIO",
        titulo: "Pendência de firma reconhecida",
        diasAberto: 2,
      },
      {
        dep: "CLIENTE",
        titulo: "Comparecer para assinatura",
        diasAberto: 2,
      },
    ],
    movimentacoes: [
      { d: 50, h: 9, de: null, para: "ENTRADA", obs: "Criação da proposta" },
      { d: 49, h: 14, de: "ENTRADA", para: "ENTRADA", obs: "Avaliação de risco" },
      { d: 45, h: 10, de: "ENTRADA", para: "ANALISE", obs: "Início da análise documental" },
      { d: 40, h: 11, de: "ANALISE", para: "ENGENHARIA", obs: "Início da avaliação do imóvel" },
      { d: 35, h: 15, de: "ENGENHARIA", para: "ENGENHARIA", obs: "Conclusão da avaliação do imóvel" },
      { d: 30, h: 9, de: "ENGENHARIA", para: "DEBITO_FGTS", obs: "Débito FGTS autorizado" },
      { d: 24, h: 10, de: "DEBITO_FGTS", para: "CONFORMIDADE", obs: "Envio da conformidade" },
      { d: 18, h: 14, de: "CONFORMIDADE", para: "CONFORMIDADE", obs: "Validação da proposta" },
      { d: 14, h: 11, de: "CONFORMIDADE", para: "CONFORMIDADE", obs: "Retorno da conformidade" },
      { d: 10, h: 9, de: "CONFORMIDADE", para: "DECISAO", obs: "Aprovação da operação" },
      { d: 6, h: 10, de: "DECISAO", para: "EM_CARTORIO", obs: "Envio ao cartório" },
      { d: 3, h: 16, de: "EM_CARTORIO", para: "EM_CARTORIO", obs: "Pendência de firma reconhecida" },
      { d: 3, h: 16, de: "EM_CARTORIO", para: "EM_CARTORIO", obs: "Comparecer para assinatura" },
    ],
  },
  {
    seq: 15,
    fase: "FORMALIZACAO",
    agingDias: 2,
    prioridade: "NORMAL",
    modalidade: "SBPE",
    analistaKey: "ana",
    sla: "ok",
    comprador: { nome: "Vanessa Cristina Melo", cpf: "47025836934" },
    cidade: "Piracicaba",
    uf: "SP",
    valorFin: 380000,
    despachante: "Bruno",
    bloqueios: [
      {
        dep: "BANCO_AGENCIA",
        titulo: "Contrato em formalização na agência",
        diasAberto: 2,
      },
    ],
  },
  // —— 5 terminais (completam 20 clientes) ——
  {
    seq: 16,
    fase: "FINALIZADO",
    agingDias: 12,
    prioridade: "NORMAL",
    modalidade: "SBPE",
    analistaKey: "ana",
    sla: null,
    comprador: { nome: "William Teixeira Ramos", cpf: "58136947045" },
    cidade: "São Paulo",
    uf: "SP",
    valorFin: 410000,
    despachante: "Patricia",
    bloqueios: [],
    finalizadoDiasAgo: 5,
    movimentacoes: [
      { d: 70, h: 9, de: null, para: "ENTRADA", obs: "Criação da proposta" },
      { d: 70, h: 11, de: "ENTRADA", para: "ENTRADA", obs: "Avaliação de risco" },
      { d: 70, h: 15, de: "ENTRADA", para: "ENTRADA", obs: "Avaliação da operação" },
      { d: 64, h: 10, de: "ENTRADA", para: "ANALISE", obs: "Início da análise documental" },
      { d: 56, h: 14, de: "ANALISE", para: "ENGENHARIA", obs: "Início da avaliação do imóvel" },
      { d: 50, h: 9, de: "ENGENHARIA", para: "ENGENHARIA", obs: "Avaliação do imóvel" },
      { d: 46, h: 16, de: "ENGENHARIA", para: "ENGENHARIA", obs: "Conclusão da avaliação do imóvel" },
      { d: 40, h: 10, de: "ENGENHARIA", para: "CONFORMIDADE", obs: "Envio da conformidade" },
      { d: 34, h: 11, de: "CONFORMIDADE", para: "CONFORMIDADE", obs: "Validação da proposta" },
      { d: 30, h: 15, de: "CONFORMIDADE", para: "CONFORMIDADE", obs: "Retorno da conformidade" },
      { d: 24, h: 9, de: "CONFORMIDADE", para: "DECISAO", obs: "Aprovação da operação" },
      { d: 18, h: 10, de: "DECISAO", para: "EM_CARTORIO", obs: "Envio ao cartório" },
      { d: 12, h: 14, de: "EM_CARTORIO", para: "FORMALIZACAO", obs: "Escritura registrada" },
      { d: 5, h: 11, de: "FORMALIZACAO", para: "FINALIZADO", obs: "Processo finalizado — liberação do crédito" },
    ],
  },
  {
    seq: 17,
    fase: "FINALIZADO",
    agingDias: 20,
    prioridade: "NORMAL",
    modalidade: "FGTS",
    analistaKey: "bruno",
    sla: null,
    comprador: { nome: "Yasmin Oliveira Cruz", cpf: "69247058156" },
    cidade: "Campinas",
    uf: "SP",
    valorFin: 275000,
    despachante: "Bruno",
    bloqueios: [],
    finalizadoDiasAgo: 10,
  },
  {
    seq: 18,
    fase: "FINALIZADO",
    agingDias: 8,
    prioridade: "ALTA",
    modalidade: "PRO_COTISTA",
    analistaKey: "diego",
    sla: null,
    comprador: { nome: "André Luiz Cardoso", cpf: "70358169267" },
    cidade: "Guarulhos",
    uf: "SP",
    valorFin: 505000,
    despachante: "Patricia",
    bloqueios: [],
    finalizadoDiasAgo: 2,
  },
  {
    seq: 19,
    fase: "CANCELADO",
    agingDias: 15,
    prioridade: "BAIXA",
    modalidade: "SBPE",
    analistaKey: "bruno",
    sla: null,
    comprador: { nome: "Beatriz Nunes Silveira", cpf: "81469270378" },
    cidade: "Osasco",
    uf: "SP",
    valorFin: 230000,
    despachante: "Bruno",
    bloqueios: [],
    motivoCancelamento: "Cliente desistiu da compra",
  },
  {
    seq: 20,
    fase: "REPROVADA",
    agingDias: 9,
    prioridade: "NORMAL",
    modalidade: "FGTS",
    analistaKey: "ana",
    sla: null,
    comprador: { nome: "Daniela Prado Monteiro", cpf: "92570381489" },
    cidade: "Santo André",
    uf: "SP",
    valorFin: 185000,
    despachante: "Patricia",
    bloqueios: [],
    motivoReprovacao: "Restrição cadastral não sanável no prazo",
  },
];

async function ensureUsuarios(senhaHash) {
  const map = {};
  const grupos = await prisma.grupoUsuario.findMany({
    where: { sistema: true },
    select: { id: true, role: true, codigo: true },
  });
  const byRole = Object.fromEntries(grupos.map((g) => [g.role, g.id]));

  for (const u of usuariosDemo) {
    const row = await prisma.usuario.upsert({
      where: { email: u.email },
      update: {
        nome: u.nome,
        sobrenome: u.sobrenome,
        role: u.role,
        grupoId: byRole[u.role] ?? null,
        ativo: true,
        senhaHash,
      },
      create: {
        email: u.email,
        nome: u.nome,
        sobrenome: u.sobrenome,
        role: u.role,
        grupoId: byRole[u.role] ?? null,
        ativo: true,
        senhaHash,
        twoFactorEnabled: false,
      },
    });
    map[u.email] = row;
  }
  const admin = await prisma.usuario.findFirst({
    where: { email: "admin@concretiza.local" },
  });
  if (admin) map["admin@concretiza.local"] = admin;
  return map;
}

function analistaIdFor(key, users) {
  if (!key) return null;
  const email =
    key === "ana"
      ? "ana.analista@concretiza.local"
      : key === "bruno"
        ? "bruno.analista@concretiza.local"
        : "diego.analista@concretiza.local";
  return users[email]?.id ?? null;
}

async function limparDemoAnterior() {
  const existentes = await prisma.proposta.findMany({
    where: { numeroProcessoInterno: { startsWith: DEMO_PREFIX } },
    select: { id: true },
  });
  if (existentes.length === 0) return 0;
  const ids = existentes.map((p) => p.id);
  await prisma.bloqueioProcesso.deleteMany({ where: { propostaId: { in: ids } } });
  await prisma.checklistResposta.deleteMany({ where: { propostaId: { in: ids } } });
  await prisma.historicoProposta.deleteMany({ where: { propostaId: { in: ids } } });
  await prisma.compromisso.deleteMany({ where: { propostaId: { in: ids } } });
  await prisma.proposta.deleteMany({ where: { id: { in: ids } } });
  return ids.length;
}

async function main() {
  const deps = await prisma.tipoDependencia.findMany({ where: { ativo: true } });
  if (deps.length === 0) {
    throw new Error("Rode antes: npx prisma db seed (tipos de dependência ausentes)");
  }

  const gruposCount = await prisma.grupoUsuario.count();
  if (gruposCount === 0) {
    throw new Error("Rode antes: npx prisma db seed (grupos de usuário ausentes)");
  }

  const depByCodigo = Object.fromEntries(deps.map((d) => [d.codigo, d]));

  const templates = await prisma.checklistTemplateItem.findMany({
    where: { ativo: true },
    select: { id: true },
  });

  const senhaHash = await hash("Admin@123", 12);
  const users = await ensureUsuarios(senhaHash);
  const abertoPorId =
    users["coordenador@concretiza.local"]?.id ??
    users["admin@concretiza.local"]?.id;

  const removidas = await limparDemoAnterior();
  console.log(`Demo anterior removida: ${removidas} proposta(s)`);

  let criadas = 0;
  let bloqueios = 0;

  for (const item of propostasDemo) {
    const movs = item.movimentacoes ?? null;
    const dataEntrada = movs?.length
      ? daysAgo(Math.max(...movs.map((m) => m.d)), movs.find((m) => m.d === Math.max(...movs.map((x) => x.d)))?.h ?? 9)
      : daysAgo(item.agingDias + 3);
    const inicioFase = daysAgo(item.agingDias);
    let prazoSlaAte = null;
    if (item.sla === "ok") prazoSlaAte = hoursFromNow(24 + item.seq);
    if (item.sla === "estourado") prazoSlaAte = hoursAgo(12 + item.seq);

    const processo = `${DEMO_PREFIX}${String(item.seq).padStart(3, "0")}`;
    const caixa = `2026.DEMO-${String(item.seq).padStart(3, "0")}`;

    const proposta = await prisma.proposta.create({
      data: {
        numeroProcessoInterno: processo,
        numeroPropostaCaixa: caixa,
        despachanteNome: item.despachante,
        modalidade: item.modalidade,
        faseAtual: item.fase,
        origem: item.seq % 3 === 0 ? "EXCEL" : "MANUAL",
        prioridade: item.prioridade,
        dataEntrada,
        prazoSlaAte,
        motivoCancelamento: item.motivoCancelamento ?? null,
        motivoReprovacao: item.motivoReprovacao ?? null,
        compradorNome: item.comprador.nome,
        compradorCpf: item.comprador.cpf,
        compradorTelefone: `1199${String(1000000 + item.seq).slice(-7)}`,
        compradorEmail: `cliente${item.seq}@demo.concretiza.local`,
        vendedorNome: `Vendedor Demo ${item.seq}`,
        vendedorCpfCnpj: String(10000000000 + item.seq * 111).slice(0, 11),
        imovelEndereco: `Rua Demo ${item.seq}, ${100 + item.seq}`,
        imovelCidade: item.cidade,
        imovelUf: item.uf,
        valorImovel: Math.round(item.valorFin * 1.25),
        valorFinanciamento: item.valorFin,
        imobiliaria: item.seq % 2 === 0 ? "Imob Horizonte" : "Casa & Cia",
        analistaId: analistaIdFor(item.analistaKey, users),
        createdAt: dataEntrada,
      },
    });

    if (templates.length) {
      await prisma.checklistResposta.createMany({
        data: templates.map((t) => ({
          propostaId: proposta.id,
          templateId: t.id,
          status: item.fase === "FINALIZADO" ? "OK" : "PENDENTE",
        })),
      });
    }

    if (movs?.length) {
      for (const m of movs) {
        await prisma.historicoProposta.create({
          data: {
            propostaId: proposta.id,
            deFase: m.de,
            paraFase: m.para,
            observacao: m.obs,
            usuarioId: abertoPorId,
            createdAt: daysAgo(m.d, m.h ?? 10),
          },
        });
      }
    } else {
      await prisma.historicoProposta.create({
        data: {
          propostaId: proposta.id,
          deFase: null,
          paraFase: "ENTRADA",
          observacao: "Entrada demo (apresentação)",
          usuarioId: abertoPorId,
          createdAt: dataEntrada,
        },
      });

      if (item.fase !== "ENTRADA") {
        await prisma.historicoProposta.create({
          data: {
            propostaId: proposta.id,
            deFase: "ENTRADA",
            paraFase: item.fase,
            observacao: `Avanço demo para ${item.fase}`,
            usuarioId: abertoPorId,
            createdAt:
              item.fase === "FINALIZADO" && item.finalizadoDiasAgo
                ? daysAgo(item.finalizadoDiasAgo)
                : inicioFase,
          },
        });
      }
    }

    const abertos = [];
    for (const b of item.bloqueios) {
      const tipo = depByCodigo[b.dep];
      if (!tipo || !abertoPorId) continue;
      await prisma.bloqueioProcesso.create({
        data: {
          propostaId: proposta.id,
          tipoDependenciaId: tipo.id,
          titulo: b.titulo,
          descricao: `Bloqueio demo (${b.dep}) para composição do dashboard`,
          origem: "MANUAL",
          status: "ABERTO",
          abertoPorId,
          abertoEm: daysAgo(b.diasAberto),
        },
      });
      abertos.push({ label: tipo.label, titulo: b.titulo });
      bloqueios += 1;
    }

    if (abertos.length) {
      const first = abertos[0];
      await prisma.proposta.update({
        where: { id: proposta.id },
        data: { bloqueioResumo: `${first.label}: ${first.titulo}` },
      });
    }

    criadas += 1;
  }

  const ricos = propostasDemo.filter((p) => p.movimentacoes?.length);
  console.log(
    `Seed demo OK: ${criadas} clientes/propostas (${propostasDemo.filter((p) => !["FINALIZADO", "CANCELADO", "REPROVADA"].includes(p.fase)).length} ativos), ${bloqueios} bloqueios abertos.`,
  );
  console.log(`Histórico rico em ${ricos.length} processos:`);
  for (const p of ricos) {
    const proc = `${DEMO_PREFIX}${String(p.seq).padStart(3, "0")}`;
    console.log(`\n=== ${proc} | ${p.comprador.nome} | fase ${p.fase} | ${p.movimentacoes.length} eventos ===`);
    for (const m of p.movimentacoes) {
      const when = daysAgo(m.d, m.h ?? 10);
      const label = when.toLocaleDateString("pt-BR");
      console.log(`  ${label} — ${m.obs}`);
    }
  }
  console.log("\nLogins extras (senha Admin@123):");
  for (const u of usuariosDemo) {
    console.log(`  - ${u.email} (${u.role})`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
