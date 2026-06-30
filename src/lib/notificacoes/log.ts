import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export async function jaFoiEnviado(idempotencyKey: string) {
  return prisma.notificacaoLog.findFirst({
    where: { idempotencyKey, sucesso: true },
    orderBy: { criadoEm: "desc" },
  });
}

interface RegistarTentativaParams {
  idempotencyKey: string;
  reservaId: string;
  numeroCliente: string;
  canal: string;
  sucesso: boolean;
  detalhe?: unknown;
}

export async function registarTentativa({
  idempotencyKey,
  reservaId,
  numeroCliente,
  canal,
  sucesso,
  detalhe,
}: RegistarTentativaParams) {
  try {
    await prisma.notificacaoLog.create({
      data: {
        idempotencyKey,
        reservaId,
        numeroCliente,
        canal,
        sucesso,
        detalhe: safeJson(detalhe),
      },
    });
  } catch (erroLog) {
    console.error("Falha ao registar tentativa de notificação:", erroLog, { idempotencyKey, canal, sucesso });
  }
}

function safeJson(valor: unknown): Prisma.InputJsonValue {
  try {
    return JSON.parse(JSON.stringify(valor)) as Prisma.InputJsonValue;
  } catch {
    return { aviso: "detalhe não serializável" };
  }
}
