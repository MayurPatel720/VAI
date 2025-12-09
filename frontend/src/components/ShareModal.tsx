import { useState } from "react";
import { Button } from "./ui/button";
import { Twitter, MessageCircle, Copy, X, Check, Image } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ShareModalProps {
	isOpen: boolean;
	onClose: () => void;
	content: string;
	title?: string;
}

export default function ShareModal({
	isOpen,
	onClose,
	content,
	title: _title = "Spiritual Wisdom from Vachanamrut",
}: ShareModalProps) {
	const [copied, setCopied] = useState(false);

	// Truncate content for social sharing
	const truncatedContent = content.length > 280 
		? content.substring(0, 277) + "..." 
		: content;

	const shareText = `"${truncatedContent}"\n\n— Vachanamrut AI\n\n`;
	const shareUrl = window.location.origin;

	const handleCopy = async () => {
		try {
			await navigator.clipboard.writeText(content);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch (error) {
			console.error("Failed to copy:", error);
		}
	};

	const handleTwitterShare = () => {
		const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
			shareText
		)}&url=${encodeURIComponent(shareUrl)}`;
		window.open(twitterUrl, "_blank", "width=550,height=420");
	};

	const handleWhatsAppShare = () => {
		const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(
			shareText + shareUrl
		)}`;
		window.open(whatsappUrl, "_blank");
	};

	const handleDownloadImage = async () => {
		// Create a styled canvas for the quote
		const canvas = document.createElement("canvas");
		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		const padding = 60;
		const maxWidth = 800;
		const lineHeight = 32;
		const fontSize = 24;

		canvas.width = maxWidth + padding * 2;

		// Calculate text wrapping
		ctx.font = `italic ${fontSize}px Georgia, serif`;
		const words = content.split(" ");
		const lines: string[] = [];
		let currentLine = "";

		for (const word of words) {
			const testLine = currentLine + (currentLine ? " " : "") + word;
			const metrics = ctx.measureText(testLine);
			if (metrics.width > maxWidth && currentLine) {
				lines.push(currentLine);
				currentLine = word;
			} else {
				currentLine = testLine;
			}
		}
		lines.push(currentLine);

		canvas.height = lines.length * lineHeight + padding * 3 + 60;

		// Draw gradient background
		const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
		gradient.addColorStop(0, "#1a1815");
		gradient.addColorStop(1, "#0f0e0c");
		ctx.fillStyle = gradient;
		ctx.fillRect(0, 0, canvas.width, canvas.height);

		// Add subtle border
		ctx.strokeStyle = "rgba(183, 110, 34, 0.3)";
		ctx.lineWidth = 2;
		ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);

		// Draw quote marks
		ctx.font = "bold 60px Georgia, serif";
		ctx.fillStyle = "rgba(183, 110, 34, 0.4)";
		ctx.fillText("\u201C", padding - 20, padding + 40);

		// Draw main text
		ctx.font = `italic ${fontSize}px Georgia, serif`;
		ctx.fillStyle = "#f0e6d2";
		ctx.textAlign = "left";

		lines.forEach((line, index) => {
			ctx.fillText(line, padding + 20, padding + 60 + index * lineHeight);
		});

		// Draw attribution
		ctx.font = "16px 'Inter', sans-serif";
		ctx.fillStyle = "#b76e22";
		ctx.textAlign = "right";
		ctx.fillText(
			"— Vachanamrut AI",
			canvas.width - padding,
			canvas.height - padding
		);

		// Download
		const link = document.createElement("a");
		link.download = `vachanamrut-wisdom-${Date.now()}.png`;
		link.href = canvas.toDataURL("image/png");
		link.click();
	};

	return (
		<AnimatePresence>
			{isOpen && (
				<>
					{/* Backdrop */}
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						className="fixed inset-0 bg-black/60 backdrop-blur-sm"
						style={{ zIndex: 9999 }}
						onClick={onClose}
					/>

					{/* Modal Container - Using flex for perfect centering */}
					<motion.div
						initial={{ opacity: 0, scale: 0.95 }}
						animate={{ opacity: 1, scale: 1 }}
						exit={{ opacity: 0, scale: 0.95 }}
						className="fixed inset-0 flex items-center justify-center p-4"
						style={{ zIndex: 10000 }}
					>
							<div className="bg-card border border-border rounded-2xl shadow-2xl overflow-hidden w-full max-w-md" onClick={(e) => e.stopPropagation()}>
							{/* Header */}
							<div className="flex items-center justify-between p-4 border-b border-border">
								<h2 className="text-lg font-semibold">Share Wisdom</h2>
								<Button
									variant="ghost"
									size="icon"
									onClick={onClose}
									className="text-muted-foreground hover:text-foreground"
								>
									<X className="h-4 w-4" />
								</Button>
							</div>

							{/* Preview */}
							<div className="p-4 border-b border-border">
								<div className="bg-muted/30 rounded-lg p-4 max-h-32 overflow-y-auto">
									<p className="text-sm text-foreground/80 italic line-clamp-4">
										"{truncatedContent}"
									</p>
								</div>
							</div>

							{/* Share Options */}
							<div className="p-4 space-y-3">
								<Button
									variant="outline"
									className="w-full justify-start gap-3 h-12"
									onClick={handleTwitterShare}
								>
									<div className="h-8 w-8 bg-[#1DA1F2] rounded-full flex items-center justify-center">
										<Twitter className="h-4 w-4 text-white" />
									</div>
									<span>Share on Twitter</span>
								</Button>

								<Button
									variant="outline"
									className="w-full justify-start gap-3 h-12"
									onClick={handleWhatsAppShare}
								>
									<div className="h-8 w-8 bg-[#25D366] rounded-full flex items-center justify-center">
										<MessageCircle className="h-4 w-4 text-white" />
									</div>
									<span>Share on WhatsApp</span>
								</Button>

								<Button
									variant="outline"
									className="w-full justify-start gap-3 h-12"
									onClick={handleDownloadImage}
								>
									<div className="h-8 w-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
										<Image className="h-4 w-4 text-white" />
									</div>
									<span>Download as Image</span>
								</Button>

								<Button
									variant="outline"
									className="w-full justify-start gap-3 h-12"
									onClick={handleCopy}
								>
									<div className="h-8 w-8 bg-muted rounded-full flex items-center justify-center">
										{copied ? (
											<Check className="h-4 w-4 text-green-500" />
										) : (
											<Copy className="h-4 w-4" />
										)}
									</div>
									<span>{copied ? "Copied!" : "Copy to Clipboard"}</span>
								</Button>
							</div>
						</div>
					</motion.div>
				</>
			)}
		</AnimatePresence>
	);
}
