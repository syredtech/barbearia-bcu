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
  const admin = await prisma.user.update({
    where: { email: "admin@bcu.cv" },
    data: { email: "admin@belabelo.cv", password: hash },
  });
  console.log(`✅ Admin actualizado → ${admin.email}`);

  // Remover utilizadores de teste e os seus agendamentos
  const testEmails = ["cliente@email.cv", "ana@email.cv", "rui@email.cv"];

  const deletedAppts = await prisma.agendamento.deleteMany({
    where: { client: { email: { in: testEmails } } },
  });
  if (deletedAppts.count > 0) {
    console.log(`🗑  ${deletedAppts.count} agendamento(s) de teste removido(s)`);
  }

  const deletedUsers = await prisma.user.deleteMany({
    where: { email: { in: testEmails } },
  });
  console.log(`🗑  ${deletedUsers.count} utilizador(es) de teste removido(s)`);

  console.log("\n✅ Configuração de produção concluída.\n");
}

main()
  .catch((e) => { console.error("\n❌ Erro:", e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
