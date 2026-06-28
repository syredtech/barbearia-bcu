interface Props {
  status: string | null | undefined;
  expiresAt: Date | string | null | undefined;
  venueStatus?: string;
}

export default function AssinaturaCard({ status, expiresAt }: Props) {
  const isActive =
    status === "active" && expiresAt && new Date(expiresAt) > new Date();

  return (
    <div className="border border-[#ebebeb] rounded-card p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-muted mb-1">
            Assinatura
          </p>
          <p className={`text-sm font-medium ${isActive ? "text-ink" : "text-red-600"}`}>
            {isActive ? "Ativa" : "Inativa"}
          </p>
          {expiresAt && (
            <p className="text-xs text-muted mt-0.5">
              Expira em {new Date(expiresAt).toLocaleDateString("pt-CV", {
                day: "numeric", month: "long", year: "numeric",
              })}
            </p>
          )}
        </div>
        {isActive && <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />}
      </div>
    </div>
  );
}
