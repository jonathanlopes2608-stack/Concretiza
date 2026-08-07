import Link from "next/link";
import { notFound } from "next/navigation";
import { PropostaForm } from "@/src/components/proposta-form";
import { parseCadastroCliente } from "@/src/modules/propostas/cadastro-cliente";
import { buscarPropostaPorId } from "@/src/modules/propostas/service";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function EditarPropostaPage({ params }: Props) {
  const { id } = await params;
  const proposta = await buscarPropostaPorId(id);
  if (!proposta) notFound();

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-brand-900">Editar proposta</h2>
          <p className="text-sm text-neutral-600">
            {proposta.numeroProcessoInterno || proposta.numeroPropostaCaixa}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <a
            href={`/api/propostas/${id}/formulario.pdf`}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-brand-900 hover:bg-neutral-100"
          >
            Imprimir / Exportar formulário PDF
          </a>
          <Link href={`/propostas/${id}`} className="text-sm text-brand-700 hover:underline">
            Voltar ao detalhe
          </Link>
        </div>
      </div>
      <PropostaForm
        mode="edit"
        propostaId={id}
        initial={{
          numeroPropostaCaixa: proposta.numeroPropostaCaixa,
          numeroProcessoInterno: proposta.numeroProcessoInterno,
          despachanteNome: proposta.despachanteNome,
          modalidade: proposta.modalidade,
          prioridade: proposta.prioridade,
          compradorNome: proposta.compradorNome,
          compradorCpf: proposta.compradorCpf,
          compradorTelefone: proposta.compradorTelefone,
          compradorEmail: proposta.compradorEmail,
          vendedorNome: proposta.vendedorNome,
          vendedorCpfCnpj: proposta.vendedorCpfCnpj,
          imovelEndereco: proposta.imovelEndereco,
          imovelCidade: proposta.imovelCidade,
          imovelUf: proposta.imovelUf,
          valorImovel: proposta.valorImovel?.toString() ?? "",
          valorFinanciamento: proposta.valorFinanciamento?.toString() ?? "",
          imobiliaria: proposta.imobiliaria,
          cadastroCliente: parseCadastroCliente(proposta.cadastroCliente),
        }}
      />
    </div>
  );
}
