const features = [
  {
    title: "For Professionals",
    description:
      "Upload contracts, reports, and research papers. Get instant summaries and answers grounded in your files.",
    accent: "from-sky-500/20 to-blue-600/10",
    icon: (
      <path
        d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
    span: "col-span-1 row-span-1",
  },
  {
    title: "For Teams",
    description:
      "Organize documents into sets. Share knowledge bases and chat history across your workspace.",
    accent: "from-purple-500/20 to-indigo-600/10",
    visual: true,
    span: "col-span-1 row-span-2 md:col-span-1",
  },
  {
    title: "For Students",
    description:
      "Turn lecture notes and textbooks into a searchable AI assistant. Study smarter with cited answers.",
    accent: "from-cyan-500/20 to-teal-600/10",
    icon: (
      <path
        d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
    span: "col-span-1 row-span-1",
  },
  {
    title: "Source Citations",
    description:
      "Every answer shows the exact file, page, and section it came from — so you can verify instantly.",
    accent: "from-blue-500/20 to-violet-600/10",
    icon: (
      <path
        d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
    span: "col-span-1 row-span-1",
  },
];

function GlowRing() {
  return (
    <div className="relative flex h-full min-h-[180px] items-center justify-center" aria-hidden="true">
      <div className="absolute h-32 w-32 rounded-full border border-sky-400/30 shadow-[0_0_40px_rgba(56,189,248,0.3)]" />
      <div className="absolute h-24 w-24 rounded-full border-2 border-transparent bg-gradient-to-br from-sky-400 via-purple-500 to-pink-500 opacity-80 [mask:linear-gradient(#fff_0_0)_content-box,linear-gradient(#fff_0_0)] [mask-composite:exclude] p-[3px]" />
      <div className="absolute h-16 w-16 rounded-full bg-gradient-to-br from-sky-400/40 to-purple-500/40 blur-xl" />
    </div>
  );
}

export function LandingFeatures() {
  return (
    <section id="features" className="relative px-5 py-24 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <div className="text-center">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Accelerate{" "}
            <span className="text-gradient-blue">Document Intelligence</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-muted sm:text-base">
            Upload your files, ask questions in plain language, and get answers
            backed by the documents you trust.
          </p>
        </div>

        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <article
              key={feature.title}
              className={`bento-card ${feature.span}`}
            >
              <div
                className={`bento-glow -right-8 -top-8 h-32 w-32 bg-gradient-to-br ${feature.accent}`}
                aria-hidden="true"
              />

              {feature.visual ? (
                <GlowRing />
              ) : (
                <>
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-brand-border bg-brand-subtle text-brand">
                    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
                      {feature.icon}
                    </svg>
                  </span>
                  <h3 className="mt-4 text-base font-semibold">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{feature.description}</p>
                </>
              )}

              {feature.visual && (
                <div className="mt-4">
                  <h3 className="text-base font-semibold">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{feature.description}</p>
                </div>
              )}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
