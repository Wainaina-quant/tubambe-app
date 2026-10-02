export default function LegalPage({ title, updated, children }) {
  return (
    <div className="max-w-xl mx-auto px-5 pt-8 pb-16">
      <h1 className="font-display font-extrabold text-2xl mb-1">{title}</h1>
      {updated && <p className="text-[11.5px] text-coral font-semibold mb-6">{updated}</p>}
      <div className="flex flex-col gap-4 text-[14px] leading-relaxed text-cream/90 [&_h2]:font-display [&_h2]:font-bold [&_h2]:text-[15px] [&_h2]:text-cream [&_h2]:mt-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:flex [&_ul]:flex-col [&_ul]:gap-1.5">
        {children}
      </div>
    </div>
  );
}
