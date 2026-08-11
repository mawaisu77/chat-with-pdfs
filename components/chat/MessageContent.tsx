import type { ReactNode } from "react";

type MessageContentProps = {
  content: string;
  streaming?: boolean;
};

function renderInline(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);

  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={index} className="font-semibold text-foreground">
          {part.slice(2, -2)}
        </strong>
      );
    }

    return part;
  });
}

export function MessageContent({ content, streaming }: MessageContentProps) {
  const lines = content.split("\n");
  const blocks: ReactNode[] = [];
  let listItems: string[] = [];
  let listType: "ul" | "ol" | null = null;

  function flushList() {
    if (!listItems.length || !listType) return;

    const ListTag = listType === "ol" ? "ol" : "ul";
    blocks.push(
      <ListTag
        key={`list-${blocks.length}`}
        className={
          listType === "ol"
            ? "my-2 list-decimal space-y-1.5 pl-5"
            : "my-2 list-disc space-y-1.5 pl-5 marker:text-brand/70"
        }
      >
        {listItems.map((item, index) => (
          <li key={index} className="leading-relaxed">
            {renderInline(item)}
          </li>
        ))}
      </ListTag>,
    );

    listItems = [];
    listType = null;
  }

  for (const line of lines) {
    const trimmed = line.trim();
    const bulletMatch = trimmed.match(/^[-•*]\s+(.+)$/);
    const numberedMatch = trimmed.match(/^\d+[.)]\s+(.+)$/);

    if (bulletMatch) {
      if (listType && listType !== "ul") flushList();
      listType = "ul";
      listItems.push(bulletMatch[1]);
      continue;
    }

    if (numberedMatch) {
      if (listType && listType !== "ol") flushList();
      listType = "ol";
      listItems.push(numberedMatch[1]);
      continue;
    }

    flushList();

    if (!trimmed) {
      blocks.push(<div key={`spacer-${blocks.length}`} className="h-2" />);
      continue;
    }

    blocks.push(
      <p key={`p-${blocks.length}`} className="leading-relaxed">
        {renderInline(line)}
      </p>,
    );
  }

  flushList();

  return (
    <div className="message-content space-y-0.5 text-sm">
      {blocks}
      {streaming && (
        <span className="ml-0.5 inline-block h-4 w-1.5 translate-y-0.5 animate-pulse rounded-full bg-brand align-middle" />
      )}
    </div>
  );
}
