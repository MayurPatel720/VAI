import { useState, useRef } from "react";
import { Button } from "./ui/button";
import { X, Check, Loader2, Image as ImageIcon, Link2 } from "lucide-react";
import { FaWhatsapp, FaInstagram, FaXTwitter, FaEnvelope } from "react-icons/fa6"; // Using react-icons for brands
import { motion, AnimatePresence } from "framer-motion";
import { apiRequest } from "../lib/queryClient";
import html2canvas from "html2canvas";



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
	const [isGeneratingImage, setIsGeneratingImage] = useState(false);
	const [copied, setCopied] = useState(false);
	const posterRef = useRef<HTMLDivElement>(null);

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
			// Construct URL using the frontend's current origin
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

		const marketingText = `${previewText}\nClick here to read full answer:\n${link}\n\nDon't miss out on this modern way to experience wisdom. Try it now!`;

		const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(marketingText)}`;
		window.open(whatsappUrl, "_blank");
	};

	const handleEmailShare = async () => {
		const link = await getShareLink();
		if (!link) return;
		const subject = "Discover Inner Peace with Vachanamrut AI";
		const body = `I found this incredible spiritual guide:\n\n"${truncatedContent}"\n\nRead more here: ${link}`;
		const mailtoUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
		
		// Use anchor click for better compatibility
		const anchor = document.createElement("a");
		anchor.href = mailtoUrl;
		anchor.click();
	};

	const handleTwitterShare = async () => {
		const link = await getShareLink();
		if (!link) return;
		const text = `Discover inner peace with Vachanamrut AI! 🕉️\n\n${link}`;
		window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, "_blank");
	};

	// Instagram doesn't support direct web sharing well, so we might just copy link or guide user
	// But sticking to the icon row request, we can just Open Instagram or Copy Link.
	// Often apps just open the app. For web, maybe just copy link?
	// Let's make it copy link + notify.
	const handleInstagramShare = async () => {
		await handleCopy();
		// Maybe show a toast/tooltip saying "Link copied! Paste in Stories."
		// For now, simpler is better.
	};

	const handleShareAsImage = async () => {
		if (!posterRef.current) return;
		
		try {
			setIsGeneratingImage(true);
			// Show the hidden poster temporarily (it needs to be visible to capture, but we can render it off-screen)
			// Actually html2canvas needs it in the DOM. We can position it absolute off-screen.
			
			const canvas = await html2canvas(posterRef.current, {
				backgroundColor: null,
				scale: 2, // Retine quality
				useCORS: true,
			});

			const image = canvas.toDataURL("image/png");
			const link = document.createElement("a");
			link.href = image;
			link.download = `vachanamrut-share-${Date.now()}.png`;
			link.click();
		} catch (err) {
			console.error("Failed to generate image", err);
		} finally {
			setIsGeneratingImage(false);
		}
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
						<div className="bg-card border border-border rounded-2xl shadow-2xl overflow-hidden w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
							{/* Header */}
							<div className="flex items-center justify-between p-4 border-b border-border">
								<h2 className="text-lg font-semibold">Share Wisdom</h2>
								<Button variant="ghost" size="icon" onClick={onClose}>
									<X className="h-4 w-4" />
								</Button>
							</div>

							{/* Toggle */}
							{toggleEnabled && (
								<div className="p-4 pb-0 grid grid-cols-2 gap-2">
									<Button
										variant={activeTab === 'message' ? "default" : "outline"}
										onClick={() => setActiveTab('message')}
										className="text-xs h-8"
									>
										Message
									</Button>
									<Button
										variant={activeTab === 'conversation' ? "default" : "outline"}
										onClick={() => setActiveTab('conversation')}
										className="text-xs h-8"
									>
										Full Chat
									</Button>
								</div>
							)}

							{/* Content Preview */}
							<div className="p-4">
								<div className="bg-muted/30 rounded-lg p-3 max-h-32 overflow-y-auto text-sm italic text-muted-foreground border border-border/50">
									{activeTab === 'message' ? `"${truncatedContent}"` : "Sharing entire conversation..."}
								</div>
							</div>

							{/* Action Buttons Row */}
							<div className="p-4 pt-0 grid grid-cols-5 gap-2 justify-items-center">
								{/* WhatsApp */}
								<Button
									variant="outline"
									size="icon"
									className="h-12 w-12 rounded-full border-green-500/20 hover:bg-green-500/10 hover:border-green-500 text-green-600"
									onClick={handleWhatsAppShare}
									disabled={isLoading}
									title="Share on WhatsApp"
								>
									<FaWhatsapp className="h-6 w-6" />
								</Button>

								{/* Instagram */}
								<Button
									variant="outline"
									size="icon"
									className="h-12 w-12 rounded-full border-pink-500/20 hover:bg-pink-500/10 hover:border-pink-500 text-pink-600"
									onClick={handleInstagramShare}
									disabled={isLoading}
									title="Copy Link for Instagram"
								>
									<FaInstagram className="h-6 w-6" />
								</Button>

								{/* Twitter */}
								<Button
									variant="outline"
									size="icon"
									className="h-12 w-12 rounded-full border-blue-400/20 hover:bg-blue-400/10 hover:border-blue-400 text-blue-400"
									onClick={handleTwitterShare}
									disabled={isLoading}
									title="Share on Twitter"
								>
									<FaXTwitter className="h-5 w-5" />
								</Button>

								{/* Email */}
								<Button
									variant="outline"
									size="icon"
									className="h-12 w-12 rounded-full border-orange-400/20 hover:bg-orange-400/10 hover:border-orange-400 text-orange-400"
									onClick={handleEmailShare}
									disabled={isLoading}
									title="Share via Email"
								>
									<FaEnvelope className="h-5 w-5" />
								</Button>

								{/* Copy Link */}
								<Button
									variant="outline"
									size="icon"
									className="h-12 w-12 rounded-full"
									onClick={handleCopy}
									disabled={isLoading}
									title="Copy Link"
								>
									{copied ? <Check className="h-5 w-5 text-green-500" /> : <Link2 className="h-5 w-5" />}
								</Button>
							</div>

							{/* Share as Image Button */}
							<div className="p-4 pt-0">
								<Button 
									className="w-full gap-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-semibold shadow-lg shadow-orange-500/20"
									onClick={handleShareAsImage}
									disabled={isGeneratingImage}
								>
									{isGeneratingImage ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}
									Share as Story Poster
								</Button>
							</div>



							{/* Hidden Poster Template for Capture */}
							{/* Hidden Poster Template for Capture */}
							{/* Hidden Poster Template for Capture */}
							{/* Hidden Poster Template for Capture */}
							{/* Hidden Poster Template for Capture */}
							<div className="absolute top-0 left-[-9999px]">
								<div 
									ref={posterRef}
									className="w-[1920px] h-[1080px] relative overflow-hidden font-sans flex items-center justify-center p-12"
									style={{
										background: 'radial-gradient(circle at 20% 20%, #fcd34d 0%, #fbbf24 40%, #f59e0b 100%)'
									}}
								>
									{/* White Card Container */}
									<div className="bg-white w-full max-w-[1700px] rounded-[80px] relative flex flex-col items-center justify-between px-20 py-16 shadow-2xl min-h-[800px] my-auto">
										
										{/* Top Left Quote - BIG */}
										<div className="absolute -top-8 left-16">
											<svg width="120" height="120" viewBox="0 0 24 24" fill="#1a1a1a">
												<path d="M6 17h3l2-4V7H5v6h3zm8 0h3l2-4V7h-6v6h3z"/>
											</svg>
										</div>

										{/* Content */}
										<div className="flex-1 flex flex-col items-center justify-center w-full px-16 py-8">
											<p 
												className="font-bold text-center text-black uppercase leading-[1.15] tracking-tight" 
												style={{ 
													fontFamily: 'Inter, sans-serif',
													fontSize: content.length > 400 ? '2.2rem' : content.length > 250 ? '2.8rem' : content.length > 150 ? '3.2rem' : '3.8rem',
													wordBreak: 'break-word'
												}}
											>
												{content}
											</p>
										</div>

										{/* Footer */}
										<div className="w-full flex justify-end px-8 mt-4">
											<p className="text-3xl font-bold text-gray-700 tracking-wide">
												- vachnamrutai.web.app
											</p>
										</div>

										{/* Bottom Right Quote - BIG */}
										<div className="absolute -bottom-8 right-16">
											<svg width="120" height="120" viewBox="0 0 24 24" fill="#1a1a1a">
												<path d="M18 7h-3l-2 4v6h6v-6h-3zm-8 0H7L5 11v6h6v-6H8z"/>
											</svg>
										</div>
									</div>
								</div>
							</div>
						</div>
					</motion.div>
				</>
			)}
		</AnimatePresence>
	);
}
