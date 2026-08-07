import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import type { CadastroCliente } from "@/src/modules/propostas/cadastro-cliente";
import { parseCadastroCliente } from "@/src/modules/propostas/cadastro-cliente";

const BLUE = rgb(0.05, 0.28, 0.55);
const ORANGE = rgb(0.93, 0.45, 0.05);
const GRAY = rgb(0.35, 0.35, 0.35);
const BLACK = rgb(0.1, 0.1, 0.1);
const LIGHT = rgb(0.93, 0.95, 0.98);
const LINE = rgb(0.75, 0.78, 0.82);

export type PropostaParaFormulario = {
  compradorNome: string;
  compradorCpf: string;
  compradorTelefone?: string | null;
  compradorEmail?: string | null;
  cadastroCliente?: unknown;
};

function hojeSp(): string {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date());
}

function v(s?: string | null) {
  return (s ?? "").trim();
}

function mark(on: boolean) {
  return on ? "X" : " ";
}

type Ctx = {
  page: PDFPage;
  font: PDFFont;
  bold: PDFFont;
  y: number;
  width: number;
  height: number;
};

function newPage(doc: PDFDocument, font: PDFFont, bold: PDFFont): Ctx {
  const page = doc.addPage([595.28, 841.89]); // A4
  const { width, height } = page.getSize();
  return { page, font, bold, y: height - 40, width, height };
}

function ensureSpace(doc: PDFDocument, ctx: Ctx, need: number): Ctx {
  if (ctx.y - need < 50) {
    drawFooter(ctx);
    return newPage(doc, ctx.font, ctx.bold);
  }
  return ctx;
}

function drawFooter(ctx: Ctx) {
  const { page, font, width } = ctx;
  page.drawLine({
    start: { x: 40, y: 42 },
    end: { x: width - 40, y: 42 },
    thickness: 0.5,
    color: LINE,
  });
  page.drawText("Alô CAIXA 4004 0 104 · SAC 0800 726 0101 · Ouvidoria 0800 725 7474 · caixa.gov.br", {
    x: 40,
    y: 28,
    size: 7,
    font,
    color: GRAY,
  });
}

function sectionTitle(ctx: Ctx, title: string) {
  ctx.page.drawRectangle({
    x: 40,
    y: ctx.y - 16,
    width: ctx.width - 80,
    height: 18,
    color: BLUE,
  });
  ctx.page.drawText(title.toUpperCase(), {
    x: 46,
    y: ctx.y - 12,
    size: 9,
    font: ctx.bold,
    color: rgb(1, 1, 1),
  });
  ctx.y -= 28;
}

function fieldRow(ctx: Ctx, label: string, value: string, opts?: { full?: boolean }) {
  const labelW = opts?.full ? 160 : 140;
  const maxW = ctx.width - 80 - labelW;
  ctx.page.drawText(label, { x: 46, y: ctx.y, size: 8, font: ctx.font, color: GRAY });
  const text = value || "—";
  const clipped = text.length > 90 ? `${text.slice(0, 87)}...` : text;
  ctx.page.drawText(clipped, {
    x: 46 + labelW,
    y: ctx.y,
    size: 9,
    font: ctx.bold,
    color: BLACK,
    maxWidth: maxW,
  });
  ctx.y -= 14;
  ctx.page.drawLine({
    start: { x: 40, y: ctx.y + 6 },
    end: { x: ctx.width - 40, y: ctx.y + 6 },
    thickness: 0.3,
    color: LINE,
  });
  ctx.y -= 2;
}

function twoCol(ctx: Ctx, a: [string, string], b: [string, string]) {
  const mid = ctx.width / 2;
  ctx.page.drawText(a[0], { x: 46, y: ctx.y, size: 8, font: ctx.font, color: GRAY });
  ctx.page.drawText(a[1] || "—", { x: 46, y: ctx.y - 12, size: 9, font: ctx.bold, color: BLACK });
  ctx.page.drawText(b[0], { x: mid + 6, y: ctx.y, size: 8, font: ctx.font, color: GRAY });
  ctx.page.drawText(b[1] || "—", { x: mid + 6, y: ctx.y - 12, size: 9, font: ctx.bold, color: BLACK });
  ctx.y -= 28;
}

function checkboxLine(ctx: Ctx, label: string, checked: boolean, extra?: string) {
  ctx.page.drawRectangle({
    x: 46,
    y: ctx.y - 1,
    width: 10,
    height: 10,
    borderColor: BLUE,
    borderWidth: 1,
    color: checked ? BLUE : rgb(1, 1, 1),
  });
  if (checked) {
    ctx.page.drawText("X", { x: 48, y: ctx.y, size: 8, font: ctx.bold, color: rgb(1, 1, 1) });
  }
  ctx.page.drawText(label, { x: 62, y: ctx.y, size: 9, font: ctx.font, color: BLACK });
  if (extra) {
    ctx.page.drawText(extra, { x: 320, y: ctx.y, size: 9, font: ctx.bold, color: BLUE });
  }
  ctx.y -= 16;
}

