/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useRef, useEffect } from "react";
import ChatMessage from "../components/ChatMessage";
import ChatInput from "../components/ChatInput";
import WelcomeCard from "../components/WelcomeCard";
import ChatHeader from "../components/ChatHeader";
import UpgradeModal from "../components/UpgradeModal";
import { useAuth } from "../hooks/useAuth";
import { apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "../hooks/use-toast";
import { isUnauthorizedError } from "../lib/authUtils";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ArrowDown, Sparkles, Loader2 } from "lucide-react";
import { Button } from "../components/ui/button";

export default function Chat() {
	const [isTyping, setIsTyping] = useState(false);
	const [showUpgrade, setShowUpgrade] = useState(false);
	const [showScrollButton, setShowScrollButton] = useState(false);

	const messagesEndRef = useRef<HTMLDivElement>(null);
	const scrollContainerRef = useRef<HTMLDivElement>(null);

	const { isAuthenticated, user } = useAuth();
	const { toast } = useToast();

	// 1. Fetch Chat Usage
	const { data: usage } = useQuery({
		queryKey: ["chat-usage"],
		queryFn: async () => {
			const res = await apiRequest("GET", "/api/chat/usage");
			return res.json();
		},
		enabled: !!user,
	});

	const LIMITS = {
		FREE: 3,
		silver: 30,
		gold: 60,
		premium: 150,
	} as const;

	const plan = (user?.subscription?.plan || "FREE") as keyof typeof LIMITS;
	const maxChats = LIMITS[plan];
	const used = usage?.todayCount || 0;
	const remaining = Math.max(0, maxChats - used);

	useEffect(() => {
		if (remaining === 0 && used > 0) setShowUpgrade(true);
	}, [remaining, used]);

	// 2. Fetch Chat History
	const { data: chatHistory = [] } = useQuery({
		queryKey: ["/api/chat/history"],
		enabled: isAuthenticated,
		retry: false,
		queryFn: async () => {
			const res = await apiRequest("GET", "/api/chat/history");
			return res.json();
		},
	});

	const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
		messagesEndRef.current?.scrollIntoView({ behavior });
	};

	useEffect(() => {
		if (chatHistory?.length || isTyping) {
			scrollToBottom();
		}
	}, [chatHistory, isTyping]);

	const handleScroll = () => {
		if (!scrollContainerRef.current) return;
		const { scrollTop, scrollHeight, clientHeight } =
			scrollContainerRef.current;
		const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
		setShowScrollButton(!isNearBottom);
	};

	// 3. Send Message
	const sendMessageMutation = useMutation({
		mutationFn: async (message: string) => {
			const response = await apiRequest("POST", "/api/chat/message", {
				message,
			});
			return response.json();
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["/api/chat/history"] });
			queryClient.invalidateQueries({ queryKey: ["chat-usage"] });
			setIsTyping(false);
		},
		onError: (error: any) => {
			setIsTyping(false);
			if (error.status === 403) {
				setShowUpgrade(true);
				return;
			}
			if (isUnauthorizedError(error)) {
				toast({
					title: "Session Expired",
					description: "Please login again.",
					variant: "destructive",
				});
				setTimeout(() => (window.location.href = "/login"), 1000);
				return;
			}
			toast({
				title: "Error",
				description: error.message || "Failed to send message",
				variant: "destructive",
			});
		},
	});

	const handleSendMessage = async (text: string) => {
		if (remaining === 0) {
			setShowUpgrade(true);
			return;
		}
		if (!isAuthenticated) {
			toast({ title: "Login Required", variant: "destructive" });
			return;
		}
		setIsTyping(true);
		sendMessageMutation.mutate(text);
	};

	const handlePromptClick = (prompt: string) => {
		handleSendMessage(prompt);
	};

	return (
		// Use 100dvh for mobile browsers to handle address bar
		<div className="flex flex-col h-[100dvh] bg-background text-foreground overflow-hidden">
			<ChatHeader />

			<main
				ref={scrollContainerRef}
				onScroll={handleScroll}
				className="flex-1 overflow-y-auto relative scroll-smooth bg-slate-50/50 dark:bg-background/50"
			>
				<div className="min-h-full flex flex-col items-center py-4">
					<div className="w-full max-w-3xl flex-1 flex flex-col px-2 md:px-4">
						{chatHistory.length === 0 ? (
							<div className="flex-1 flex flex-col justify-center my-auto">
								<WelcomeCard onPromptClick={handlePromptClick} />
							</div>
						) : (
							<div className="flex flex-col gap-4 pb-4">
								{chatHistory.map((message: any) => (
									<ChatMessage
										key={message.id}
										message={message.message}
										isBot={message.isBot}
										timestamp={
											message.createdAt
												? new Date(message.createdAt)
												: undefined
										}
										userInitials={user?.firstName?.[0] || "U"}
									/>
								))}

								{/* AI Thinking Indicator */}
								{isTyping && (
									<div className="flex w-full gap-2 md:gap-4 p-2 md:p-4 justify-start animate-pulse">
										<div className="flex flex-row gap-3 max-w-[85%]">
											<div className="flex-shrink-0 mt-1">
												<div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center">
													<Sparkles className="h-4 w-4 text-amber-600 animate-spin-slow" />
												</div>
											</div>
											<div className="bg-background border border-border rounded-2xl rounded-tl-none px-4 py-3 shadow-sm flex items-center gap-2">
												<Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
												<span className="text-sm text-muted-foreground font-medium">
													Thinking...
												</span>
											</div>
										</div>
									</div>
								)}
								<div ref={messagesEndRef} className="h-2" />
							</div>
						)}
					</div>
				</div>

				{showScrollButton && (
					<Button
						size="icon"
						variant="secondary"
						className="absolute bottom-4 right-4 rounded-full shadow-lg opacity-90 hover:opacity-100 z-10"
						onClick={() => scrollToBottom()}
					>
						<ArrowDown className="h-4 w-4" />
					</Button>
				)}
			</main>

			<div className="bg-background/80 backdrop-blur-lg z-20 border-t">
				<ChatInput
					onSendMessage={handleSendMessage}
					disabled={
						isTyping || sendMessageMutation.isPending || remaining === 0
					}
				/>
			</div>

			<UpgradeModal open={showUpgrade} onClose={() => setShowUpgrade(false)} />
		</div>
	);
}
