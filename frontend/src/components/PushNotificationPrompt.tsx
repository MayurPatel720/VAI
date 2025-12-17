import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Bell, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { 
	initOneSignal, 
	promptForPushPermission, 
	getPlayerId, 
	hasNotificationPermission,
	setExternalUserId
} from "../lib/onesignal";
import { useAuth } from "../hooks/useAuth";

export default function PushNotificationPrompt() {
	const [showPrompt, setShowPrompt] = useState(false);
	const [isDismissed, setIsDismissed] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const { user, isAuthenticated } = useAuth();

	useEffect(() => {
		// Initialize OneSignal
		initOneSignal();

		const checkAndShow = async () => {
			// Check if already dismissed
			const dismissed = localStorage.getItem("push-prompt-dismissed");
			if (dismissed) {
				setIsDismissed(true);
				return;
			}

			// Wait a bit before showing
			await new Promise(resolve => setTimeout(resolve, 3000));

			// Check if already has permission
			const hasPermission = await hasNotificationPermission();
			if (hasPermission) {
				return;
			}

			// Only show if authenticated
			if (isAuthenticated) {
				setShowPrompt(true);
			}
		};

		checkAndShow();
	}, [isAuthenticated]);

	// Set external user ID when authenticated
	useEffect(() => {
		if (isAuthenticated && user?.id) {
			setExternalUserId(user.id);
		}
	}, [isAuthenticated, user?.id]);

	const handleEnable = async () => {
		setIsLoading(true);
		
		// Timeout safety - if nothing happens in 10s, reset
		const timeoutId = setTimeout(() => {
			setIsLoading(false);
			console.warn("Notification permission request timed out");
		}, 10000);

		try {
			const granted = await promptForPushPermission();
			clearTimeout(timeoutId);
			
			if (granted) {
				const playerId = await getPlayerId();
				if (playerId) {
					// Register with backend
					const token = localStorage.getItem("token");
					if (token) {
						await fetch("/api/notifications/register", {
							method: "POST",
							headers: {
								"Content-Type": "application/json",
								"Authorization": `Bearer ${token}`,
							},
							body: JSON.stringify({ playerId }),
						});
					}
				}
				// Provide success feedback or just close
				setShowPrompt(false);
				localStorage.setItem("push-prompt-dismissed", "true");
			} else {
				// Permission denied
				setIsLoading(false);
			}
		} catch (error) {
			clearTimeout(timeoutId);
			console.error("Error enabling notifications:", error);
			setIsLoading(false);
		}
	};

	const handleDismiss = () => {
		setShowPrompt(false);
		setIsDismissed(true);
		localStorage.setItem("push-prompt-dismissed", "true");
	};

	const handleMaybeLater = () => {
		setShowPrompt(false);
		// Don't permanently dismiss, will show again next session
	};

	if (isDismissed || !showPrompt) return null;

	return (
		<AnimatePresence>
			<motion.div
				initial={{ opacity: 0, y: 50 }}
				animate={{ opacity: 1, y: 0 }}
				exit={{ opacity: 0, y: 50 }}
				className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 z-[9998]"
			>
				<div className="bg-card border border-border rounded-xl shadow-2xl p-4">
					<div className="flex items-start gap-3">
						<div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
							<Bell className="h-5 w-5 text-primary" />
						</div>
						<div className="flex-1 min-w-0">
							<h3 className="font-semibold text-sm">Daily Spiritual Wisdom 🙏</h3>
							<p className="text-xs text-muted-foreground mt-1">
								Receive daily quotes from Vachanamrut and updates
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
							onClick={handleMaybeLater}
							disabled={isLoading}
						>
							Maybe Later
						</Button>
						<Button 
							size="sm" 
							className="flex-1" 
							onClick={handleEnable}
							disabled={isLoading}
						>
							{isLoading ? "Enabling..." : "Enable"}
						</Button>
					</div>
				</div>
			</motion.div>
		</AnimatePresence>
	);
}