function wrapText(
  ctx: Ctx,
  text: string,
  size: number,
  opts?: { bold?: boolean; indent?: number; color?: ReturnType<typeof rgb> },
) {
  const font = opts?.bold ? ctx.bold : ctx.font;
  const indent = opts?.indent ?? 46;
  const maxW = ctx.width - indent - 40;
  const words = text.split(/\s+/);
  let line = "";
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (font.widthOfTextAtSize(test, size) > maxW) {
      ctx.page.drawText(line, {
        x: indent,
        y: ctx.y,
        size,
        font,
        color: opts?.color ?? BLACK,
      });
      ctx.y -= size + 3;
      line = w;
    } else {
      line = test;
    }
  }
  if (line) {
    ctx.page.drawText(line, {
      x: indent,
      y: ctx.y,
      size,
      font,
      color: opts?.color ?? BLACK,
    });
    ctx.y -= size + 3;
  }
}

function drawHeader(ctx: Ctx) {
  ctx.page.drawRectangle({
    x: 40,
    y: ctx.y - 36,
    width: ctx.width - 80,
    height: 44,
    color: LIGHT,
  });
  ctx.page.drawRectangle({
    x: 40,
    y: ctx.y - 36,
    width: 6,
    height: 44,
    color: ORANGE,
  });
  ctx.page.drawText("CAIXA", {
    x: 56,
    y: ctx.y - 8,
    size: 16,
    font: ctx.bold,
    color: BLUE,
  });
  ctx.page.drawText("Cadastro de Clientes", {
    x: 56,
    y: ctx.y - 24,
    size: 11,
    font: ctx.bold,
    color: BLACK,
  });
  ctx.page.drawText("Formulário de Impressão", {
    x: 200,
    y: ctx.y - 24,
    size: 9,
    font: ctx.font,
    color: GRAY,
  });
  ctx.y -= 56;
}

