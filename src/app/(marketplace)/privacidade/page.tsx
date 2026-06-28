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
      <p className="text-muted text-sm font-light mb-12">Última actualização: Junho de 2026</p>

      <div className="prose-like space-y-10 text-sm font-light text-ink leading-relaxed">

        <section>
          <h2 className="font-serif text-xl font-bold text-ink mb-3">1. Quem somos</h2>
          <p>
            A <strong className="font-medium">Bela &amp; Belo</strong> é uma
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
            <li><span className="text-ink font-medium">Dados de convidados:</span> nome e telefone fornecidos ao agendar sem conta — utilizados exclusivamente para esse agendamento.</li>
            <li><span className="text-ink font-medium">Dados de estabelecimento (parceiros):</span> nome, endereço, telefone, categoria e localização geográfica.</li>
            <li><span className="text-ink font-medium">Dados de subscrição (parceiros):</span> geridos internamente pela equipa Bela &amp; Belo — não armazenamos dados de cartão.</li>
            <li><span className="text-ink font-medium">Dados de sessão:</span> cookies técnicos necessários para a autenticação.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-serif text-xl font-bold text-ink mb-3">3. Como usamos os seus dados</h2>
          <ul className="list-disc list-inside space-y-2 text-muted">
            <li>Criar e gerir a sua conta.</li>
            <li>Processar e confirmar agendamentos.</li>
            <li>Gerir subscrições e pagamentos dos parceiros.</li>
            <li>Enviar notificações na plataforma relacionadas com os seus agendamentos.</li>
            <li>Melhorar a plataforma com base em dados agregados e anónimos.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-serif text-xl font-bold text-ink mb-3">4. Cookies e análise</h2>
          <p className="text-muted mb-3">
            Utilizamos cookies estritamente necessários para a autenticação da sessão. Ao utilizar a plataforma,
            aceita o uso destes cookies técnicos.
          </p>
          <p className="text-muted">
            Utilizamos também o <span className="text-ink font-medium">Vercel Analytics</span> e o{" "}
            <span className="text-ink font-medium">Vercel Speed Insights</span> para monitorização de desempenho
            e análise de visitas de forma agregada e sem identificação pessoal. Estes serviços são fornecidos pela
            Vercel Inc. e não partilham os dados com terceiros para fins publicitários.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-xl font-bold text-ink mb-3">5. Partilha de dados</h2>
          <p className="text-muted mb-3">
            Não vendemos nem partilhamos os seus dados com terceiros para fins comerciais.
            Os dados são partilhados apenas com:
          </p>
          <ul className="list-disc list-inside space-y-2 text-muted">
            <li><span className="text-ink font-medium">Vercel Inc.</span> — alojamento, infraestrutura e análise de desempenho.</li>
            <li><span className="text-ink font-medium">Supabase</span> — armazenamento seguro da base de dados.</li>
            <li><span className="text-ink font-medium">Google</span> — autenticação opcional via Google (se utilizar "Continuar com Google").</li>
            <li>O <span className="text-ink font-medium">estabelecimento parceiro</span> recebe o nome do cliente registado, ou o nome e telefone fornecidos no caso de agendamentos de convidados, para gestão do agendamento.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-serif text-xl font-bold text-ink mb-3">6. Os seus direitos</h2>
          <p className="text-muted mb-3">
            Ao abrigo da Lei n.º 133/V/2001 (Lei de Protecção de Dados de Cabo Verde) e demais legislação aplicável, tem direito a:
          </p>
          <ul className="list-disc list-inside space-y-2 text-muted">
            <li>Aceder aos seus dados pessoais.</li>
            <li>Corrigir dados incorrectos.</li>
            <li>
              Eliminar a sua conta e dados — pode fazê-lo directamente em{" "}
              <a href="/minha-conta" className="underline underline-offset-2 hover:text-ink transition-colors">
                A Minha Conta
              </a>{" "}
              ou contactando-nos.
            </li>
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
            Os dados de conta são conservados enquanto a conta estiver activa. Ao eliminar a conta, os dados
            pessoais identificáveis são removidos; os registos de agendamento são anonimizados e mantidos no
            histórico do estabelecimento sem qualquer ligação à sua identidade. Dados de convidados são conservados
            apenas pelo tempo necessário à prestação do serviço agendado.
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
          <h2 className="font-serif text-xl font-bold text-ink mb-3">10. Termos e Condições</h2>
          <p className="text-muted">
            Esta Política de Privacidade faz parte integrante dos nossos{" "}
            <a href="/termos" className="underline underline-offset-2 hover:text-ink transition-colors">
              Termos e Condições
            </a>
            , que regem a utilização da plataforma.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-xl font-bold text-ink mb-3">11. Contacto</h2>
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
