import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Termos e Condições",
  description: "Termos e condições de utilização da plataforma Bela & Belo.",
  robots: { index: true, follow: true },
};

export default function TermosPage() {
  return (
    <main className="max-w-[720px] mx-auto px-6 py-16">
      <p className="text-xs text-muted uppercase tracking-widest mb-2">Legal</p>
      <h1 className="font-serif text-4xl font-bold text-ink mb-3">Termos e Condições</h1>
      <p className="text-muted text-sm font-light mb-12">Última actualização: Maio de 2025</p>

      <div className="space-y-10 text-sm font-light text-ink leading-relaxed">

        <section>
          <h2 className="font-serif text-xl font-bold text-ink mb-3">1. Aceitação dos termos</h2>
          <p className="text-muted">
            Ao criar uma conta ou utilizar a plataforma <strong className="text-ink font-medium">Bela &amp; Belo</strong>,
            aceita estes Termos e Condições na íntegra. Se não concordar, não deve utilizar a plataforma.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-xl font-bold text-ink mb-3">2. O serviço</h2>
          <p className="text-muted mb-3">
            A Bela &amp; Belo é uma plataforma de intermediação que permite:
          </p>
          <ul className="list-disc list-inside space-y-2 text-muted">
            <li>A clientes agendar serviços em barbearias, salões e spas parceiros.</li>
            <li>A estabelecimentos parceiros gerir a sua agenda e receber agendamentos online.</li>
          </ul>
          <p className="text-muted mt-3">
            A Bela &amp; Belo não presta directamente serviços de barbearia ou beleza — é apenas intermediária.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-xl font-bold text-ink mb-3">3. Contas de utilizador</h2>
          <ul className="list-disc list-inside space-y-2 text-muted">
            <li>Deve ter pelo menos 16 anos para criar uma conta.</li>
            <li>É responsável pela segurança da sua senha.</li>
            <li>Não pode criar contas falsas ou partilhar credenciais.</li>
            <li>Reservamos o direito de suspender contas que violem estes termos.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-serif text-xl font-bold text-ink mb-3">4. Agendamentos</h2>
          <ul className="list-disc list-inside space-y-2 text-muted">
            <li>Um agendamento confirmado constitui um compromisso entre o cliente e o estabelecimento.</li>
            <li>Cancelamentos devem ser feitos com antecedência adequada — consulte a política de cada estabelecimento.</li>
            <li>A Bela &amp; Belo não é responsável por não comparências ou cancelamentos de parte dos estabelecimentos.</li>
            <li>Em caso de litígio, recomendamos contactar directamente o estabelecimento.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-serif text-xl font-bold text-ink mb-3">5. Parceiros (estabelecimentos)</h2>
          <ul className="list-disc list-inside space-y-2 text-muted">
            <li>O registo como parceiro está sujeito a aprovação pela nossa equipa.</li>
            <li>A subscrição mensal é cobrada via Stripe e renovada automaticamente.</li>
            <li>A falta de pagamento suspende a visibilidade do estabelecimento no marketplace.</li>
            <li>O parceiro é responsável pela exactidão das informações do seu perfil.</li>
            <li>O parceiro compromete-se a honrar os agendamentos recebidos através da plataforma.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-serif text-xl font-bold text-ink mb-3">6. Pagamentos</h2>
          <p className="text-muted">
            Os pagamentos de subscrição são processados pela Stripe. Os preços dos serviços são definidos
            pelos estabelecimentos parceiros e pagos directamente no estabelecimento (a plataforma não processa
            pagamentos de serviços entre cliente e estabelecimento).
          </p>
        </section>

        <section>
          <h2 className="font-serif text-xl font-bold text-ink mb-3">7. Propriedade intelectual</h2>
          <p className="text-muted">
            Todo o conteúdo da plataforma (design, código, marca, textos) é propriedade da Bela &amp; Belo
            e não pode ser reproduzido sem autorização escrita.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-xl font-bold text-ink mb-3">8. Limitação de responsabilidade</h2>
          <p className="text-muted">
            A Bela &amp; Belo não se responsabiliza por danos indirectos resultantes do uso da plataforma,
            incluindo mas não limitado a: falhas de serviço por parte dos estabelecimentos, perdas financeiras
            decorrentes de cancelamentos, ou indisponibilidade temporária da plataforma.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-xl font-bold text-ink mb-3">9. Alterações aos termos</h2>
          <p className="text-muted">
            Reservamos o direito de actualizar estes termos. Alterações significativas serão notificadas por
            e-mail com 30 dias de antecedência. A utilização continuada da plataforma após esse prazo
            implica a aceitação dos novos termos.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-xl font-bold text-ink mb-3">10. Lei aplicável</h2>
          <p className="text-muted">
            Estes termos são regidos pela legislação de Cabo Verde. Qualquer litígio será submetido aos
            tribunais competentes da República de Cabo Verde.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-xl font-bold text-ink mb-3">11. Contacto</h2>
          <p className="text-muted">
            Para questões sobre estes termos:{" "}
            <a href="mailto:suporte@bcu.cv" className="underline underline-offset-2 hover:text-ink transition-colors">
              suporte@bcu.cv
            </a>
          </p>
        </section>

      </div>
    </main>
  );
}
