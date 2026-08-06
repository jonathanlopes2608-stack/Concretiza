import Link from "next/link";
import { PropostaForm } from "@/src/components/proposta-form";

export default function NovaPropostaPage() {
  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-brand-900">Nova proposta</h2>
          <p className="text-sm text-neutral-600">Cadastro manual — origem MANUAL, fase ENTRADA.</p>
        </div>
        <Link href="/fila" className="text-sm text-brand-700 hover:underline">
          Voltar à fila
        </Link>
      </div>
      <PropostaForm mode="create" />
    </div>
  );
}
