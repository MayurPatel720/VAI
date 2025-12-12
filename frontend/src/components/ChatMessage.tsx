import { cn } from "../lib/utils";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Copy, Check, Download, Share2, Bookmark, Volume2, BookmarkCheck } from "lucide-react";
import { useState } from "react";
import { Button } from "./ui/button";
import { useTTS } from "../hooks/useTTS";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "../lib/queryClient";
import { useToast } from "../hooks/use-toast";

interface ChatMessageProps {
	id?: string;
	message: string;
	isBot: boolean;
	timestamp?: Date;
	userInitials?: string;
	userImage?: string;
	isBookmarked?: boolean;
	bookmarkId?: string;
	onShare?: (id: string, content: string) => void;
}

export default function ChatMessage({
	id,
	message,
	isBot,
	timestamp,
	isBookmarked: initialBookmarked = false,
	bookmarkId: initialBookmarkId,
	onShare,
}: ChatMessageProps) {
	const [copied, setCopied] = useState(false);
	const [isBookmarked, setIsBookmarked] = useState(initialBookmarked);
	const [bookmarkId, setBookmarkId] = useState(initialBookmarkId);
	
	const { toast } = useToast();
	const queryClient = useQueryClient();
	const { speak, stop, isSpeaking, isSupported } = useTTS();

	const handleCopy = () => {
		navigator.clipboard.writeText(message);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	const handleDownload = () => {
		const element = document.createElement("a");
		const file = new Blob([message], { type: "text/plain" });
		element.href = URL.createObjectURL(file);
		element.download = `message-${new Date().getTime()}.txt`;
		document.body.appendChild(element);
		element.click();
		document.body.removeChild(element);
	};

	const handleTTS = () => {
		if (isSpeaking) {
			stop();
		} else {
			speak(message);
		}
	};

	// Bookmark mutation
	const bookmarkMutation = useMutation({
		mutationFn: async () => {
			if (isBookmarked && bookmarkId) {
				await apiRequest("DELETE", `/api/bookmarks/${bookmarkId}`);
				return { action: "removed" };
			} else {
				const res = await apiRequest("POST", "/api/bookmarks", {
					messageId: id,
					messageContent: message,
					category: "spiritual",
				});
				return res.json();
			}
		},
		onSuccess: (data) => {
			if (data.action === "removed") {
				setIsBookmarked(false);
				setBookmarkId(undefined);
				toast({
					title: "Bookmark removed",
					description: "Message removed from your saved wisdom.",
				});
			} else {
				setIsBookmarked(true);
				setBookmarkId(data.id);
				toast({
					title: "Bookmarked!",
					description: "Saved to your spiritual wisdom collection.",
				});
			}
			queryClient.invalidateQueries({ queryKey: ["bookmarks"] });
		},
		onError: () => {
			toast({
				title: "Error",
				description: "Failed to save bookmark. Please try again.",
				variant: "destructive",
			});
		},
	});

	return (
		<>
			<div
				className={cn(
					"group flex w-full gap-4 px-4 md:px-8 transition-colors duration-200",
					isBot ? "justify-start" : "justify-end"
				)}
			>
				<div
					className={cn(
						"flex max-w-[95%] md:max-w-[75%] gap-2 md:gap-3",
						isBot ? "flex-row" : "flex-row-reverse"
					)}
				>
					{/* Content Section */}
					<div className={cn("flex flex-col min-w-0", isBot ? "items-start" : "items-end")}>
						<div className={cn("flex items-center gap-2 mb-1", isBot ? "flex-row" : "flex-row-reverse")}>
							<span className="text-sm font-semibold text-foreground/90">
								{isBot ? "Vachanamrut AI" : "You"}
							</span>
							{timestamp && (
								<span className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
									{new Date(timestamp).toLocaleTimeString([], {
										hour: "2-digit",
										minute: "2-digit",
									})}
								</span>
							)}
						</div>

						<div
							className={cn(
								"rounded-2xl px-4 py-3 shadow-sm border",
								isBot
									? "bg-muted border-border text-foreground/90 rounded-tl-none"
									: "bg-primary text-primary-foreground border-primary/20 rounded-tr-none"
							)}
						>
							<div
								className={cn(
									"prose max-w-none text-[15px] leading-7 break-words",
									isBot
										? "prose-stone dark:prose-invert"
										: "prose-invert"
								)}
							>
								<ReactMarkdown remarkPlugins={[remarkGfm]}>{message}</ReactMarkdown>
							</div>
						</div>

						{/* Actions */}
						<div className={cn("flex items-center gap-1 pt-1 opacity-0 group-hover:opacity-100 transition-opacity", isBot ? "justify-start" : "justify-end")}>
							<Button
								variant="ghost"
								size="icon"
								className="h-6 w-6 text-muted-foreground hover:text-foreground"
								onClick={handleCopy}
								title="Copy text"
							>
								{copied ? (
									<Check className="h-3.5 w-3.5" />
								) : (
									<Copy className="h-3.5 w-3.5" />
								)}
							</Button>
							
							<Button
								variant="ghost"
								size="icon"
								className="h-6 w-6 text-muted-foreground hover:text-foreground"
								onClick={handleDownload}
								title="Download text"
							>
								<Download className="h-3.5 w-3.5" />
							</Button>

							{/* Share button */}
							<Button
								variant="ghost"
								size="icon"
								className="h-6 w-6 text-muted-foreground hover:text-foreground"
								onClick={() => onShare && onShare(id || "", message)}
								title="Share"
							>
								<Share2 className="h-3.5 w-3.5" />
							</Button>

							{/* TTS button (only for bot messages) */}
							{isBot && isSupported && (
								<Button
									variant="ghost"
									size="icon"
									className={cn(
										"h-6 w-6",
										isSpeaking 
											? "text-primary" 
											: "text-muted-foreground hover:text-foreground"
									)}
									onClick={handleTTS}
									title={isSpeaking ? "Stop speaking" : "Listen"}
								>
									<Volume2 className={cn("h-3.5 w-3.5", isSpeaking ? "animate-pulse" : "")} />
								</Button>
							)}

							{/* Bookmark button (only for bot messages) */}
							{isBot && id && (
								<Button
									variant="ghost"
									size="icon"
									className={cn(
										"h-6 w-6",
										isBookmarked 
											? "text-yellow-500" 
											: "text-muted-foreground hover:text-foreground"
									)}
									onClick={() => bookmarkMutation.mutate()}
									disabled={bookmarkMutation.isPending}
									title={isBookmarked ? "Remove bookmark" : "Bookmark"}
								>
									{isBookmarked ? (
										<BookmarkCheck className="h-3.5 w-3.5" />
									) : (
										<Bookmark className="h-3.5 w-3.5" />
									)}
								</Button>
							)}
						</div>
					</div>
				</div>
			</div>
		</>
	);
}
