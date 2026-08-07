import Link from "next/link";
import { notFound } from "next/navigation";
import type { Role } from "@prisma/client";
import { BloqueiosPanel } from "@/src/components/bloqueios-panel";
import { ChecklistPanel } from "@/src/components/checklist-panel";
import { LinhaDoTempoTrigger } from "@/src/components/linha-do-tempo";
import { PipelinePanel } from "@/src/components/pipeline-panel";
import { RegisterProcessTab } from "@/src/components/register-process-tab";
import { FaseBadge } from "@/src/components/status-badge";
import { auth } from "@/src/lib/auth";
import { FASE_LABELS } from "@/src/lib/fases";
import {
  agruparLinhaDoTempo,
  formatAtualizadoEm,
} from "@/src/lib/linha-do-tempo";
import { listarTiposDependencia } from "@/src/modules/bloqueios/service";
import { sincronizarChecklistComValidacoes } from "@/src/modules/checklist/service";
import { parseCadastroCliente } from "@/src/modules/propostas/cadastro-cliente";
import { buscarPropostaPorId } from "@/src/modules/propostas/service";
import { listarAnalistasOpcoes } from "@/src/modules/usuarios/service";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

function money(value: { toString(): string } | null | undefined) {
  if (value === null || value === undefined) return "—";
  const n = Number(value.toString());
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function dt(value: Date | null | undefined) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(value);
}

