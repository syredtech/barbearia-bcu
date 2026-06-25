import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  if (!(await rateLimit(`cadastrar:${ip}`, 5, 15 * 60 * 1000))) {
    return NextResponse.json({ error: "Demasiadas tentativas. Tente novamente mais tarde." }, { status: 429 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let rawBody: any;
  try {
    rawBody = await req.json();
  } catch {
    return NextResponse.json({ error: "Corpo inválido." }, { status: 400 });
  }
  const { name: rawName, email: rawEmail, password } = rawBody;
  const email = typeof rawEmail === "string" ? rawEmail.toLowerCase().trim() : "";
  const name  = typeof rawName === "string" ? rawName.trim() : "";

  if (!name || !email || !password) {
    return NextResponse.json({ error: "Preencha todos os campos." }, { status: 400 });
  }

  if (name.length > 100) {
    return NextResponse.json({ error: "Nome demasiado longo (máx. 100 caracteres)." }, { status: 400 });
  }

  if (/[<>]/.test(name)) {
    return NextResponse.json({ error: "Nome contém caracteres inválidos." }, { status: 400 });
  }

  if (email.length > 254 || !/^[a-zA-Z0-9._+%-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)) {
    return NextResponse.json({ error: "E-mail inválido." }, { status: 400 });
  }

  if (typeof password !== "string" || password.length < 8) {
    return NextResponse.json({ error: "A password deve ter pelo menos 8 caracteres." }, { status: 400 });
  }
  if (password.length > 72) {
    return NextResponse.json({ error: "A password é demasiado longa (máx. 72 caracteres)." }, { status: 400 });
  }

  const exists = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (exists) {
    return NextResponse.json({ error: "E-mail já cadastrado." }, { status: 409 });
  }

  const hashed = await bcrypt.hash(password, 12);
  let user;
  try {
    user = await prisma.user.create({
      data: { name, email, password: hashed, role: "client" },
      select: { id: true, name: true, email: true },
    });
  } catch (err: any) {
    if (err?.code === "P2002") {
      return NextResponse.json({ error: "E-mail já cadastrado." }, { status: 409 });
    }
    throw err;
  }

  return NextResponse.json({ id: user.id, name: user.name, email: user.email }, { status: 201 });
}
