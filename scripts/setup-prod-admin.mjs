/**
 * Configura a conta de admin para produção:
 *  1. Altera email (admin@bcu.cv → admin@belabelo.cv) e password
 *  2. Remove os utilizadores de teste (cliente, ana, rui)
 *
 * Uso: node scripts/setup-prod-admin.mjs
 */

import { createInterface } from "readline";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

function ask(question) {
  return new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    rl.question(question, (answer) => { rl.close(); resolve(answer); });
  });
}

async function main() {
  console.log("\n=== Setup Admin — Produção ===");
  console.log("(A password ficará visível no terminal — fecha-o depois de correr)\n");

  const password1 = await ask("Nova password para admin@belabelo.cv: ");
  const password2 = await ask("Confirmar password: ");

  if (password1 !== password2) {
    console.error("❌ As passwords não coincidem.");
    process.exit(1);
  }

  if (password1.length < 10) {
    console.error("❌ A password deve ter pelo menos 10 caracteres.");
    process.exit(1);
  }

  const hash = await bcrypt.hash(password1, 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@belabelo.cv" },
    update: { password: hash },
    create: { email: "admin@belabelo.cv", password: hash, role: "admin", name: "Admin" },
  });
  console.log(`✅ Admin pronto → ${admin.email}`);

  console.log("\n✅ Concluído.\n");
}

main()
  .catch((e) => { console.error("\n❌ Erro:", e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
