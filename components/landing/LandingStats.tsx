const stats = [
  { value: "10K+", label: "Documents indexed" },
  { value: "<3s", label: "Average response" },
  { value: "99%", label: "Citation accuracy" },
  { value: "24/7", label: "Always available" },
  { value: "RAG", label: "Powered by AI" },
];

export function LandingStats() {
  return (
    <section id="stats" className="relative px-5 py-24 sm:px-6">
      <div className="mx-auto max-w-5xl text-center">
        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Move faster with{" "}
          <span className="text-gradient-blue">PDF Chat</span>
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-sm text-muted sm:text-base">
          Built for speed, accuracy, and trust. Your documents, your answers.
        </p>

        <div className="mt-12 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {stats.map((stat) => (
            <div key={stat.label} className="stat-card">
              <p className="stat-value">{stat.value}</p>
              <p className="mt-1 text-xs text-muted">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
