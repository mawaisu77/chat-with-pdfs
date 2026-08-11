import { Button } from "@/components/ui/Button";

const steps = [
  {
    label: "Upload",
    title: "Add your documents",
    description: "Drop PDFs or text files. Each document is chunked, embedded, and indexed automatically.",
    icon: (
      <path
        d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
  },
  {
    label: "Ask",
    title: "Chat with your files",
    description: "Ask questions in natural language. Our RAG pipeline retrieves the most relevant passages.",
    icon: (
      <path
        d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v8z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
  },
  {
    label: "Verify",
    title: "Check the sources",
    description: "Every answer includes citations — file name, page number, and relevance score.",
    icon: (
      <path
        d="M9 12l2 2 4-4M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
  },
];

export function LandingHowItWorks() {
  return (
    <section id="how-it-works" className="relative px-5 py-24 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <div className="glass-card overflow-hidden rounded-2xl p-8 sm:p-12">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
            <div>
              <span className="badge badge-brand">How it works</span>
              <h2 className="mt-4 text-2xl font-semibold tracking-tight sm:text-3xl">
                From upload to answer in seconds
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-muted sm:text-base">
                PDF Chat uses retrieval-augmented generation to ground every response
                in your uploaded documents — no hallucinations, no guesswork.
              </p>
              <Button href="/dashboard" variant="accent" size="lg" className="mt-8">
                Open workspace
              </Button>
            </div>

            <div className="flex flex-col gap-4">
              {steps.map((step, index) => (
                <div
                  key={step.label}
                  className="flex gap-4 rounded-xl border border-border bg-background-subtle/50 p-4"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-subtle text-brand">
                    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
                      {step.icon}
                    </svg>
                  </span>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-brand">
                      Step {index + 1} · {step.label}
                    </p>
                    <h3 className="mt-1 text-sm font-semibold">{step.title}</h3>
                    <p className="mt-1 text-xs leading-relaxed text-muted">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
