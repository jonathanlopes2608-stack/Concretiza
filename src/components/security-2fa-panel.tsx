"use client";

import { useState } from "react";
import QRCode from "qrcode";
import {
  disable2faAction,
  enable2faAction,
  prepare2faSetupAction,
} from "@/src/modules/auth/actions";

type Props = {
  twoFactorEnabled: boolean;
};

export function Security2faPanel({ twoFactorEnabled }: Props) {
  const [enabled, setEnabled] = useState(twoFactorEnabled);
  const [secret, setSecret] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [totp, setTotp] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function startSetup() {
    setError(null);
    setMessage(null);
    const result = await prepare2faSetupAction();
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setSecret(result.secret);
    const url = await QRCode.toDataURL(result.otpauth);
    setQrDataUrl(url);
  }

  async function confirmEnable(e: React.FormEvent) {
    e.preventDefault();
    if (!secret) return;
    setLoading(true);
    setError(null);
    const result = await enable2faAction({ totp, secret });
    setLoading(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setEnabled(true);
    setSecret(null);
    setQrDataUrl(null);
    setTotp("");
    setMessage("Autenticação em duas etapas ativada.");
  }

  async function confirmDisable(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const result = await disable2faAction({ totp });
    setLoading(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setEnabled(false);
    setTotp("");
    setMessage("Autenticação em duas etapas desativada.");
  }

  return (
    <div className="max-w-lg rounded-lg border border-slate-200 bg-surface p-6">
      <h2 className="text-base font-semibold text-brand-900">Autenticação em duas etapas (2FA)</h2>
      <p className="mt-1 text-sm text-neutral-600">
        Status:{" "}
        <span className={enabled ? "font-medium text-green-700" : "font-medium text-amber-700"}>
          {enabled ? "Ativa" : "Inativa"}
        </span>
      </p>

      {message ? (
        <p className="mt-3 rounded-md bg-green-50 px-3 py-2 text-sm text-green-800">{message}</p>
      ) : null}
      {error ? (
        <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      ) : null}

      {!enabled && !secret ? (
        <button
          type="button"
          onClick={startSetup}
          className="mt-4 rounded-md bg-brand-700 px-4 py-2 text-sm font-medium text-white hover:bg-brand-900"
        >
          Ativar 2FA
        </button>
      ) : null}

      {!enabled && secret ? (
        <form onSubmit={confirmEnable} className="mt-4 space-y-3">
          {qrDataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={qrDataUrl} alt="QR Code 2FA" className="mx-auto h-48 w-48" />
          ) : null}
          <p className="break-all rounded bg-neutral-100 p-2 text-xs text-neutral-600">
            Chave manual: {secret}
          </p>
          <input
            value={totp}
            onChange={(e) => setTotp(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="Código de 6 dígitos"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="rounded-md bg-brand-700 px-4 py-2 text-sm font-medium text-white hover:bg-brand-900 disabled:opacity-60"
          >
            Confirmar ativação
          </button>
        </form>
      ) : null}

      {enabled ? (
        <form onSubmit={confirmDisable} className="mt-4 space-y-3">
          <input
            value={totp}
            onChange={(e) => setTotp(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="Código para desativar"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="rounded-md border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-60"
          >
            Desativar 2FA
          </button>
        </form>
      ) : null}
    </div>
  );
}
