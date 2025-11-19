import { useState, useRef, useEffect, type KeyboardEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
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

	useEffect(() => {
		textareaRef.current?.focus();
	}, []);

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
		if (e.key === "Enter" && e.ctrlKey) {
			e.preventDefault();
			handleSend();
		}
	};

	const handleInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
		const target = e.currentTarget;
		target.style.height = "auto";
		target.style.height = Math.min(target.scrollHeight, 140) + "px";
	};

	return (
		<div
			className="sticky bottom-0 bg-background/80 backdrop-blur-lg border-t p-4"
			data-testid="container-chat-input"
		>
			<div className="max-w-4xl mx-auto relative">
				<motion.div
					className="flex items-end gap-2 p-3 rounded-2xl bg-card/95 border border-border shadow-md hover:shadow-lg transition-all duration-300"
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					whileHover={{ scale: 1.01 }}
				>
					<Textarea
						ref={textareaRef}
						value={message}
						onChange={(e) => setMessage(e.target.value)}
						onKeyDown={handleKeyDown}
						onInput={handleInput}
						placeholder="Ask for spiritual guidance..."
						disabled={disabled}
						className="min-h-[44px] max-h-[140px] resize-none border-0  focus-visible:ring-0 shadow-none bg-transparent text-base leading-relaxed px-1 text-foreground"
						rows={1}
						data-testid="input-message"
					/>

					<motion.div
						whileHover={{ scale: 1.1 }}
						whileTap={{ scale: 0.9 }}
						className="flex-shrink-0"
					>
						<Button
							onClick={handleSend}
							disabled={!message.trim() || disabled}
							size="icon"
							className={cn(
								"rounded-full transition-all duration-200 shadow-primary/30 shadow-md",
								message.trim()
									? "bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-primary/60"
									: "bg-muted text-muted-foreground opacity-60 hover:opacity-80"
							)}
							data-testid="button-send"
						>
							<Send className="h-4 w-4" />
						</Button>
					</motion.div>
				</motion.div>

				{/* Glowing typing indicator line */}
				<AnimatePresence>
					{message && (
						<motion.div
							key="typingGlow"
							className="absolute bottom-[10px] left-0 right-0 h-[2px] bg-primary/70 rounded-full"
							initial={{ opacity: 0, scaleX: 0 }}
							animate={{ opacity: 1, scaleX: 1 }}
							exit={{ opacity: 0, scaleX: 0 }}
							transition={{ duration: 0.3 }}
						/>
					)}
				</AnimatePresence>
			</div>
		</div>
	);
}
