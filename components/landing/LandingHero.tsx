import { Button } from "@/components/ui/Button";

export function LandingHero() {
  return (
    <section className="relative flex min-h-[90vh] flex-col items-center justify-center overflow-hidden px-5 pt-28 pb-20 text-center">
      <div className="stars-bg pointer-events-none absolute inset-0 opacity-60" aria-hidden="true" />
      <div
        className="hero-glow -top-20 left-1/2 h-64 w-64 -translate-x-1/2 bg-sky-400/20"
        aria-hidden="true"
      />
      <div className="hero-horizon" aria-hidden="true" />

      <div className="relative z-10 mx-auto max-w-3xl animate-rise">
        <p className="text-sm font-medium tracking-wide text-brand sm:text-base">PDF Chat</p>

        <h1 className="mt-4 text-4xl font-semibold leading-tight tracking-tight sm:text-5xl md:text-6xl">
          Intelligence for{" "}
          <span className="text-gradient">Your Documents</span>
        </h1>

        <p className="mt-3 text-lg font-medium text-muted sm:text-xl">
          Upload. Ask. Verify.
        </p>

        <p className="mx-auto mt-5 max-w-xl text-sm leading-relaxed text-muted-subtle sm:text-base">
          Upload PDFs, ask questions in natural language, and get grounded answers
          with source citations you can trust.
        </p>

        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button href="/dashboard" variant="accent" size="lg">
            Try Now
            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
              <path
                d="M5 12h14M13 6l6 6-6 6"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Button>
          <Button href="/auth/sign-up" variant="secondary" size="lg">
            Create account
          </Button>
        </div>

        <div className="mt-12 flex flex-col items-center gap-3">
          <div className="flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <svg
                key={i}
                viewBox="0 0 24 24"
                fill="currentColor"
                className="h-4 w-4 text-purple-400"
                aria-hidden="true"
              >
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            ))}
          </div>
          <p className="text-xs text-muted-subtle">Trusted by teams who need answers from documents</p>
        </div>
      </div>
    </section>
  );
}
