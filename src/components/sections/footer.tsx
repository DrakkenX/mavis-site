export default function Footer() {
  return (
    <footer className="relative pt-10 pb-12 px-8">
      <div className="max-w-[1280px] mx-auto flex flex-col items-center gap-5 text-center">

        {/* Brand mark */}
        <div
          className="font-display text-[20px] text-mavis-ink-900 tracking-tight"
          aria-label="MAVIS"
        >
          mavis
        </div>

        {/* Thin gold rule */}
        <div
          aria-hidden="true"
          style={{
            width: 32,
            height: 1,
            backgroundColor: 'var(--mavis-gold)',
            opacity: 0.35,
          }}
        />

        {/* Studio + year */}
        <div className="font-mono text-[10px] tracking-[0.28em] uppercase text-mavis-ink-500">
          © Studio Folio · MMXXVI
        </div>

      </div>
    </footer>
  );
}
