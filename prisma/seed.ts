import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const hash = (p: string) => bcrypt.hash(p, 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@bcu.cv" },
    update: {},
    create: { name: "Admin BCU", email: "admin@bcu.cv", password: await hash("admin123"), role: "admin" },
  });

  const joao = await prisma.user.upsert({
    where: { email: "joao@barbearia.cv" },
    update: {},
    create: { name: "João Évora", email: "joao@barbearia.cv", password: await hash("senha123"), role: "owner" },
  });

  const maria = await prisma.user.upsert({
    where: { email: "maria@salao.cv" },
    update: {},
    create: { name: "Maria Fonseca", email: "maria@salao.cv", password: await hash("senha123"), role: "owner" },
  });

  const pedro = await prisma.user.upsert({
    where: { email: "pedro@barbearia.cv" },
    update: {},
    create: { name: "Pedro Silva", email: "pedro@barbearia.cv", password: await hash("senha123"), role: "owner" },
  });

  const fatima = await prisma.user.upsert({
    where: { email: "fatima@spa.cv" },
    update: {},
    create: { name: "Fátima Rodrigues", email: "fatima@spa.cv", password: await hash("senha123"), role: "owner" },
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

  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  // Praia (Plateau, Santiago): 14.9315° N, -23.5133° W
  const barbearia = await prisma.venue.upsert({
    where: { slug: "barbearia-do-joao-praia" },
    update: {
      name: "Barbearia do Nho João",
      description: "A melhor barbearia da Praia, especializada em cortes clássicos e modernos. Localizada no coração de Santiago.",
      address: "Rua de Lisboa, 12 — Plateau, Praia, Santiago",
      phone: "+238 991 00 01",
      latitude: 14.9315,
      longitude: -23.5133,
      subscriptionStatus: "active",
      subscriptionExpiresAt: expiresAt,
    },
    create: {
      slug: "barbearia-do-joao-praia",
      name: "Barbearia do Nho João",
      description: "A melhor barbearia da Praia, especializada em cortes clássicos e modernos. Localizada no coração de Santiago.",
      category: "barbearia",
      address: "Rua de Lisboa, 12 — Plateau, Praia, Santiago",
      phone: "+238 991 00 01",
      latitude: 14.9315,
      longitude: -23.5133,
      status: "approved",
      subscriptionStatus: "active",
      subscriptionExpiresAt: expiresAt,
      ownerId: joao.id,
    },
  });

  // Mindelo (São Vicente): 16.8908° N, -24.9805° W
  const salao = await prisma.venue.upsert({
    where: { slug: "salao-da-nha-maria-mindelo" },
    update: {
      name: "Salão da Nhá Maria",
      description: "Salão completo em Mindelo com atendimento especializado em cabelos, unhas e tratamentos estéticos.",
      address: "Av. 5 de Julho, 45 — Mindelo, São Vicente",
      phone: "+238 992 00 02",
      latitude: 16.8908,
      longitude: -24.9805,
      subscriptionStatus: "active",
      subscriptionExpiresAt: expiresAt,
    },
    create: {
      slug: "salao-da-nha-maria-mindelo",
      name: "Salão da Nhá Maria",
      description: "Salão completo em Mindelo com atendimento especializado em cabelos, unhas e tratamentos estéticos.",
      category: "salao",
      address: "Av. 5 de Julho, 45 — Mindelo, São Vicente",
      phone: "+238 992 00 02",
      latitude: 16.8908,
      longitude: -24.9805,
      status: "approved",
      subscriptionStatus: "active",
      subscriptionExpiresAt: expiresAt,
      ownerId: maria.id,
    },
  });

  // São Filipe (Fogo): 14.8959° N, -24.4964° W
  const barbeariaPedro = await prisma.venue.upsert({
    where: { slug: "barbearia-do-pedro-sao-filipe" },
    update: {
      name: "Barbearia do Pedro",
      description: "Barbearia moderna em São Filipe, especializada em degradês e cortes contemporâneos.",
      address: "Rua Dr. Júlio Abreu — São Filipe, Fogo",
      phone: "+238 993 00 03",
      latitude: 14.8959,
      longitude: -24.4964,
      subscriptionStatus: "active",
      subscriptionExpiresAt: expiresAt,
    },
    create: {
      slug: "barbearia-do-pedro-sao-filipe",
      name: "Barbearia do Pedro",
      description: "Barbearia moderna em São Filipe, especializada em degradês e cortes contemporâneos.",
      category: "barbearia",
      address: "Rua Dr. Júlio Abreu — São Filipe, Fogo",
      phone: "+238 993 00 03",
      latitude: 14.8959,
      longitude: -24.4964,
      status: "approved",
      subscriptionStatus: "active",
      subscriptionExpiresAt: expiresAt,
      ownerId: pedro.id,
    },
  });

  // Cidade Velha (Santiago): 14.9149° N, -23.6068° W
  const spaVenue = await prisma.venue.upsert({
    where: { slug: "spa-cidade-velha" },
    update: {
      name: "Spa Cidade Velha",
      description: "Espaço de bem-estar e relaxamento na histórica Cidade Velha. Massagens, tratamentos faciais e rituais de spa.",
      address: "Largo do Pelourinho — Cidade Velha, Santiago",
      phone: "+238 994 00 04",
      latitude: 14.9149,
      longitude: -23.6068,
      subscriptionStatus: "active",
      subscriptionExpiresAt: expiresAt,
    },
    create: {
      slug: "spa-cidade-velha",
      name: "Spa Cidade Velha",
      description: "Espaço de bem-estar e relaxamento na histórica Cidade Velha. Massagens, tratamentos faciais e rituais de spa.",
      category: "spa",
      address: "Largo do Pelourinho — Cidade Velha, Santiago",
      phone: "+238 994 00 04",
      latitude: 14.9149,
      longitude: -23.6068,
      status: "approved",
      subscriptionStatus: "active",
      subscriptionExpiresAt: expiresAt,
      ownerId: fatima.id,
    },
  });

  await Promise.all([
    prisma.servico.upsert({
      where: { id: "srv-spa-1" },
      update: { name: "Massagem Relaxante", price: 2500, duration: 60 },
      create: { id: "srv-spa-1", name: "Massagem Relaxante", description: "Massagem corporal com óleos essenciais", duration: 60, price: 2500, venueId: spaVenue.id },
    }),
    prisma.servico.upsert({
      where: { id: "srv-spa-2" },
      update: { name: "Tratamento Facial", price: 3000, duration: 75 },
      create: { id: "srv-spa-2", name: "Tratamento Facial", description: "Limpeza profunda e hidratação facial", duration: 75, price: 3000, venueId: spaVenue.id },
    }),
    prisma.servico.upsert({
      where: { id: "srv-spa-3" },
      update: { name: "Ritual Completo", price: 5000, duration: 120 },
      create: { id: "srv-spa-3", name: "Ritual Completo", description: "Massagem + facial + banho de ervas", duration: 120, price: 5000, venueId: spaVenue.id },
    }),
  ]);

  const servicosBarbearia = await Promise.all([
    prisma.servico.upsert({
      where: { id: "srv-b-1" },
      update: { name: "Corte Masculino", price: 500, duration: 30 },
      create: { id: "srv-b-1", name: "Corte Masculino", description: "Corte na tesoura ou máquina", duration: 30, price: 500, venueId: barbearia.id },
    }),
    prisma.servico.upsert({
      where: { id: "srv-b-2" },
      update: { name: "Barba", price: 350, duration: 30 },
      create: { id: "srv-b-2", name: "Barba", description: "Barba completa com navalha", duration: 30, price: 350, venueId: barbearia.id },
    }),
    prisma.servico.upsert({
      where: { id: "srv-b-3" },
      update: { name: "Corte + Barba", price: 800, duration: 60 },
      create: { id: "srv-b-3", name: "Corte + Barba", description: "Combo completo", duration: 60, price: 800, venueId: barbearia.id },
    }),
  ]);

  await Promise.all([
    prisma.servico.upsert({
      where: { id: "srv-s-1" },
      update: { name: "Corte Feminino", price: 1500, duration: 60 },
      create: { id: "srv-s-1", name: "Corte Feminino", description: "Corte e finalização", duration: 60, price: 1500, venueId: salao.id },
    }),
    prisma.servico.upsert({
      where: { id: "srv-s-2" },
      update: { name: "Manicure", price: 700, duration: 45 },
      create: { id: "srv-s-2", name: "Manicure", description: "Cutilagem e esmaltação", duration: 45, price: 700, venueId: salao.id },
    }),
    prisma.servico.upsert({
      where: { id: "srv-s-3" },
      update: { name: "Hidratação", price: 2000, duration: 90 },
      create: { id: "srv-s-3", name: "Hidratação", description: "Hidratação profissional", duration: 90, price: 2000, venueId: salao.id },
    }),
  ]);

  await Promise.all([
    prisma.servico.upsert({
      where: { id: "srv-p-1" },
      update: { name: "Degradê", price: 600, duration: 45 },
      create: { id: "srv-p-1", name: "Degradê", description: "Degradê na máquina", duration: 45, price: 600, venueId: barbeariaPedro.id },
    }),
    prisma.servico.upsert({
      where: { id: "srv-p-2" },
      update: { name: "Corte + Degradê", price: 900, duration: 60 },
      create: { id: "srv-p-2", name: "Corte + Degradê", description: "Corte completo com degradê", duration: 60, price: 900, venueId: barbeariaPedro.id },
    }),
    prisma.servico.upsert({
      where: { id: "srv-p-3" },
      update: { name: "Barba Desenhada", price: 400, duration: 30 },
      create: { id: "srv-p-3", name: "Barba Desenhada", description: "Design e acabamento de barba", duration: 30, price: 400, venueId: barbeariaPedro.id },
    }),
  ]);

  const today = new Date().toISOString().split("T")[0];
  await prisma.agendamento.upsert({
    where: { id: "agend-1" },
    update: {},
    create: {
      id: "agend-1",
      date: today,
      horario: "10:00",
      status: "confirmed",
      venueId: barbearia.id,
      servicoId: servicosBarbearia[0].id,
      clientId: cliente.id,
    },
  });

  await prisma.agendamento.upsert({
    where: { id: "agend-2" },
    update: {},
    create: {
      id: "agend-2",
      date: today,
      horario: "11:00",
      status: "confirmed",
      venueId: barbeariaPedro.id,
      servicoId: "srv-p-1",
      clientId: ana.id,
    },
  });

  await prisma.agendamento.upsert({
    where: { id: "agend-3" },
    update: {},
    create: {
      id: "agend-3",
      date: today,
      horario: "14:00",
      status: "confirmed",
      venueId: salao.id,
      servicoId: "srv-s-2",
      clientId: rui.id,
    },
  });

  console.log("✅ Seed concluído com sucesso!");
  console.log(`   Admin:      admin@bcu.cv       / admin123`);
  console.log(`   Owner 1:    joao@barbearia.cv  / senha123  — Barbearia do Nho João (Praia, Santiago)`);
  console.log(`   Owner 2:    maria@salao.cv     / senha123  — Salão da Nhá Maria (Mindelo, São Vicente)`);
  console.log(`   Owner 3:    pedro@barbearia.cv / senha123  — Barbearia do Pedro (São Filipe, Fogo)`);
  console.log(`   Owner 4:    fatima@spa.cv      / senha123  — Spa Cidade Velha (Cidade Velha, Santiago)`);
  console.log(`   Cliente 1:  cliente@email.cv   / senha123  — Carlos Tavares`);
  console.log(`   Cliente 2:  ana@email.cv        / senha123  — Ana Lima`);
  console.log(`   Cliente 3:  rui@email.cv        / senha123  — Rui Monteiro`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
