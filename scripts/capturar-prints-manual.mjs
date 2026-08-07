/**
 * Captura prints atuais da UI para docs/manual/.
 * Requer app em http://localhost:3047 e Chromium do Playwright.
 *
 * Uso: node scripts/capturar-prints-manual.mjs
 */
import { createRequire } from "module";
import { mkdir } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const { PrismaClient } = require("@prisma/client");

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const OUT = path.join(ROOT, "docs", "manual");
const BASE = process.env.MANUAL_BASE_URL || "http://localhost:3047";
const EMAIL = process.env.ADMIN_EMAIL || "admin@concretiza.local";
const PASSWORD = process.env.ADMIN_PASSWORD || "Admin@123";

async function shot(page, name) {
  const file = path.join(OUT, name);
  await page.screenshot({ path: file, fullPage: false });
  console.log("ok", name);
}

async function login(page) {
  await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
  await page.fill("#email", EMAIL);
  await page.fill("#password", PASSWORD);
  await Promise.all([
    page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 20000 }),
    page.click('button[type="submit"]'),
  ]);
  // 2FA redirect?
  if (page.url().includes("/login/2fa")) {
    throw new Error("2FA ativo — desative temporariamente ou informe código no script");
  }
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const prisma = new PrismaClient();
  const propostas = await prisma.proposta.findMany({
    take: 3,
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      numeroProcessoInterno: true,
      compradorNome: true,
      faseAtual: true,
    },
  });
  console.log("propostas:", propostas.length, propostas.map((p) => p.numeroProcessoInterno || p.id));

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
  });
  await context.addInitScript(() => {
    const hide = () => {
      const style = document.createElement("style");
      style.textContent =
        "nextjs-portal,[data-nextjs-toast],[data-next-badge-root],#__next-build-watcher{display:none!important;visibility:hidden!important}";
      document.documentElement.appendChild(style);
    };
    hide();
    document.addEventListener("DOMContentLoaded", hide);
  });
  const page = await context.newPage();

  const comBloqueio = await prisma.proposta.findFirst({
    where: {
      bloqueioResumo: { not: null },
      faseAtual: { notIn: ["CANCELADO", "REPROVADA", "FINALIZADO"] },
    },
    orderBy: { updatedAt: "desc" },
    select: { id: true, numeroProcessoInterno: true },
  });
  const conformidade = await prisma.proposta.findFirst({
    where: { faseAtual: "CONFORMIDADE" },
    orderBy: { updatedAt: "desc" },
    select: { id: true, numeroProcessoInterno: true },
  });
  const outra = await prisma.proposta.findFirst({
    where: {
      id: { notIn: [comBloqueio?.id, conformidade?.id].filter(Boolean) },
      faseAtual: { notIn: ["CANCELADO", "REPROVADA"] },
    },
    orderBy: { updatedAt: "desc" },
    select: { id: true, numeroProcessoInterno: true },
  });

  // 01 login (antes de autenticar)
  await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
  await page.waitForSelector("#email");
  await shot(page, "01-login.png");

  await login(page);
  await page.waitForTimeout(800);

  // Abrir 1–2 processos para mostrar barra de abas
  const tabIds = [comBloqueio?.id, outra?.id || conformidade?.id].filter(Boolean);
  for (const id of tabIds) {
    await page.goto(`${BASE}/propostas/${id}`, { waitUntil: "networkidle" });
    await page.waitForTimeout(400);
  }

  await page.goto(`${BASE}/fila`, { waitUntil: "networkidle" });
  await page.waitForTimeout(700);
  await shot(page, "02-fila.png");

  // 03 nova proposta
  await page.goto(`${BASE}/propostas/nova`, { waitUntil: "networkidle" });
  await page.waitForTimeout(500);
  await shot(page, "03-nova-proposta.png");

  // 04/05 detalhe + bloqueios
  const detalheId = comBloqueio?.id || propostas[0]?.id;
  if (detalheId) {
    await page.goto(`${BASE}/propostas/${detalheId}`, { waitUntil: "networkidle" });
    await page.waitForTimeout(800);
    await shot(page, "04-detalhe-pipeline-bloqueios.png");
    await shot(page, "11-abas-processos.png");

    const bloqueios = page.locator("text=Bloqueios").first();
    if (await bloqueios.count()) {
      await bloqueios.scrollIntoViewIfNeeded();
      await page.waitForTimeout(400);
    }
    await shot(page, "05-bloqueios.png");
    await shot(page, "05b-bloqueio-aberto.png");
  } else {
    console.warn("Sem propostas — pulando prints de detalhe");
  }

  // 06 checklist (preferir Conformidade)
  const checklistId = conformidade?.id || detalheId;
  if (checklistId) {
    await page.goto(`${BASE}/propostas/${checklistId}`, { waitUntil: "networkidle" });
    await page.waitForTimeout(700);
    const show = page.getByText("Mostrar checklist", { exact: false });
    if (await show.count()) {
      await show.first().click();
      await page.waitForTimeout(500);
    }
    const checklist = page.locator("text=Checklist").first();
    if (await checklist.count()) {
      await checklist.scrollIntoViewIfNeeded();
      await page.waitForTimeout(400);
    }
    await shot(page, "06-checklist.png");
  }

  // 07 dashboard
  await page.goto(`${BASE}/dashboard`, { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  await shot(page, "07-dashboard.png");

  // 08 dependencias
  await page.goto(`${BASE}/config/dependencias`, { waitUntil: "networkidle" });
  await page.waitForTimeout(600);
  await shot(page, "08-dependencias.png");

  // extras úteis (opcional no Word)
  await page.goto(`${BASE}/usuarios`, { waitUntil: "networkidle" });
  await page.waitForTimeout(500);
  await shot(page, "09-usuarios.png");

  await page.goto(`${BASE}/agenda`, { waitUntil: "networkidle" });
  await page.waitForTimeout(500);
  await shot(page, "10-agenda.png");

  await browser.close();
  await prisma.$disconnect();
  console.log("Concluído em", OUT);
}

main().catch(async (err) => {
  console.error(err);
  process.exit(1);
});
