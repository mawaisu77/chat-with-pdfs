type TypingIndicatorProps = {
  label?: string;
};

export function TypingIndicator({ label = "AI is typing" }: TypingIndicatorProps) {
  return (
    <div className="flex items-center gap-2 px-1 text-sm text-muted" aria-live="polite">
      <span className="sr-only">{label}</span>
      <span className="flex gap-1">
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted [animation-delay:0ms]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted [animation-delay:150ms]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted [animation-delay:300ms]" />
      </span>
    </div>
  );
}
