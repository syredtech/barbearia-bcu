"use client";

interface Props {
  name: string;
  slug: string;
}

export default function ShareButton({ name, slug }: Props) {
  async function share() {
    const url = `${window.location.origin}/estabelecimentos/${slug}`;
    if (navigator.share) {
      await navigator.share({ title: name, url }).catch(() => {});
    } else {
      await navigator.clipboard.writeText(url).catch(() => {});
      alert("Link copiado!");
    }
  }

  return (
    <button
      onClick={share}
      className="inline-flex items-center gap-2 border border-[#ebebeb] text-muted px-4 py-2 rounded-pill text-sm
                 hover:border-ink hover:text-ink transition-all duration-200 mt-5"
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <circle cx="18" cy="5" r="3"/>
        <circle cx="6" cy="12" r="3"/>
        <circle cx="18" cy="19" r="3"/>
        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
        <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
      </svg>
      Partilhar
    </button>
  );
}
