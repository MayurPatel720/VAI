export default function TypingIndicator() {
  return (
    <div className="flex w-full justify-start mb-4" data-testid="indicator-typing">
      <div className="max-w-2xl px-4 py-3 rounded-lg rounded-tl-sm bg-card text-card-foreground shadow-sm">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.3s]"></div>
          <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.15s]"></div>
          <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
        </div>
      </div>
    </div>
  );
}
