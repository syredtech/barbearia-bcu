import { prisma } from "@/lib/prisma";

export async function registarHeartbeat() {
  await prisma.gatewayStatus.upsert({
    where: { id: "android_gateway" },
    update: { ultimoHeartbeat: new Date() },
    create: { id: "android_gateway", ultimoHeartbeat: new Date() },
  });
}

export async function obterUltimoHeartbeat(): Promise<Date | null> {
  const registo = await prisma.gatewayStatus.findUnique({ where: { id: "android_gateway" } });
  return registo?.ultimoHeartbeat ?? null;
}
