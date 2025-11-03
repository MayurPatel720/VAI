import { useState, useRef, type KeyboardEvent } from "react";
import { Button } from "../components/ui/button";
import { Textarea } from "../components/ui/textarea";
import { Send } from "lucide-react";
import { cn } from "../lib/utils";

interface ChatInputProps {
	onSendMessage: (message: string) => void;
	disabled?: boolean;
}

export default function ChatInput({ onSendMessage, disabled }: ChatInputProps) {
	const [message, setMessage] = useState("");
	const textareaRef = useRef<HTMLTextAreaElement>(null);

	const handleSend = () => {
		if (message.trim() && !disabled) {
			onSendMessage(message.trim());
			setMessage("");
			if (textareaRef.current) {
				textareaRef.current.style.height = "auto";
			}
		}
	};

	const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			handleSend();
		}
	};

	const handleInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
		const target = e.currentTarget;
		target.style.height = "auto";
		target.style.height = Math.min(target.scrollHeight, 120) + "px";
	};

	return (
		<div
			className="sticky bottom-0 bg-background/80 backdrop-blur-lg border-t p-4"
			data-testid="container-chat-input"
		>
			<div className="max-w-4xl mx-auto">
				<div className="flex items-end gap-2 p-3 rounded-2xl bg-card border shadow-sm">
					<Textarea
						ref={textareaRef}
						value={message}
						onChange={(e) => setMessage(e.target.value)}
						onKeyDown={handleKeyDown}
						onInput={handleInput}
						placeholder="Ask for spiritual guidance..."
						disabled={disabled}
						className="min-h-[44px] max-h-[120px] resize-none border-0 focus-visible:ring-0 shadow-none bg-transparent text-base"
						rows={1}
						data-testid="input-message"
					/>
					<Button
						onClick={handleSend}
						disabled={!message.trim() || disabled}
						size="icon"
						className={cn(
							"rounded-full flex-shrink-0",
							!message.trim() && "opacity-50"
						)}
						data-testid="button-send"
					>
						<Send className="h-4 w-4" />
					</Button>
				</div>
			</div>
		</div>
	);
}