export async function gerarFormularioCadastroPdf(
  proposta: PropostaParaFormulario,
): Promise<Uint8Array> {
  const c = parseCadastroCliente(proposta.cadastroCliente);
  const dataGeracao = hojeSp();
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  let ctx = newPage(doc, font, bold);
  drawHeader(ctx);

  sectionTitle(ctx, "Dados de Identificação");
  fieldRow(ctx, "Protocolo:", v(c.protocolo));
  fieldRow(ctx, "Código do Correspondente:", v(c.codigoCorrespondente));

  sectionTitle(ctx, "Declaração de Propósitos");
  checkboxLine(ctx, "Movimentação de Conta de Depósito / Poupança", Boolean(c.propMovimentacaoConta));
  checkboxLine(ctx, "Empréstimos / Financiamentos", Boolean(c.propEmprestimos));
  checkboxLine(
    ctx,
    "Financiamento Habitacional",
    c.propFinanciamentoHabitacional === "SIM",
    c.propFinanciamentoHabitacional
      ? `SIM [${mark(c.propFinanciamentoHabitacional === "SIM")}]  NÃO [${mark(c.propFinanciamentoHabitacional === "NAO")}]`
      : "SIM [ ]  NÃO [ ]",
  );
  checkboxLine(ctx, "Investimentos", Boolean(c.propInvestimentos));
  checkboxLine(ctx, "Cartão de Crédito", Boolean(c.propCartaoCredito));
  checkboxLine(ctx, "Seguros / Previdência Privada / Capitalização / Consórcios", Boolean(c.propSeguros));
  checkboxLine(ctx, "Operações Internacionais / Câmbio", Boolean(c.propOperacoesInternacionais));

  ctx = ensureSpace(doc, ctx, 220);
  sectionTitle(ctx, "Dados Cadastrais");
  fieldRow(ctx, "CPF do Cliente:", proposta.compradorCpf);
  fieldRow(ctx, "Nome Completo do Cliente:", proposta.compradorNome);
  fieldRow(ctx, "Nome Reduzido do Cliente:", v(c.nomeReduzido) || proposta.compradorNome);
  twoCol(ctx, ["Data de Nascimento:", v(c.dataNascimento)], ["Sexo:", v(c.sexo)]);
  fieldRow(ctx, "Naturalidade:", v(c.naturalidade));
  fieldRow(ctx, "Nacionalidade:", v(c.nacionalidade));
  fieldRow(ctx, "Nome do Pai:", v(c.nomePai));
  fieldRow(ctx, "Nome da Mãe:", v(c.nomeMae));
  fieldRow(ctx, "Grau de Instrução:", v(c.grauInstrucao));
  fieldRow(ctx, "Tipo de Documento de Identificação:", v(c.docTipo));
  twoCol(ctx, ["Número do Documento:", v(c.docNumero)], ["Órgão Emissor:", v(c.docOrgaoEmissor)]);
  twoCol(ctx, ["Data de Emissão:", v(c.docDataEmissao)], ["Data de Validade:", v(c.docDataValidade)]);
  twoCol(ctx, ["UF:", v(c.docUf)], ["Estado Civil:", v(c.estadoCivil)]);
  twoCol(ctx, ["PIS/NIS:", v(c.pisNis)], ["Tipo de Ocupação:", v(c.tipoOcupacao)]);
  fieldRow(ctx, "Data 1º Habilitação:", v(c.dataPrimeiraHabilitacao));

  ctx = ensureSpace(doc, ctx, 200);
  sectionTitle(ctx, "Endereço");
  twoCol(ctx, ["CEP:", v(c.enderecoCep)], ["UF:", v(c.enderecoUf)]);
  fieldRow(ctx, "Logradouro:", v(c.enderecoLogradouro));
  twoCol(ctx, ["Número:", v(c.enderecoNumero)], ["Complemento:", v(c.enderecoComplemento)]);
  twoCol(ctx, ["Bairro:", v(c.enderecoBairro)], ["Município:", v(c.enderecoMunicipio)]);
  twoCol(ctx, ["Tipo de Imóvel:", v(c.enderecoTipoImovel)], ["Ocupação do Imóvel:", v(c.ocupacaoImovel)]);
  fieldRow(ctx, "Comprovante de Residência:", v(c.comprovanteResidencia));

  sectionTitle(ctx, "Meios de Comunicação");
  fieldRow(ctx, "Telefone Celular:", v(proposta.compradorTelefone));
  fieldRow(ctx, "E-mail:", v(proposta.compradorEmail));

  ctx = ensureSpace(doc, ctx, 200);
  sectionTitle(ctx, "Rendas Comprovadas");
  twoCol(
    ctx,
    ["Tipo / Jurídica:", v(c.fontePagadoraTipo)],
    ["CNPJ:", v(c.fontePagadoraCnpj)],
  );
  fieldRow(ctx, "Nome da Fonte Pagadora:", v(c.fontePagadoraNome));
  fieldRow(ctx, "Ocupação:", v(c.ocupacaoProfissional));
  twoCol(ctx, ["Admissão:", v(c.dataAdmissao)], ["Característica da Renda:", v(c.caracteristicaRenda)]);
  twoCol(ctx, ["Renda Bruta:", v(c.rendaBruta)], ["Renda Líquida:", v(c.rendaLiquida)]);
  fieldRow(ctx, "Documento do Comprovante de Renda:", v(c.documentoComprovanteRenda));
  twoCol(
    ctx,
    ["Imposto de Renda Retido:", v(c.impostoRendaRetido)],
    ["Data Ref. Comprovante:", v(c.dataRefComprovante)],
  );
  twoCol(
    ctx,
    ["Tempo no emprego anterior:", v(c.tempoEmpregoAnterior)],
    ["Ano de desligamento:", v(c.anoDesligamentoAnterior)],
  );

  sectionTitle(ctx, "Rendas Informais");
  fieldRow(ctx, "Observações / detalhes:", v(c.rendasInformais), { full: true });

  sectionTitle(ctx, "Agência de Relacionamento");
  twoCol(ctx, ["UF:", v(c.agenciaUf)], ["Município:", v(c.agenciaMunicipio)]);
  fieldRow(ctx, "Código e Nome das Agências:", v(c.agenciaCodigoNome));

  ctx = ensureSpace(doc, ctx, 320);
  sectionTitle(ctx, "Autorizações e Declarações");
  wrapText(ctx, "Autorizo a CAIXA ECONÔMICA FEDERAL:", 9, { bold: true });
  ctx.y -= 4;
  wrapText(
    ctx,
    "Nos termos das Resoluções CMN nº 3.920/10 e n° 5.037/22:",
    8,
    { bold: true },
  );
  wrapText(
    ctx,
    "- a consultar as informações consolidadas a respeito das operações de crédito e câmbio constantes em meu nome no Sistema de Informações de Créditos - SCR, administrado pelo Banco Central do Brasil, ou dos sistemas que venham a complementá-lo ou a substituí-lo;",
    7.5,
  );
  wrapText(
    ctx,
    "- a fornecer informações sobre as operações de crédito e câmbio por mim realizadas com a CAIXA, no sentido de compor o cadastro do SCR;",
    7.5,
  );
  wrapText(ctx, "- ao arquivamento dos meus dados cadastrais.", 7.5);
  ctx.y -= 4;
  wrapText(ctx, "Respeitadas as disposições legais em vigor:", 8, { bold: true });
  wrapText(
    ctx,
    "- a consulta e arquivamento dos meus dados cadastrais e de idoneidade, nos serviços de proteção ao crédito com as quais a CAIXA mantém convênio firmado e que deles poderá se utilizar.",
    7.5,
  );
  ctx.y -= 4;
  wrapText(ctx, "Estou ciente de que:", 8, { bold: true });
  wrapText(
    ctx,
    "a) o SCR é um cadastro que visa prover o Banco Central do Brasil de informações, para fins de monitoramento do crédito no sistema financeiro e para o exercício de suas atividades de fiscalização, e é utilizado para propiciar o intercâmbio de informações entre instituições financeiras, conforme art. 4º da Resolução CMN nº 5.037/22, sobre o montante de responsabilidades de clientes em operações de crédito e de câmbio;",
    7.5,
  );
  wrapText(
    ctx,
    "b) poderei ter acesso aos dados constantes em meu nome no SCR por meio das Centrais de Atendimento ao Público do Banco Central do Brasil e/ou por meio do endereço http://www.bcb.gov.br;",
    7.5,
  );
  wrapText(
    ctx,
    "c) os pedidos de correção e/ou exclusão quanto às informações constantes do SCR deverão ser dirigidas à instituição responsável pela remessa das informações ao Banco Central do Brasil, por meio de requerimento escrito e fundamentado, ou, quando for o caso, pela respectiva decisão judicial;",
    7.5,
  );
  wrapText(
    ctx,
    "d) o Banco Central do Brasil é autorizado a tornar disponíveis às Instituições que podem consultar o SCR informações consolidadas sobre as minhas operações de crédito e de câmbio, respeitadas as regras estabelecidas pelo próprio BCB.",
    7.5,
  );
  wrapText(
    ctx,
    "e) A utilização e tratamento dos dados pessoais informados neste documento, com a finalidade de avaliação de crédito, estão assegurados pela Lei Nº 13.709/18 (Lei Geral de Proteção de Dados Pessoais - LGPD) e alterações que venham a ocorrer.",
    7.5,
  );
  ctx.y -= 4;
  wrapText(ctx, "Declaro que:", 8, { bold: true });
  wrapText(ctx, "- as informações por mim prestadas sobre renda/faturamento e patrimônio são lícitas;", 7.5);
  wrapText(
    ctx,
    '- tenho ciência da Lei n° 9.613/98 e suas atualizações, que dispõe sobre os crimes de "lavagem" ou ocultação de bens, direitos e valores, e dos arts. 297, 298 e 299 do Código Penal;',
    7.5,
  );
  wrapText(
    ctx,
    "- estou ciente de que a falsidade dos dados declarados configura crime previsto na legislação brasileira, passível de responsabilização civil, criminal e administrativa, podendo implicar na imediata revogação das avaliações de risco de crédito, das operações avaliadas e não contratadas e do vencimento antecipado das operações de crédito vigente vinculadas a tais dados.",
    7.5,
  );
  wrapText(
    ctx,
    "- Não possuo condenação administrativa ou judicial, no âmbito da justiça comum ou do trabalho, estadual ou federal, para os ilícitos de trabalho infantil, trabalho escravo, crime contra o meio ambiente, assédio moral ou sexual, ou racismo.",
    7.5,
  );

  ctx = ensureSpace(doc, ctx, 120);
  ctx.y -= 10;
  ctx.page.drawText("LOCAL", { x: 46, y: ctx.y, size: 8, font: ctx.font, color: GRAY });
  ctx.page.drawText("DATA", { x: 280, y: ctx.y, size: 8, font: ctx.font, color: GRAY });
  ctx.y -= 16;
  ctx.page.drawText(v(c.enderecoMunicipio) || "________________", {
    x: 46,
    y: ctx.y,
    size: 10,
    font: ctx.bold,
    color: BLACK,
  });
  ctx.page.drawText(dataGeracao, {
    x: 280,
    y: ctx.y,
    size: 10,
    font: ctx.bold,
    color: BLACK,
  });
  ctx.y -= 36;
  ctx.page.drawLine({
    start: { x: 46, y: ctx.y },
    end: { x: 280, y: ctx.y },
    thickness: 0.8,
    color: BLACK,
  });
  ctx.page.drawText("Assinatura do Cliente", {
    x: 46,
    y: ctx.y - 14,
    size: 8,
    font: ctx.font,
    color: GRAY,
  });

  ctx.y -= 40;
  twoCol(
    ctx,
    ["Código do Convênio:", v(c.codigoConvenio)],
    ["Identificação do Operador:", v(c.identificacaoOperador)],
  );

  drawFooter(ctx);
  return doc.save();
}

/** Reexport tipagem auxiliar. */
export type { CadastroCliente };
