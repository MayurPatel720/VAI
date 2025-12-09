/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useRef, useEffect, type KeyboardEvent } from "react";
import { Button } from "../components/ui/button";
import { Textarea } from "../components/ui/textarea";
import { SendHorizontal, Mic, Square } from "lucide-react";
import { cn } from "../lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface ChatInputProps {
	onSendMessage: (message: string) => void;
	disabled?: boolean;
}

export default function ChatInput({ onSendMessage, disabled }: ChatInputProps) {
	const [message, setMessage] = useState("");
	const [isRecording, setIsRecording] = useState(false);
	const textareaRef = useRef<HTMLTextAreaElement>(null);
	const recognitionRef = useRef<any>(null);

	useEffect(() => {
		// Only focus on desktop to prevent mobile keyboard popping up immediately
		if (window.innerWidth > 768) {
			textareaRef.current?.focus();
		}

		if ("webkitSpeechRecognition" in window) {
			const SpeechRecognition = (window as any).webkitSpeechRecognition;
			const recognition = new SpeechRecognition();
			recognition.interimResults = true;
			recognition.lang = "en-US";

			recognition.onstart = () => setIsRecording(true);

			recognition.onresult = (event: any) => {
				let transcript = "";
				for (let i = 0; i < event.results.length; i++) {
					transcript += event.results[i][0].transcript;
				}
				setMessage(transcript);
			};

			recognition.onend = () => setIsRecording(false);
			recognitionRef.current = recognition;
		}
	}, []);

	const toggleRecording = () => {
		if (!recognitionRef.current || disabled) return;
		if (!isRecording) {
			recognitionRef.current.start();
		} else {
			recognitionRef.current.stop();
		}
	};

	const handleSend = () => {
		if (message.trim() && !disabled) {
			onSendMessage(message.trim());
			setMessage("");
			if (textareaRef.current) textareaRef.current.style.height = "auto";
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
		target.style.height = Math.min(target.scrollHeight, 150) + "px"; // Limit height on mobile
	};

	return (
		<div className="w-full max-w-4xl mx-auto py-4 px-4 md:px-6">
			{/* Input Container */}
			<div className="relative flex items-end gap-2 p-2 bg-muted/30 dark:bg-zinc-900/50 border border-input rounded-[26px] shadow-sm focus-within:ring-1 focus-within:ring-primary/30 focus-within:border-primary/30 transition-all duration-200">
				<Textarea
					ref={textareaRef}
					value={message}
					onChange={(e) => setMessage(e.target.value)}
					onKeyDown={handleKeyDown}
					onInput={handleInput}
					placeholder="Ask anything..."
					disabled={disabled}
					className="min-h-[44px] max-h-[200px] w-full resize-none border-0 bg-transparent py-3 px-4 text-base focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/60 shadow-none scrollbar-hide"
					rows={1}
				/>

				<div className="flex items-center gap-2 pb-1.5 pr-1.5 h-[44px] self-end">
					<AnimatePresence mode="wait">
						{isRecording ? (
							<motion.div
								initial={{ scale: 0.8, opacity: 0 }}
								animate={{ scale: 1, opacity: 1 }}
								exit={{ scale: 0.8, opacity: 0 }}
							>
								<Button
									onClick={toggleRecording}
									size="icon"
									variant="destructive"
									className="h-9 w-9 rounded-full animate-pulse shadow-sm"
								>
									<Square className="h-4 w-4 fill-current" />
								</Button>
							</motion.div>
						) : (
							<Button
								onClick={toggleRecording}
								size="icon"
								variant="ghost"
								className="h-9 w-9 rounded-full text-muted-foreground hover:bg-muted/60"
								disabled={disabled}
							>
								<Mic className="h-5 w-5" />
							</Button>
						)}
					</AnimatePresence>

					<Button
						onClick={handleSend}
						disabled={!message.trim() || disabled}
						size="icon"
						className={cn(
							"h-9 w-9 rounded-full transition-all duration-200 shadow-sm",
							message.trim()
								? "bg-primary text-primary-foreground hover:bg-primary/90"
								: "bg-muted text-muted-foreground opacity-50"
						)}
					>
						<SendHorizontal className="h-5 w-5" />
					</Button>
				</div>
			</div>

			<p className="text-center text-xs text-muted-foreground mt-3 pb-safe-area">
				Vachanamrut AI can make mistakes. Verify important guidance.
			</p>
		</div>
	);
}
