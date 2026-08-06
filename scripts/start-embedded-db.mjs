/**
 * Sobe um Postgres embutido na porta 5437 (sem Docker),
 * só para desenvolvimento local da Concretiza.
 */
import EmbeddedPostgres from "embedded-postgres";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const dataDir = path.join(root, ".data", "pg-5437");

const port = Number(process.env.CONCRETIZA_PG_PORT || 5437);
const password = process.env.CONCRETIZA_PG_PASSWORD || "concretiza";

const pg = new EmbeddedPostgres({
  databaseDir: dataDir,
  user: "concretiza",
  password,
  port,
  persistent: true,
  onLog: (msg) => process.stdout.write(String(msg)),
  onError: (msg) => process.stderr.write(String(msg)),
});

async function main() {
  const alreadyInitialized = fs.existsSync(path.join(dataDir, "PG_VERSION"));
  console.log(`[db] Postgres embutido em ${dataDir} (porta ${port})...`);

  if (!alreadyInitialized) {
    console.log("[db] Inicializando cluster (primeira vez)...");
    await pg.initialise();
  } else {
    console.log("[db] Cluster já inicializado — pulando initdb.");
  }

  await pg.start();
  console.log("[db] Postgres iniciado.");

  try {
    await pg.createDatabase("concretiza");
    console.log("[db] Banco concretiza criado.");
  } catch (err) {
    const msg = String(err?.message || err);
    if (/already exists/i.test(msg)) {
      console.log("[db] Banco concretiza já existe.");
    } else {
      console.warn("[db] createDatabase:", msg);
    }
  }

  console.log(`[db] Pronto: postgresql://concretiza:***@localhost:${port}/concretiza`);
  console.log("[db] Mantendo processo ativo. Ctrl+C para parar.");

  const stop = async () => {
    console.log("\n[db] Parando Postgres...");
    try {
      await pg.stop();
    } catch {
      /* ignore */
    }
    process.exit(0);
  };
  process.on("SIGINT", stop);
  process.on("SIGTERM", stop);

  await new Promise(() => {});
}

main().catch((err) => {
  console.error("[db] Falha:", err);
  process.exit(1);
});
