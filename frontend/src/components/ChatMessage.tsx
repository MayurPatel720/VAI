import { cn } from "../lib/utils";

interface ChatMessageProps {
	message: string;
	isBot: boolean;
	timestamp?: Date;
}

export default function ChatMessage({
	message,
	isBot,
	timestamp,
}: ChatMessageProps) {
	return (
		<div
			className={cn(
				"flex w-full mb-4",
				isBot ? "justify-start" : "justify-end"
			)}
			data-testid={isBot ? "message-bot" : "message-user"}
		>
			<div
				className={cn(
					"max-w-2xl px-4 py-3 rounded-lg shadow-sm relative group",
					isBot
						? "bg-card text-card-foreground rounded-tl-sm"
						: "bg-primary text-primary-foreground rounded-tr-sm"
				)}
			>
				<p className="text-base leading-relaxed whitespace-pre-wrap break-words">
					{message}
				</p>
				{timestamp && (
					<time
						className="text-xs opacity-0 group-hover:opacity-60 transition-opacity duration-200 mt-1 block"
						dateTime={timestamp.toISOString()}
						data-testid="text-timestamp"
					>
						{timestamp.toLocaleTimeString([], {
							hour: "2-digit",
							minute: "2-digit",
						})}
					</time>
				)}
			</div>
		</div>
	);
}
