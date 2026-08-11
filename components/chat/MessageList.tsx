import type { ChatMessageItem } from "@/types/chat";

import { ChatMessage } from "./ChatMessage";
import { WelcomeScreen } from "./WelcomeScreen";

type MessageListProps = {
  messages: ChatMessageItem[];
  isLoading: boolean;
  onSuggestionClick: (text: string) => void;
};

export function MessageList({
  messages,
  onSuggestionClick,
}: MessageListProps) {
  if (messages.length === 0) {
    return <WelcomeScreen onSuggestionClick={onSuggestionClick} />;
  }

  return (
    <div className="flex flex-col gap-6 pb-4">
      {messages.map((message) => (
        <ChatMessage key={message.id} message={message} />
      ))}
    </div>
  );
}
