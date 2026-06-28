import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Política de Privacidade",
  description: "Como a Bela & Belo trata os seus dados pessoais.",
  robots: { index: true, follow: true },
};

export default function PrivacidadePage() {
  return (
    <main className="max-w-[720px] mx-auto px-6 py-16">
      <p className="text-xs text-muted uppercase tracking-widest mb-2">Legal</p>
      <h1 className="font-serif text-4xl font-bold text-ink mb-3">Política de Privacidade</h1>
      <p className="text-muted text-sm font-light mb-12">Última actualização: Maio de 2025</p>

      <div className="prose-like space-y-10 text-sm font-light text-ink leading-relaxed">

        <section>
          <h2 className="font-serif text-xl font-bold text-ink mb-3">1. Quem somos</h2>
          <p>
            A <strong className="font-medium">Bela &amp; Belo</strong> (anteriormente "Barba, Cabelo e Unha") é uma
            plataforma de agendamento online que liga clientes a barbearias, salões de beleza e spas em Cabo Verde.
            O responsável pelo tratamento de dados é a Bela &amp; Belo, contactável em{" "}
            <a href="mailto:privacidade@belabelo.cv" className="underline underline-offset-2 hover:text-muted transition-colors">
              privacidade@belabelo.cv
            </a>.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-xl font-bold text-ink mb-3">2. Dados que recolhemos</h2>
          <ul className="list-disc list-inside space-y-2 text-muted">
            <li><span className="text-ink font-medium">Dados de conta:</span> nome, endereço de e-mail e senha encriptada.</li>
            <li><span className="text-ink font-medium">Dados de agendamento:</span> serviço escolhido, data, horário e estabelecimento.</li>
            <li><span className="text-ink font-medium">Dados de estabelecimento (parceiros):</span> nome, endereço, telefone, categoria e localização geográfica.</li>
            <li><span className="text-ink font-medium">Dados de pagamento:</span> geridos directamente pela Stripe — não armazenamos números de cartão.</li>
            <li><span className="text-ink font-medium">Dados de sessão:</span> cookies técnicos necessários para a autenticação.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-serif text-xl font-bold text-ink mb-3">3. Como usamos os seus dados</h2>
          <ul className="list-disc list-inside space-y-2 text-muted">
            <li>Criar e gerir a sua conta.</li>
            <li>Processar e confirmar agendamentos.</li>
            <li>Gerir subscrições e pagamentos dos parceiros.</li>
            <li>Enviar notificações relacionadas com os seus agendamentos.</li>
            <li>Melhorar a plataforma com base em dados agregados e anónimos.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-serif text-xl font-bold text-ink mb-3">4. Cookies</h2>
          <p className="text-muted">
            Utilizamos apenas cookies estritamente necessários para a autenticação da sessão. Não usamos cookies
            de rastreamento, publicidade ou análise de terceiros. Ao utilizar a plataforma, aceita o uso destes
            cookies técnicos.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-xl font-bold text-ink mb-3">5. Partilha de dados</h2>
          <p className="text-muted mb-3">
            Não vendemos nem partilhamos os seus dados com terceiros para fins comerciais.
            Os dados são partilhados apenas com:
          </p>
          <ul className="list-disc list-inside space-y-2 text-muted">
            <li><span className="text-ink font-medium">Stripe</span> — processamento de pagamentos.</li>
            <li><span className="text-ink font-medium">Supabase/PostgreSQL</span> — armazenamento seguro da base de dados.</li>
            <li><span className="text-ink font-medium">Vercel</span> — alojamento e infraestrutura.</li>
            <li>O <span className="text-ink font-medium">estabelecimento parceiro</span> recebe o nome e telefone do cliente para gerir o agendamento.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-serif text-xl font-bold text-ink mb-3">6. Os seus direitos</h2>
          <p className="text-muted mb-3">
            Ao abrigo do RGPD e legislação aplicável, tem direito a:
          </p>
          <ul className="list-disc list-inside space-y-2 text-muted">
            <li>Aceder aos seus dados pessoais.</li>
            <li>Corrigir dados incorrectos.</li>
            <li>Solicitar a eliminação da sua conta e dados.</li>
            <li>Opor-se ao tratamento dos seus dados.</li>
          </ul>
          <p className="text-muted mt-3">
            Para exercer estes direitos, contacte-nos em{" "}
            <a href="mailto:privacidade@belabelo.cv" className="underline underline-offset-2 hover:text-ink transition-colors">
              privacidade@belabelo.cv
            </a>.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-xl font-bold text-ink mb-3">7. Retenção de dados</h2>
          <p className="text-muted">
            Os dados de conta são conservados enquanto a conta estiver activa. Os dados de agendamento são
            conservados por 12 meses para fins de histórico. Pode solicitar a eliminação antecipada a qualquer momento.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-xl font-bold text-ink mb-3">8. Segurança</h2>
          <p className="text-muted">
            As senhas são armazenadas com encriptação bcrypt. Todas as comunicações usam HTTPS.
            O acesso à base de dados é restrito por ambiente e credenciais seguras.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-xl font-bold text-ink mb-3">9. Alterações a esta política</h2>
          <p className="text-muted">
            Podemos actualizar esta política periodicamente. Alterações significativas serão comunicadas por e-mail
            ou através de um aviso na plataforma. A data de última actualização está sempre indicada no topo desta página.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-xl font-bold text-ink mb-3">10. Contacto</h2>
          <p className="text-muted">
            Para questões sobre privacidade:{" "}
            <a href="mailto:privacidade@belabelo.cv" className="underline underline-offset-2 hover:text-ink transition-colors">
              privacidade@belabelo.cv
            </a>
          </p>
        </section>

      </div>
    </main>
  );
}
