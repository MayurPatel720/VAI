import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Download, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface BeforeInstallPromptEvent extends Event {
	prompt: () => Promise<void>;
	userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function PWAInstallPrompt() {
	const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
	const [showPrompt, setShowPrompt] = useState(false);
	const [isDismissed, setIsDismissed] = useState(false);

	useEffect(() => {
		// Check if already dismissed
		const dismissed = localStorage.getItem("pwa-dismissed");
		if (dismissed) {
			setIsDismissed(true);
			return;
		}

		const handler = (e: Event) => {
			e.preventDefault();
			setDeferredPrompt(e as BeforeInstallPromptEvent);
			setShowPrompt(true);
		};

		window.addEventListener("beforeinstallprompt", handler);

		// Check if app is already installed
		if (window.matchMedia("(display-mode: standalone)").matches) {
			setShowPrompt(false);
		}

		return () => {
			window.removeEventListener("beforeinstallprompt", handler);
		};
	}, []);

	const handleInstall = async () => {
		if (!deferredPrompt) return;

		await deferredPrompt.prompt();
		const { outcome } = await deferredPrompt.userChoice;

		if (outcome === "accepted") {
			setShowPrompt(false);
		}

		setDeferredPrompt(null);
	};

	const handleDismiss = () => {
		setShowPrompt(false);
		setIsDismissed(true);
		localStorage.setItem("pwa-dismissed", "true");
	};

	if (isDismissed || !showPrompt) return null;

	return (
		<AnimatePresence>
			<motion.div
				initial={{ opacity: 0, y: 50 }}
				animate={{ opacity: 1, y: 0 }}
				exit={{ opacity: 0, y: 50 }}
				className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 z-[9999]"
			>
				<div className="bg-card border border-border rounded-xl shadow-2xl p-4">
					<div className="flex items-start gap-3">
						<div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
							<Download className="h-5 w-5 text-primary" />
						</div>
						<div className="flex-1 min-w-0">
							<h3 className="font-semibold text-sm">Install Vachanamrut AI</h3>
							<p className="text-xs text-muted-foreground mt-1">
								Get quick access from your home screen
							</p>
						</div>
						<Button
							variant="ghost"
							size="icon"
							className="h-8 w-8 -mt-1 -mr-1"
							onClick={handleDismiss}
						>
							<X className="h-4 w-4" />
						</Button>
					</div>
					<div className="flex gap-2 mt-3">
						<Button
							variant="outline"
							size="sm"
							className="flex-1"
							onClick={handleDismiss}
						>
							Not now
						</Button>
						<Button size="sm" className="flex-1" onClick={handleInstall}>
							Install
						</Button>
					</div>
				</div>
			</motion.div>
		</AnimatePresence>
	);
}
