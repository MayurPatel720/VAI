import { useState } from "react";
import { Button } from "./ui/button";
import { MessageCircle, Copy, X, Check, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { apiRequest } from "../lib/queryClient";

interface ShareModalProps {
	isOpen: boolean;
	onClose: () => void;
	content: string;
	messageId?: string;
	sessionId?: string;
	toggleEnabled?: boolean; // If true, user can switch between message/conversation
}

export default function ShareModal({
	isOpen,
	onClose,
	content,
	messageId,
	sessionId,
	toggleEnabled = false,
}: ShareModalProps) {
	const [activeTab, setActiveTab] = useState<'message' | 'conversation'>('message');
	const [isLoading, setIsLoading] = useState(false);
	const [copied, setCopied] = useState(false);
	
	// Reset tab when opening
	if (!isOpen && activeTab !== 'message') {
		// We can't reset state in render, strictly speaking, 
		// but typically we let it persist or reset via useEffect.
		// For simplicity, let's keep it persistent for now or reset on close via effect if needed.
	}

	const getShareLink = async () => {
		try {
			setIsLoading(true);
			const type = activeTab;
			const referenceId = type === 'message' ? messageId : sessionId;

			if (!referenceId) throw new Error("Missing ID for sharing");

			const res = await apiRequest("POST", "/api/share", {
				type,
				referenceId,
				content: type === 'message' ? content : undefined, // Only needed for message snapshot
			});
			const data = await res.json();
			// Construct URL using the frontend's current origin (e.g. localhost:5173)
			// This fixes the issue where backend returns localhost:3000 which doesn't serve the frontend app
			return `${window.location.origin}/share/${data.token}`;
		} catch (error) {
			console.error("Failed to generate link:", error);
			return null;
		} finally {
			setIsLoading(false);
		}
	};

	const handleCopy = async () => {
		const link = await getShareLink();
		if (link) {
			await navigator.clipboard.writeText(link);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		}
	};

	const handleWhatsAppShare = async () => {
		const link = await getShareLink();
		if (!link) return;

		const previewText = activeTab === 'message' 
			? `\n\n"${truncatedContent}"\n` 
			: "";

		// Cleaned up text without complex emojis to avoid encoding issues
		const marketingText = `Discover Inner Peace with Vachanamrut AI!\n\nI just found this incredible spiritual guide that answers life's toughest questions using the divine wisdom of Bhagwan Swaminarayan. It's truly life-changing!${previewText}\nClick here to read full answer:\n${link}\n\nDon't miss out on this modern way to experience ancient wisdom. Try it now!`;

		const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(marketingText)}`;
		window.open(whatsappUrl, "_blank");
	};

	// Truncate content for preview
	const truncatedContent = content.length > 280 
		? content.substring(0, 277) + "..." 
		: content;

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

					{/* Modal Container */}
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

							{/* Toggle (Conditional) */}
							{toggleEnabled && (
								<div className="p-4 pb-0 grid grid-cols-2 gap-2">
									<Button
										variant={activeTab === 'message' ? "default" : "outline"}
										onClick={() => setActiveTab('message')}
										className="text-sm"
									>
										Share Message
									</Button>
									<Button
										variant={activeTab === 'conversation' ? "default" : "outline"}
										onClick={() => setActiveTab('conversation')}
										className="text-sm"
									>
										Full Conversation
									</Button>
								</div>
							)}

							{/* Preview */}
							<div className="p-4 border-b border-border">
								<div className="bg-muted/30 rounded-lg p-4 max-h-32 overflow-y-auto">
									<p className="text-sm text-foreground/80 italic ">
										{activeTab === 'message' ? (
											`"${truncatedContent}"`
										) : (
											<span className="flex items-center gap-2 text-muted-foreground">
												<MessageCircle className="h-4 w-4" />
												Sharing entire conversation history...
											</span>
										)}
									</p>
								</div>
							</div>

							{/* Share Options */}
							<div className="p-4 space-y-3">
								<Button
									variant="outline"
									className="w-full justify-start gap-3 h-12 relative overflow-hidden group border-green-500/50 hover:border-green-500 hover:bg-green-500/10 transition-all"
									onClick={handleWhatsAppShare}
									disabled={isLoading}
								>
									<div className="h-8 w-8 bg-[#25D366] rounded-full flex items-center justify-center relative z-10">
										<MessageCircle className="h-4 w-4 text-white" />
									</div>
									<span className="flex-1 font-semibold text-foreground group-hover:text-green-500 transition-colors">
										{isLoading ? "Generating Link..." : "Share on WhatsApp"}
									</span>
									{isLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground mr-2" />}
								</Button>

								<Button
									variant="outline"
									className="w-full justify-start gap-3 h-12"
									onClick={handleCopy}
									disabled={isLoading}
								>
									<div className="h-8 w-8 bg-muted rounded-full flex items-center justify-center">
										{copied ? (
											<Check className="h-4 w-4 text-green-500" />
										) : (
											<Copy className="h-4 w-4" />
										)}
									</div>
									<span className="flex-1 text-left">
										{copied ? "Link Copied!" : "Copy Link"}
									</span>
								</Button>
							</div>
						</div>
					</motion.div>
				</>
			)}
		</AnimatePresence>
	);
}
