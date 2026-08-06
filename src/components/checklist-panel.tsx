"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { formatDateBr, toDateInputValue } from "@/src/lib/dates";
import {
  atualizarChecklistAction,
  removerDocumentoAction,
  salvarValidadeAction,
  uploadDocumentoAction,
} from "@/src/modules/checklist/actions";

type Validacao = {
  id: string;
  status: string;
  tipoRegra: string;
  validadeDetectada: Date | string | null;
  detalhes: unknown;
};

type Documento = {
  id: string;
  nomeOriginal: string;
  mimeType: string;
  createdAt: Date | string;
  validacoes: Validacao[];
};

type Item = {
  id: string;
  status: "PENDENTE" | "OK" | "REPROVADO";
  observacao: string | null;
  validadeInformada?: Date | string | null;
  template: { codigo: string; grupo: string; label: string };
  documentos: Documento[];
};

type Props = {
  propostaId: string;
  itens: Item[];
  userRole: string;
};

export function ChecklistPanel({ propostaId, itens, userRole }: Props) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const podeDesbloquear = userRole === "ADMIN" || userRole === "COORDENADOR";

  async function setStatus(item: Item, status: Item["status"]) {
    setBusyId(item.id);
    setErr(null);
    setMsg(null);
    const result = await atualizarChecklistAction({
      respostaId: item.id,
      status,
      propostaId,
      observacao:
        status === "PENDENTE"
          ? undefined
          : (item.observacao ?? undefined),
    });
    setBusyId(null);
    if (!result.ok) {
      setErr(result.error);
      return;
    }
    if (status === "PENDENTE" && item.status === "OK") {
      setMsg("Item reaberto para nova análise.");
    }
    router.refresh();
  }

  async function onSalvarValidade(e: React.FormEvent<HTMLFormElement>, item: Item) {
    e.preventDefault();
    setBusyId(item.id);
    setErr(null);
    setMsg(null);
    const formData = new FormData(e.currentTarget);
    const validadeInformada = String(formData.get("validadeInformada") || "");
    const result = await salvarValidadeAction({
      respostaId: item.id,
      propostaId,
      validadeInformada,
    });
    setBusyId(null);
    if (!result.ok) {
      setErr(result.error);
      return;
    }
    setMsg("Validade salva.");
    router.refresh();
  }

  async function onUpload(e: React.FormEvent<HTMLFormElement>, item: Item) {
    e.preventDefault();
    setBusyId(item.id);
    setErr(null);
    setMsg(null);
    const formData = new FormData(e.currentTarget);
    formData.set("respostaId", item.id);
    formData.set("propostaId", propostaId);
    const result = await uploadDocumentoAction(formData);
    setBusyId(null);
    if (!result.ok) {
      setErr(result.error);
      return;
    }
    setMsg(
      `Upload ok — validação: ${result.data?.validacaoStatus}${
        result.data?.mensagem ? ` (${result.data.mensagem})` : ""
      }`,
    );
    router.refresh();
  }

  async function onRemove(documentoId: string) {
    setErr(null);
    const result = await removerDocumentoAction({ documentoId, propostaId });
    if (!result.ok) {
      setErr(result.error);
      return;
    }
    router.refresh();
  }

  const grupos = ["COMPRADOR", "VENDEDOR", "IMOVEL"] as const;

  return (
    <div className="space-y-4">
      {msg ? (
        <p className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-800">{msg}</p>
      ) : null}
      {err ? (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{err}</p>
      ) : null}

      {grupos.map((grupo) => {
        const list = itens.filter((i) => i.template.grupo === grupo);
        if (list.length === 0) return null;
        return (
          <section key={grupo} className="rounded-lg border border-slate-200 bg-surface p-4">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-brand-900">
              {grupo}
            </h3>
            <ul className="space-y-4">
              {list.map((item) => {
                const bloqueado = item.status === "OK";
                const precisaValidade =
                  item.template.codigo.includes("RG_CNH") ||
                  item.template.codigo.includes("CNH");
                const validadeSalva = formatDateBr(item.validadeInformada);
                return (
                  <li
                    key={item.id}
                    className={`rounded-md border p-3 ${
                      bloqueado ? "border-green-200 bg-green-50/40" : "border-slate-100"
                    }`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium text-brand-900">{item.template.label}</p>
                        <p className="text-xs text-neutral-600">{item.template.codigo}</p>
                        {validadeSalva ? (
                          <p className="mt-1 text-xs font-medium text-brand-700">
                            Validade gravada: {validadeSalva}
                          </p>
                        ) : null}
                        {bloqueado ? (
                          <p className="mt-1 text-xs font-medium text-green-700">
                            {item.observacao || "Documento validado — item bloqueado"}
                          </p>
                        ) : item.observacao ? (
                          <p className="mt-1 text-xs text-amber-800">{item.observacao}</p>
                        ) : null}
                      </div>
                      <div className="flex flex-wrap items-center gap-1">
                        {bloqueado ? (
                          <span className="rounded bg-green-600 px-2 py-1 text-xs font-medium text-white">
                            OK · bloqueado
                          </span>
                        ) : (
                          (["PENDENTE", "OK", "REPROVADO"] as const).map((s) => (
                            <button
                              key={s}
                              type="button"
                              disabled={busyId === item.id}
                              onClick={() => setStatus(item, s)}
                              className={`rounded px-2 py-1 text-xs font-medium ${
                                item.status === s
                                  ? s === "OK"
                                    ? "bg-green-600 text-white"
                                    : s === "REPROVADO"
                                      ? "bg-red-600 text-white"
                                      : "bg-slate-600 text-white"
                                  : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                              }`}
                            >
                              {s}
                            </button>
                          ))
                        )}
                        {bloqueado && podeDesbloquear ? (
                          <button
                            type="button"
                            disabled={busyId === item.id}
                            onClick={() => setStatus(item, "PENDENTE")}
                            className="rounded border border-amber-600 px-2 py-1 text-xs font-medium text-amber-800 hover:bg-amber-50"
                            title="Reabrir para nova análise"
                          >
                            Reabrir
                          </button>
                        ) : null}
                      </div>
                    </div>

                    {!bloqueado && precisaValidade ? (
                      <form
                        onSubmit={(e) => onSalvarValidade(e, item)}
                        className="mt-3 flex flex-wrap items-end gap-2 rounded bg-neutral-100 px-3 py-2"
                      >
                        <div>
                          <label className="mb-1 block text-[11px] text-neutral-600">
                            Validade do documento
                          </label>
                          <input
                            type="date"
                            name="validadeInformada"
                            key={`${item.id}-${toDateInputValue(item.validadeInformada)}`}
                            defaultValue={toDateInputValue(item.validadeInformada)}
                            className="rounded border border-slate-300 px-2 py-1 text-xs"
                          />
                        </div>
                        <button
                          type="submit"
                          disabled={busyId === item.id}
                          className="rounded-md border border-brand-700 px-3 py-1.5 text-xs font-medium text-brand-700 hover:bg-white disabled:opacity-60"
                        >
                          Salvar validade
                        </button>
                      </form>
                    ) : null}

                    {!bloqueado ? (
                      <form
                        onSubmit={(e) => onUpload(e, item)}
                        className="mt-3 flex flex-wrap items-end gap-2 border-t border-slate-50 pt-3"
                      >
                        <div>
                          <label className="mb-1 block text-[11px] text-neutral-600">Arquivo</label>
                          <input
                            type="file"
                            name="arquivo"
                            accept=".pdf,.jpg,.jpeg,.png,.webp"
                            required
                            className="block max-w-xs text-xs"
                          />
                        </div>
                        <button
                          type="submit"
                          disabled={busyId === item.id}
                          className="rounded-md bg-brand-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-900 disabled:opacity-60"
                        >
                          {busyId === item.id ? "Enviando..." : "Anexar"}
                        </button>
                      </form>
                    ) : null}

                    {item.documentos.length > 0 ? (
                      <ul className="mt-3 space-y-2">
                        {item.documentos.map((doc) => {
                          const vals = doc.validacoes;
                          return (
                            <li
                              key={doc.id}
                              className="flex flex-wrap items-center justify-between gap-2 rounded bg-neutral-100 px-2 py-1.5 text-xs"
                            >
                              <div className="min-w-0 flex-1">
                                <a
                                  href={`/api/documentos/${doc.id}`}
                                  className="font-medium text-brand-700 hover:underline"
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  {doc.nomeOriginal}
                                </a>
                                {vals.length > 0 ? (
                                  <ul className="mt-1 space-y-0.5 text-neutral-600">
                                    {vals.map((val) => {
                                      const msgDetalhe =
                                        typeof val.detalhes === "object" &&
                                        val.detalhes &&
                                        "message" in val.detalhes
                                          ? String(
                                              (val.detalhes as { message?: string })
                                                .message ?? "",
                                            )
                                          : "";
                                      const fonte =
                                        typeof val.detalhes === "object" &&
                                        val.detalhes &&
                                        "fonte" in val.detalhes
                                          ? String(
                                              (val.detalhes as { fonte?: string }).fonte ??
                                                "",
                                            )
                                          : "";
                                      return (
                                        <li key={val.id}>
                                          <span className="font-medium">
                                            {val.tipoRegra === "CPF_DOCUMENTO"
                                              ? "CPF"
                                              : val.tipoRegra === "VALIDADE_IDENTIDADE"
                                                ? "Validade"
                                                : val.tipoRegra}
                                          </span>
                                          {": "}
                                          {val.status}
                                          {formatDateBr(val.validadeDetectada)
                                            ? ` · ${formatDateBr(val.validadeDetectada)}`
                                            : ""}
                                          {fonte ? ` · ${fonte}` : ""}
                                          {msgDetalhe ? ` — ${msgDetalhe}` : ""}
                                        </li>
                                      );
                                    })}
                                  </ul>
                                ) : null}
                              </div>
                              {!bloqueado ? (
                                <button
                                  type="button"
                                  onClick={() => onRemove(doc.id)}
                                  className="text-red-700 hover:underline"
                                >
                                  Remover
                                </button>
                              ) : (
                                <span className="text-neutral-500">protegido</span>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
