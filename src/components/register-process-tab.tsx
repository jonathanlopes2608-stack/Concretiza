"use client";

import { useEffect } from "react";
import { openProcessTab } from "@/src/lib/process-tabs-store";

type Props = {
  id: string;
  title: string;
};

/** Registra/atualiza a aba ao visitar o detalhe do processo. */
export function RegisterProcessTab({ id, title }: Props) {
  useEffect(() => {
    openProcessTab(id, title);
  }, [id, title]);

  return null;
}
