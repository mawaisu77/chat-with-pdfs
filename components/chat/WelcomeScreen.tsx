const suggestions = [
  {
    title: "Summarize",
    prompt: "Summarize the uploaded document in 3 bullet points.",
    icon: (
      <path
        d="M4 6h16M4 12h16M4 18h10"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    ),
  },
  {
    title: "Key topics",
    prompt: "What are the key topics covered in my file?",
    icon: (
      <path
        d="M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM21 21l-4.3-4.3"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
  },
  {
    title: "Important facts",
    prompt: "Find the most important facts from the indexed documents.",
    icon: (
      <path
        d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
  },
];

type WelcomeScreenProps = {
  onSuggestionClick: (text: string) => void;
};

export function WelcomeScreen({ onSuggestionClick }: WelcomeScreenProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-10 px-2 py-8 text-center">
      <div className="space-y-4">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-brand-border bg-brand-subtle text-brand shadow-[0_0_32px_rgba(56,189,248,0.15)]">
          <svg viewBox="0 0 24 24" fill="none" className="h-8 w-8">
            <path
              d="M4 5a2 2 0 0 1 2-2h9l5 5v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5z"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinejoin="round"
            />
            <path d="M14 3v6h6" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
          </svg>
        </span>

        <div className="space-y-2">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">How can I help?</h2>
          <p className="mx-auto max-w-lg text-sm leading-relaxed text-muted sm:text-base">
            Ask anything about your uploaded documents. Every answer includes source citations you can verify.
          </p>
        </div>
      </div>

      <div className="grid w-full max-w-3xl gap-3 sm:grid-cols-3">
        {suggestions.map((suggestion) => (
          <button
            key={suggestion.prompt}
            type="button"
            onClick={() => onSuggestionClick(suggestion.prompt)}
            className="btn-prompt group"
          >
            <span className="btn-prompt-icon">
              <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
                {suggestion.icon}
              </svg>
            </span>
            <span className="text-sm font-semibold">{suggestion.title}</span>
            <span className="text-xs leading-relaxed text-muted">{suggestion.prompt}</span>
            <span className="btn-prompt-arrow">
              <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
                <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
