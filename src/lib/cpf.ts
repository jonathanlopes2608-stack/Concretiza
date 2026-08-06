/**
 * Normalização e extração de CPF a partir de texto OCR/PDF (ex.: campo 4d da CNH).
 */

export function onlyDigits(value: string): string {
  return value.replace(/\D/g, "");
}

export function formatCpf(digits: string): string {
  const d = onlyDigits(digits).slice(0, 11);
  if (d.length !== 11) return d;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

export function cpfIguais(a: string, b: string): boolean {
  const da = onlyDigits(a);
  const db = onlyDigits(b);
  return da.length === 11 && db.length === 11 && da === db;
}

function normalizeTexto(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .toUpperCase();
}

const CPF_NUM = /(\d{3}\.?\d{3}\.?\d{3}-?\d{2})/g;

function coletarCpfs(texto: string, re: RegExp): string[] {
  const out: string[] = [];
  const r = new RegExp(re.source, re.flags);
  let m: RegExpExecArray | null;
  while ((m = r.exec(texto)) !== null) {
    const digits = onlyDigits(m[1] ?? m[0] ?? "");
    if (digits.length === 11) out.push(digits);
  }
  return out;
}

/**
 * Extrai CPFs do texto priorizando o campo 4d da CNH.
 * Retorna lista de CPFs (somente dígitos), do mais específico ao genérico.
 */
export function extrairCpfsTexto(texto: string): string[] {
  const t = normalizeTexto(texto);
  const ordered: string[] = [];
  const seen = new Set<string>();

  const pushAll = (list: string[]) => {
    for (const cpf of list) {
      if (!seen.has(cpf)) {
        seen.add(cpf);
        ordered.push(cpf);
      }
    }
  };

  // CNH: 4d CPF … número
  pushAll(
    coletarCpfs(
      t,
      /4D\s*CPF[^\d]{0,30}(\d{3}\.?\d{3}\.?\d{3}-?\d{2})/gi,
    ),
  );

  // Rótulo CPF (sem confundir com registro)
  pushAll(coletarCpfs(t, /\bCPF\b[^\d]{0,30}(\d{3}\.?\d{3}\.?\d{3}-?\d{2})/gi));

  // Qualquer formato de CPF no texto (fallback)
  pushAll(coletarCpfs(t, CPF_NUM));

  return ordered;
}

/** Escolhe o CPF do documento: preferência 4d; senão o primeiro encontrado. */
export function escolherCpfDocumento(texto: string): string | null {
  const lista = extrairCpfsTexto(texto);
  return lista[0] ?? null;
}
