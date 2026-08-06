import Link from "next/link";
import { ImportExcelForm } from "@/src/components/import-excel-form";

export default function ImportarPropostasPage() {
  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-brand-900">Importar Excel</h2>
          <p className="text-sm text-neutral-600">
            Entrada em lote — origem EXCEL, checklist e SLA aplicados automaticamente.
          </p>
        </div>
        <Link href="/fila" className="text-sm text-brand-700 hover:underline">
          Voltar à fila
        </Link>
      </div>
      <ImportExcelForm />
    </div>
  );
}