export default async function PropostaDetalhePage({ params }: Props) {
  const { id } = await params;
  await sincronizarChecklistComValidacoes(id);
  const [proposta, session, tipos, analistas] = await Promise.all([
    buscarPropostaPorId(id),
    auth(),
    listarTiposDependencia(true),
    listarAnalistasOpcoes(),
  ]);
  if (!proposta) notFound();

  const userRole = (session?.user?.role ?? "VISUALIZACAO") as Role;
  const userId = session?.user?.id ?? "";
  const podeEditar = ["ADMIN", "COORDENADOR", "ANALISTA"].includes(userRole);
  const temBloqueioAberto = proposta.bloqueios.some((b) => b.status === "ABERTO");
  const titulo =
    proposta.numeroProcessoInterno ||
    proposta.numeroPropostaCaixa ||
    proposta.id.slice(0, 8);

  const diasLinha = agruparLinhaDoTempo(proposta.historicos);
  const ultimoEvento =
    proposta.historicos[0]?.createdAt ?? proposta.updatedAt ?? new Date();
  const atualizadoEmLabel = formatAtualizadoEm(ultimoEvento);
  const cadastro = parseCadastroCliente(proposta.cadastroCliente);

  const tabTitle =
    proposta.compradorNome
      ? `${titulo} · ${proposta.compradorNome.split(" ")[0]}`
      : titulo;

  return (
    <div className="space-y-6">
      <RegisterProcessTab id={proposta.id} title={tabTitle} />
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm text-neutral-600">Processo</p>
          <div className="mt-0.5 flex flex-wrap items-center gap-3">
            <h2 className="text-xl font-semibold text-brand-900">{titulo}</h2>
            <LinhaDoTempoTrigger dias={diasLinha} atualizadoEmLabel={atualizadoEmLabel} />
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <FaseBadge fase={proposta.faseAtual} />
            <span className="text-xs text-neutral-600">Origem: {proposta.origem}</span>
            <span className="text-xs text-neutral-600">Prioridade: {proposta.prioridade}</span>
            {proposta.bloqueioResumo ? (
              <span className="rounded bg-amber-100 px-2 py-0.5 text-xs text-amber-900">
                Parado: {proposta.bloqueioResumo}
              </span>
            ) : null}
          </div>
        </div>
        <div className="flex gap-2">
          <a
            href={`/api/propostas/${proposta.id}/formulario.pdf`}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-brand-900 hover:bg-neutral-100"
          >
            Imprimir / Exportar formulário PDF
          </a>
          <Link
            href={`/propostas/${proposta.id}/editar`}
            className="rounded-md bg-brand-700 px-3 py-2 text-sm font-medium text-white hover:bg-brand-900"
          >
            Editar
          </Link>
          <Link href="/fila" className="rounded-md border border-slate-300 px-3 py-2 text-sm hover:bg-neutral-100">
            Fila
          </Link>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <PipelinePanel
          propostaId={proposta.id}
          faseAtual={proposta.faseAtual}
          analistaId={proposta.analistaId}
          temBloqueioAberto={temBloqueioAberto}
          userRole={userRole}
          userId={userId}
          analistas={analistas}
        />
        <BloqueiosPanel
          propostaId={proposta.id}
          bloqueios={proposta.bloqueios}
          tipos={tipos}
          podeEditar={podeEditar}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Comprador">
          <Row label="Nome" value={proposta.compradorNome} />
          <Row label="CPF" value={proposta.compradorCpf} />
          <Row label="Telefone" value={proposta.compradorTelefone} />
          <Row label="E-mail" value={proposta.compradorEmail} />
          <Row label="Nascimento" value={cadastro.dataNascimento} />
          <Row label="Estado civil" value={cadastro.estadoCivil} />
          <Row label="Documento" value={[cadastro.docTipo, cadastro.docNumero].filter(Boolean).join(" — ") || null} />
        </Card>
        <Card title="Vendedor / Imóvel">
          <Row label="Vendedor" value={proposta.vendedorNome} />
          <Row label="CPF/CNPJ" value={proposta.vendedorCpfCnpj} />
          <Row label="Endereço" value={proposta.imovelEndereco} />
          <Row
            label="Cidade/UF"
            value={[proposta.imovelCidade, proposta.imovelUf].filter(Boolean).join(" / ") || null}
          />
          <Row label="Valor imóvel" value={money(proposta.valorImovel)} />
          <Row label="Financiamento" value={money(proposta.valorFinanciamento)} />
          <Row label="Imobiliária" value={proposta.imobiliaria} />
        </Card>
      </div>

      {(cadastro.enderecoLogradouro ||
        cadastro.fontePagadoraNome ||
        cadastro.agenciaCodigoNome ||
        cadastro.protocolo) && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card title="Endereço residencial (cadastro)">
            <Row
              label="Endereço"
              value={
                [
                  cadastro.enderecoLogradouro,
                  cadastro.enderecoNumero,
                  cadastro.enderecoComplemento,
                ]
                  .filter(Boolean)
                  .join(", ") || null
              }
            />
            <Row
              label="Bairro / Cidade"
              value={
                [cadastro.enderecoBairro, cadastro.enderecoMunicipio, cadastro.enderecoUf]
                  .filter(Boolean)
                  .join(" / ") || null
              }
            />
            <Row label="CEP" value={cadastro.enderecoCep} />
            <Row label="Ocupação do imóvel" value={cadastro.ocupacaoImovel} />
          </Card>
          <Card title="Renda / Agência (cadastro)">
            <Row label="Fonte pagadora" value={cadastro.fontePagadoraNome} />
            <Row label="Ocupação" value={cadastro.ocupacaoProfissional} />
            <Row
              label="Renda bruta / líquida"
              value={
                [cadastro.rendaBruta, cadastro.rendaLiquida].filter(Boolean).join(" / ") || null
              }
            />
            <Row label="Agência" value={cadastro.agenciaCodigoNome} />
            <Row label="Protocolo" value={cadastro.protocolo} />
            <Row label="Correspondente" value={cadastro.codigoCorrespondente} />
          </Card>
        </div>
      )}

      <Card title="Identificação e SLA">
        <Row label="Processo interno" value={proposta.numeroProcessoInterno} />
        <Row label="Nº Caixa" value={proposta.numeroPropostaCaixa} />
        <Row label="Despachante" value={proposta.despachanteNome} />
        <Row label="Entrada" value={dt(proposta.dataEntrada)} />
        <Row label="Prazo SLA" value={dt(proposta.prazoSlaAte)} />
        <Row label="Analista" value={proposta.analista?.nome} />
        <Row label="Modalidade" value={proposta.modalidade} />
        {proposta.motivoCancelamento ? (
          <Row label="Motivo cancelamento" value={proposta.motivoCancelamento} />
        ) : null}
        {proposta.motivoReprovacao ? (
          <Row label="Motivo reprovação" value={proposta.motivoReprovacao} />
        ) : null}
      </Card>

      {proposta.faseAtual === "CONFORMIDADE" ||
      proposta.checklistRespostas.some((i) => i.status !== "PENDENTE") ? (
        <section>
          <h3 className="mb-3 text-sm font-semibold text-brand-900">Checklist documental</h3>
          <p className="mb-3 text-xs text-neutral-600">
            Em RG/CNH: o sistema tenta ler a validade automaticamente. Item reprovado abre
            bloqueio para o Cliente.
          </p>
          <ChecklistPanel
            propostaId={proposta.id}
            itens={proposta.checklistRespostas}
            userRole={userRole}
          />
        </section>
      ) : (
        <section className="rounded-lg border border-dashed border-slate-300 bg-surface p-5 text-sm text-neutral-600">
          Checklist documental disponível principalmente na fase{" "}
          <strong>{FASE_LABELS.CONFORMIDADE}</strong>.{" "}
          <details className="mt-2">
            <summary className="cursor-pointer text-brand-700">Mostrar checklist agora</summary>
            <div className="mt-3">
              <ChecklistPanel
                propostaId={proposta.id}
                itens={proposta.checklistRespostas}
                userRole={userRole}
              />
            </div>
          </details>
        </section>
      )}

      <Card title="Histórico">
        <ul className="space-y-2 text-sm">
          {proposta.historicos.map((h) => (
            <li key={h.id} className="rounded bg-neutral-100 px-3 py-2">
              <span className="font-medium">
                {h.deFase ? FASE_LABELS[h.deFase] : "—"} → {FASE_LABELS[h.paraFase]}
              </span>
              <span className="text-neutral-600">
                {" "}
                · {dt(h.createdAt)} · {h.usuario?.nome ?? "sistema"}
              </span>
              {h.observacao ? <p className="text-xs text-neutral-600">{h.observacao}</p> : null}
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-surface p-5">
      <h3 className="mb-3 text-sm font-semibold text-brand-900">{title}</h3>
      {children}
    </section>
  );
}

function Row({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex justify-between gap-4 border-b border-slate-50 py-1.5 text-sm last:border-0">
      <span className="text-neutral-600">{label}</span>
      <span className="text-right font-medium text-brand-900">{value || "—"}</span>
    </div>
  );
}
