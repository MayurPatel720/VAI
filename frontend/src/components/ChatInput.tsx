/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useRef, useEffect, type KeyboardEvent } from "react";
import { motion } from "framer-motion";
import { Button } from "../components/ui/button";
import { Textarea } from "../components/ui/textarea";
import { Send, Mic, MicOff } from "lucide-react";
import { cn } from "../lib/utils";

interface ChatInputProps {
	onSendMessage: (message: string) => void;
	disabled?: boolean;
}

export default function ChatInput({ onSendMessage, disabled }: ChatInputProps) {
	const [message, setMessage] = useState("");
	const [recording, setRecording] = useState(false);

	const textareaRef = useRef<HTMLTextAreaElement>(null);
	const recognitionRef = useRef<any>(null);

	useEffect(() => {
		textareaRef.current?.focus();

		// Speech Recognition
		if ("webkitSpeechRecognition" in window) {
			const SpeechRecognition = (window as any).webkitSpeechRecognition;
			const recognition = new SpeechRecognition();

			recognition.interimResults = true;
			recognition.lang = "en-US";

			recognition.onstart = () => {
				setRecording(true);
			};

			recognition.onresult = (event: any) => {
				let transcript = "";
				for (let i = 0; i < event.results.length; i++) {
					transcript += event.results[i][0].transcript;
				}
				setMessage(transcript);
			};

			recognition.onend = () => {
				setRecording(false);
			};

			recognitionRef.current = recognition;
		}
	}, []);

	const toggleRecording = () => {
		if (!recognitionRef.current || disabled) return;

		if (!recording) {
			recognitionRef.current.start();
		} else {
			recognitionRef.current.stop();
		}
	};

	const handleSend = () => {
		if (message.trim() && !disabled) {
			onSendMessage(message.trim());
			setMessage("");
			textareaRef.current!.style.height = "auto";
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
		target.style.height = Math.min(target.scrollHeight, 140) + "px";
	};

	return (
		<div className="sticky bottom-0 bg-background/80 backdrop-blur-lg border-t p-4">
			<div className="max-w-4xl mx-auto relative">
				<motion.div
					className="flex items-end gap-3 p-3 rounded-2xl bg-card/95 border border-border shadow-md transition-all duration-300"
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
				>
					<Textarea
						ref={textareaRef}
						value={message}
						onChange={(e) => setMessage(e.target.value)}
						onKeyDown={handleKeyDown}
						onInput={handleInput}
						placeholder="Ask for spiritual guidance..."
						disabled={disabled}
						className={cn(
							"min-h-[44px] max-h-[140px] resize-none px-1 bg-transparent text-base leading-relaxed",
							"border-0 !outline-none !ring-0 !ring-offset-0",
							"focus:!ring-0 focus:!ring-offset-0",
							"focus-visible:!outline-none focus-visible:!ring-0 focus-visible:!ring-offset-0",
							"shadow-none"
						)}
						rows={1}
					/>

					{/* 🎤 MIC BUTTON */}
					<div className="flex flex-col items-center">
						<Button
							onClick={toggleRecording}
							disabled={disabled}
							size="icon"
							className={cn(
								"rounded-full transition-all duration-200 relative",
								recording
									? "bg-red-600 text-white shadow-lg shadow-red-600/50"
									: "bg-muted text-muted-foreground hover:bg-muted/80"
							)}
						>
							{recording ? (
								<MicOff className="h-4 w-4" />
							) : (
								<Mic className="h-4 w-4" />
							)}
						</Button>

						{/* Listening label */}
						{recording && (
							<p className="text-[10px] text-red-500 mt-1 animate-pulse">
								Listening…
							</p>
						)}
					</div>

					{/* SEND BUTTON */}
					<Button
						onClick={handleSend}
						disabled={!message.trim() || disabled}
						size="icon"
						className={cn(
							"rounded-full w-10 transition-all duration-200 shadow-primary/30 shadow-md",
							message.trim()
								? "bg-primary text-primary-foreground hover:bg-primary/90"
								: "bg-muted text-muted-foreground opacity-60"
						)}
					>
						<Send className="h-4 w-4" />
					</Button>
				</motion.div>
			</div>
		</div>
	);
}
