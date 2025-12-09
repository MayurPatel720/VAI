import { cn } from "../lib/utils";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Copy, Check, Sparkles } from "lucide-react";
import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";

interface ChatMessageProps {
	message: string;
	isBot: boolean;
	timestamp?: Date;
	userInitials?: string;
	userImage?: string;
}

export default function ChatMessage({
	message,
	isBot,
	timestamp,
	userInitials = "U",
	userImage,
}: ChatMessageProps) {
	const [copied, setCopied] = useState(false);

	const handleCopy = () => {
		navigator.clipboard.writeText(message);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	return (
		<div
			className={cn(
				"group flex w-full gap-4 p-4 md:py-6 md:px-8 transition-colors duration-200",
				isBot ? "bg-background" : "bg-muted/30"
			)}
		>
			{/* Avatar Section */}
			<div className="flex-shrink-0">
				<Avatar
					className={cn(
						"h-8 w-8 ring-1 ring-border",
						isBot ? "bg-amber-100" : "bg-blue-100"
					)}
				>
					{isBot ? (
						<div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-amber-100 to-orange-100">
							<Sparkles className="h-4 w-4 text-amber-600" />
						</div>
					) : (
						<>
							<AvatarImage src={userImage} />
							<AvatarFallback className="text-xs bg-blue-100 text-blue-700">
								{userInitials}
							</AvatarFallback>
						</>
					)}
				</Avatar>
			</div>

			{/* Content Section */}
			<div className="flex-1 space-y-2 overflow-hidden">
				<div className="flex items-center justify-between">
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
						"prose prose-stone dark:prose-invert max-w-none text-[15px] leading-7",
						isBot
							? "font-serif text-foreground/90"
							: "font-sans text-foreground/80"
					)}
				>
					<ReactMarkdown remarkPlugins={[remarkGfm]}>{message}</ReactMarkdown>
				</div>

				{/* Bot Actions */}
				{isBot && (
					<div className="flex items-center gap-2 pt-2 opacity-0 group-hover:opacity-100 transition-opacity">
						<Button
							variant="ghost"
							size="icon"
							className="h-6 w-6 text-muted-foreground hover:text-foreground"
							onClick={handleCopy}
						>
							{copied ? (
								<Check className="h-3.5 w-3.5" />
							) : (
								<Copy className="h-3.5 w-3.5" />
							)}
						</Button>
					</div>
				)}
			</div>
		</div>
	);
}
