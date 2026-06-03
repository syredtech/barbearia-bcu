import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const hash = (p: string) => bcrypt.hash(p, 10);

  // ── Limpar dados existentes (ordem respeita FKs) ──────────────
  await prisma.review.deleteMany();
  await prisma.agendamento.deleteMany();
  await prisma.notificacao.deleteMany();
  await prisma.venue.deleteMany(); // cascade: servicos, funcionarios
  // Apagar owners antigos
  await prisma.user.deleteMany({
    where: { role: "owner" },
  });

  // ── Utilizadores fixos ─────────────────────────────────────────
  await prisma.user.upsert({
    where: { email: "admin@bcu.cv" },
    update: {},
    create: { name: "Admin BCU", email: "admin@bcu.cv", password: await hash("admin123"), role: "admin" },
  });

  const cliente = await prisma.user.upsert({
    where: { email: "cliente@email.cv" },
    update: {},
    create: { name: "Carlos Tavares", email: "cliente@email.cv", password: await hash("senha123"), role: "client" },
  });

  const ana = await prisma.user.upsert({
    where: { email: "ana@email.cv" },
    update: {},
    create: { name: "Ana Lima", email: "ana@email.cv", password: await hash("senha123"), role: "client" },
  });

  const rui = await prisma.user.upsert({
    where: { email: "rui@email.cv" },
    update: {},
    create: { name: "Rui Monteiro", email: "rui@email.cv", password: await hash("senha123"), role: "client" },
  });

  // ── 10 Owners ─────────────────────────────────────────────────
  const ownerData = [
    { name: "Tiago Évora",       email: "tiago@barbearia.cv" },
    { name: "Nelson Andrade",    email: "nelson@barber.cv" },
    { name: "Armando Costa",     email: "armando@barbearia.cv" },
    { name: "Lúcia Monteiro",    email: "lucia@salao.cv" },
    { name: "Fernanda Borges",   email: "fernanda@cabeleireiro.cv" },
    { name: "Rosa Tavares",      email: "rosa@penteados.cv" },
    { name: "Inês Morais",       email: "ines@nails.cv" },
    { name: "Patrícia Silva",    email: "patricia@unhas.cv" },
    { name: "Carmen Rodrigues",  email: "carmen@makeup.cv" },
    { name: "Sofia Delgado",     email: "sofia@glam.cv" },
  ];

  const ownerPassword = await hash("senha123");
  const owners = await Promise.all(
    ownerData.map((o) =>
      prisma.user.create({
        data: { name: o.name, email: o.email, password: ownerPassword, role: "owner" },
      })
    )
  );

  const [tiago, nelson, armando, lucia, fernanda, rosa, ines, patricia, carmen, sofia] = owners;

  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  const today = new Date().toISOString().split("T")[0];

  // ── Helper ────────────────────────────────────────────────────
  function venueBase(slug: string, name: string, description: string, category: string,
    address: string, phone: string, lat: number, lng: number, ownerId: string) {
    return {
      slug, name, description, category, address, phone,
      latitude: lat, longitude: lng,
      status: "approved",
      subscriptionStatus: "active",
      subscriptionExpiresAt: expiresAt,
      ownerId,
    };
  }

  // ══════════════════════════════════════════════════════════════
  // 1. BARBEARIA ESTILO — Plateau, Praia, Santiago
  // ══════════════════════════════════════════════════════════════
  const b1 = await prisma.venue.create({
    data: venueBase(
      "barbearia-estilo-praia",
      "Barbearia Estilo",
      "Barbearia premium no coração do Plateau. Especializada em cortes clássicos, degradês e tratamento de barba com navalha.",
      "barbearia",
      "Rua de Lisboa, 12 — Plateau, Praia, Santiago",
      "+238 991 10 01",
      14.9315, -23.5133,
      tiago.id,
    ),
  });
  await prisma.servico.createMany({ data: [
    { name: "Corte Masculino",  description: "Corte na tesoura ou máquina",       duration: 30, price: 500,  venueId: b1.id },
    { name: "Barba Completa",   description: "Barba com navalha e toalha quente", duration: 30, price: 400,  venueId: b1.id },
    { name: "Corte + Barba",    description: "Combo completo",                    duration: 60, price: 800,  venueId: b1.id },
    { name: "Degradê",          description: "Degradê na máquina",                duration: 45, price: 600,  venueId: b1.id },
    { name: "Barba Desenhada",  description: "Design e acabamento de barba",      duration: 30, price: 450,  venueId: b1.id },
  ]});

  // ══════════════════════════════════════════════════════════════
  // 2. CLASSIC BARBER — Mindelo, São Vicente
  // ══════════════════════════════════════════════════════════════
  const b2 = await prisma.venue.create({
    data: venueBase(
      "classic-barber-mindelo",
      "Classic Barber",
      "O melhor corte masculino de Mindelo. Ambiente descontraído, profissionais experientes e estética americana clássica.",
      "barbearia",
      "Av. 5 de Julho, 88 — Mindelo, São Vicente",
      "+238 992 10 02",
      16.8908, -24.9805,
      nelson.id,
    ),
  });
  await prisma.servico.createMany({ data: [
    { name: "Corte Clássico",    description: "Corte tradicional na tesoura",      duration: 30, price: 500,  venueId: b2.id },
    { name: "Fade",              description: "Fade alto, médio ou baixo",          duration: 45, price: 650,  venueId: b2.id },
    { name: "Barba",             description: "Barba completa e hidratação",        duration: 30, price: 400,  venueId: b2.id },
    { name: "Corte + Fade",      description: "Corte com acabamento em fade",       duration: 60, price: 900,  venueId: b2.id },
    { name: "Sobrancelha",       description: "Design de sobrancelha masculina",    duration: 15, price: 200,  venueId: b2.id },
  ]});

  // ══════════════════════════════════════════════════════════════
  // 3. FOGO BARBER — São Filipe, Fogo
  // ══════════════════════════════════════════════════════════════
  const b3 = await prisma.venue.create({
    data: venueBase(
      "fogo-barber-sao-filipe",
      "Fogo Barber",
      "Barbearia moderna em São Filipe. Degradês perfeitos, barba trabalhada e atendimento personalizado ao estilo da ilha do Fogo.",
      "barbearia",
      "Rua Dr. Júlio Abreu, 5 — São Filipe, Fogo",
      "+238 993 10 03",
      14.8959, -24.4964,
      armando.id,
    ),
  });
  await prisma.servico.createMany({ data: [
    { name: "Corte Masculino",   description: "Tesoura ou máquina à escolha",      duration: 30, price: 450,  venueId: b3.id },
    { name: "Degradê",           description: "Degradê na máquina",                duration: 45, price: 600,  venueId: b3.id },
    { name: "Barba Desenhada",   description: "Contorno e acabamento de barba",    duration: 30, price: 400,  venueId: b3.id },
    { name: "Corte + Degradê",   description: "Corte completo com degradê",        duration: 60, price: 900,  venueId: b3.id },
    { name: "Pigmentação Barba", description: "Coloração natural para barba",      duration: 45, price: 700,  venueId: b3.id },
  ]});

  // ══════════════════════════════════════════════════════════════
  // 4. STUDIO LÚCIA — Assomada, Santiago (cabeleireiro)
  // ══════════════════════════════════════════════════════════════
  const s1 = await prisma.venue.create({
    data: venueBase(
      "studio-lucia-assomada",
      "Studio Lúcia",
      "Cabeleireiro feminino em Assomada com serviços completos de corte, coloração e tratamentos capilares. Referência no interior de Santiago.",
      "salao",
      "Av. Amílcar Cabral, 22 — Assomada, Santa Catarina, Santiago",
      "+238 994 10 04",
      15.0989, -23.6707,
      lucia.id,
    ),
  });
  await prisma.servico.createMany({ data: [
    { name: "Corte Feminino",    description: "Corte e finalização",               duration: 60,  price: 1500, venueId: s1.id },
    { name: "Escova",            description: "Escova modeladora ou lisa",          duration: 45,  price: 900,  venueId: s1.id },
    { name: "Coloração",         description: "Coloração completa com tinta",       duration: 120, price: 3500, venueId: s1.id },
    { name: "Hidratação",        description: "Hidratação profissional nutritiva",  duration: 90,  price: 2000, venueId: s1.id },
    { name: "Mechas",            description: "Mechas balayage ou tradicionais",    duration: 150, price: 4500, venueId: s1.id },
  ]});

  // ══════════════════════════════════════════════════════════════
  // 5. CABELO & ESTILO — Santa Maria, Sal (cabeleireiro)
  // ══════════════════════════════════════════════════════════════
  const s2 = await prisma.venue.create({
    data: venueBase(
      "cabelo-e-estilo-santa-maria",
      "Cabelo & Estilo",
      "Cabeleireiro no coração de Santa Maria, ilha do Sal. Especializado em cabelo liso, ondulado e crespo com técnicas modernas.",
      "salao",
      "Rua 1 de Junho, 14 — Santa Maria, Sal",
      "+238 995 10 05",
      16.5986, -22.9035,
      fernanda.id,
    ),
  });
  await prisma.servico.createMany({ data: [
    { name: "Corte Feminino",    description: "Corte personalizado",                duration: 60,  price: 1500, venueId: s2.id },
    { name: "Escova Progressiva",description: "Alisamento e volume controlado",     duration: 180, price: 6000, venueId: s2.id },
    { name: "Coloração",         description: "Coloração com tintas profissionais", duration: 120, price: 3500, venueId: s2.id },
    { name: "Penteado Casual",   description: "Penteado para o dia a dia",          duration: 45,  price: 800,  venueId: s2.id },
    { name: "Reconstrução",      description: "Tratamento intensivo de reconstrução", duration: 90, price: 2500, venueId: s2.id },
  ]});

  // ══════════════════════════════════════════════════════════════
  // 6. ARTE EM PENTEADOS — Espargos, Sal (penteados)
  // ══════════════════════════════════════════════════════════════
  const s3 = await prisma.venue.create({
    data: venueBase(
      "arte-em-penteados-espargos",
      "Arte em Penteados",
      "Especialista em penteados afro, tranças e penteados festivos em Espargos. Criatividade e técnica para cada ocasião especial.",
      "salao",
      "Rua de Espargos, 7 — Espargos, Sal",
      "+238 996 10 06",
      16.7541, -22.9448,
      rosa.id,
    ),
  });
  await prisma.servico.createMany({ data: [
    { name: "Tranças Box",       description: "Box braids compridas ou curtas",    duration: 180, price: 4000, venueId: s3.id },
    { name: "Penteado Festivo",  description: "Penteado elaborado para eventos",   duration: 90,  price: 2500, venueId: s3.id },
    { name: "Penteado Noiva",    description: "Penteado nupcial completo com teste",duration: 180, price: 6000, venueId: s3.id },
    { name: "Twist / Torção",    description: "Twist com cabelo natural",          duration: 120, price: 2000, venueId: s3.id },
    { name: "Penteado Afro",     description: "Estilo afro e natural hair",        duration: 60,  price: 1500, venueId: s3.id },
  ]});

  // ══════════════════════════════════════════════════════════════
  // 7. NAIL STUDIO — Achada Santo António, Praia (manicure)
  // ══════════════════════════════════════════════════════════════
  const n1 = await prisma.venue.create({
    data: venueBase(
      "nail-studio-praia",
      "Nail Studio Praia",
      "Estúdio especializado em unhas em Achada Santo António. Gel, acrílico, nail art e cuidados completos para mãos e pés.",
      "spa",
      "Rua do Palácio, 3 — Achada Santo António, Praia, Santiago",
      "+238 997 10 07",
      14.9198, -23.4985,
      ines.id,
    ),
  });
  await prisma.servico.createMany({ data: [
    { name: "Manicure Simples",  description: "Cutilagem, lixa e esmaltação",      duration: 45, price: 700,  venueId: n1.id },
    { name: "Pedicure",          description: "Cuidado completo dos pés",           duration: 60, price: 900,  venueId: n1.id },
    { name: "Gel / Shellac",     description: "Esmalte em gel de longa duração",   duration: 75, price: 2000, venueId: n1.id },
    { name: "Unhas de Acrílico", description: "Extensão e alongamento em acrílico",duration: 90, price: 3000, venueId: n1.id },
    { name: "Nail Art",          description: "Decoração artística de unhas",       duration: 60, price: 1500, venueId: n1.id },
  ]});

  // ══════════════════════════════════════════════════════════════
  // 8. UNHAS PERFEITAS — Mindelo, São Vicente (manicure)
  // ══════════════════════════════════════════════════════════════
  const n2 = await prisma.venue.create({
    data: venueBase(
      "unhas-perfeitas-mindelo",
      "Unhas Perfeitas",
      "Especialista em unhas no centro de Mindelo. Do clássico ao moderno — manicure, pedicure, gel e nail art para todas as ocasiões.",
      "spa",
      "Rua Senador Vera-Cruz, 19 — Mindelo, São Vicente",
      "+238 998 10 08",
      16.8850, -24.9750,
      patricia.id,
    ),
  });
  await prisma.servico.createMany({ data: [
    { name: "Manicure Completa", description: "Cutilagem, hidratação e esmaltação",duration: 60, price: 900,  venueId: n2.id },
    { name: "Pedicure Spa",      description: "Pedicure com esfoliação e massagem",duration: 75, price: 1200, venueId: n2.id },
    { name: "Gel Colorido",      description: "Gel em mais de 100 cores",          duration: 75, price: 2200, venueId: n2.id },
    { name: "Mani + Pedi",       description: "Manicure e pedicure juntos",        duration: 105,price: 1800, venueId: n2.id },
    { name: "Remoção de Gel",    description: "Remoção segura sem danos",          duration: 30, price: 500,  venueId: n2.id },
  ]});

  // ══════════════════════════════════════════════════════════════
  // 9. GLAM MAKEUP — Praia, Santiago (maquilhagem)
  // ══════════════════════════════════════════════════════════════
  const m1 = await prisma.venue.create({
    data: venueBase(
      "glam-makeup-praia",
      "Glam Makeup Studio",
      "Estúdio de maquilhagem profissional na Praia. Maquilhagem social, noiva, eventos e workshops para todas as ocasiões.",
      "spa",
      "Av. Cidade de Lisboa, 55 — Praia, Santiago",
      "+238 999 10 09",
      14.9280, -23.5060,
      carmen.id,
    ),
  });
  await prisma.servico.createMany({ data: [
    { name: "Maquilhagem Social",   description: "Maquilhagem para eventos e jantares",    duration: 60,  price: 2500, venueId: m1.id },
    { name: "Maquilhagem Noiva",    description: "Look nupcial completo com teste prévio", duration: 120, price: 6000, venueId: m1.id },
    { name: "Maquilhagem Artística",description: "Maquilhagem criativa e editorial",       duration: 90,  price: 4000, venueId: m1.id },
    { name: "Sobrancelha Design",   description: "Design e preenchimento de sobrancelhas", duration: 45,  price: 1500, venueId: m1.id },
    { name: "Workshop Maquilhagem", description: "Aula individual de auto-maquilhagem",    duration: 120, price: 5000, venueId: m1.id },
  ]});

  // ══════════════════════════════════════════════════════════════
  // 10. SOFIA BEAUTY — Santa Maria, Sal (maquilhagem)
  // ══════════════════════════════════════════════════════════════
  const m2 = await prisma.venue.create({
    data: venueBase(
      "sofia-beauty-santa-maria",
      "Sofia Beauty",
      "Maquilhadora profissional em Santa Maria. Especializada em looks para praias, festas e cerimónias — com produtos internacionais.",
      "spa",
      "Rua da Praia, 31 — Santa Maria, Sal",
      "+238 991 20 10",
      16.5950, -22.9000,
      sofia.id,
    ),
  });
  await prisma.servico.createMany({ data: [
    { name: "Maquilhagem Leve",     description: "Look natural e luminoso",                duration: 45,  price: 2000, venueId: m2.id },
    { name: "Maquilhagem Completa", description: "Full makeup para festa ou cerimónia",    duration: 75,  price: 3500, venueId: m2.id },
    { name: "Maquilhagem Noiva",    description: "Look nupcial + teste incluído",          duration: 120, price: 6500, venueId: m2.id },
    { name: "Lash & Brow",          description: "Pestanas e sobrancelhas",                duration: 60,  price: 1800, venueId: m2.id },
    { name: "Glitter / Festival",   description: "Look artístico para eventos",            duration: 60,  price: 2500, venueId: m2.id },
  ]});

  // ── Agendamentos de demonstração ─────────────────────────────
  const srv_b1 = await prisma.servico.findFirst({ where: { venueId: b1.id, name: "Corte Masculino" } });
  const srv_b2 = await prisma.servico.findFirst({ where: { venueId: b2.id, name: "Fade" } });
  const srv_s1 = await prisma.servico.findFirst({ where: { venueId: s1.id, name: "Corte Feminino" } });

  if (srv_b1) {
    await prisma.agendamento.create({
      data: { date: today, horario: "10:00", status: "confirmed", venueId: b1.id, servicoId: srv_b1.id, clientId: cliente.id },
    });
  }
  if (srv_b2) {
    await prisma.agendamento.create({
      data: { date: today, horario: "11:00", status: "confirmed", venueId: b2.id, servicoId: srv_b2.id, clientId: ana.id },
    });
  }
  if (srv_s1) {
    await prisma.agendamento.create({
      data: { date: today, horario: "14:00", status: "confirmed", venueId: s1.id, servicoId: srv_s1.id, clientId: rui.id },
    });
  }

  console.log("✅ Seed concluído — 10 estabelecimentos criados");
  console.log("");
  console.log("  Admin:      admin@bcu.cv             / admin123");
  console.log("");
  console.log("  Barbearias:");
  console.log("    tiago@barbearia.cv      — Barbearia Estilo (Praia, Santiago)");
  console.log("    nelson@barber.cv        — Classic Barber (Mindelo, São Vicente)");
  console.log("    armando@barbearia.cv    — Fogo Barber (São Filipe, Fogo)");
  console.log("");
  console.log("  Cabeleireiros:");
  console.log("    lucia@salao.cv          — Studio Lúcia (Assomada, Santiago)");
  console.log("    fernanda@cabeleireiro.cv — Cabelo & Estilo (Santa Maria, Sal)");
  console.log("");
  console.log("  Penteados:");
  console.log("    rosa@penteados.cv       — Arte em Penteados (Espargos, Sal)");
  console.log("");
  console.log("  Manicures / Unhas:");
  console.log("    ines@nails.cv           — Nail Studio Praia (Praia, Santiago)");
  console.log("    patricia@unhas.cv       — Unhas Perfeitas (Mindelo, São Vicente)");
  console.log("");
  console.log("  Maquiadoras:");
  console.log("    carmen@makeup.cv        — Glam Makeup Studio (Praia, Santiago)");
  console.log("    sofia@glam.cv           — Sofia Beauty (Santa Maria, Sal)");
  console.log("");
  console.log("  Clientes: cliente@email.cv / ana@email.cv / rui@email.cv  (senha: senha123)");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
