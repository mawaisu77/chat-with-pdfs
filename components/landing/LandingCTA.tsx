import { Button } from "@/components/ui/Button";

export function LandingCTA() {
  return (
    <section className="relative px-5 py-24 sm:px-6">
      <div className="relative mx-auto max-w-3xl overflow-hidden rounded-2xl border border-brand-border px-8 py-16 text-center">
        <div
          className="hero-glow absolute left-1/2 top-0 h-48 w-96 -translate-x-1/2 bg-sky-400/15"
          aria-hidden="true"
        />

        <div className="relative z-10">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl md:text-4xl">
            Join the{" "}
            <span className="text-gradient">Document AI</span>{" "}
            revolution
          </h2>
          <p className="mx-auto mt-4 max-w-md text-sm text-muted sm:text-base">
            Start chatting with your PDFs today. Free to try, no credit card required.
          </p>
          <Button href="/auth/sign-up" variant="accent" size="lg" className="mt-8">
            Get started free
          </Button>
        </div>
      </div>
    </section>
  );
}
