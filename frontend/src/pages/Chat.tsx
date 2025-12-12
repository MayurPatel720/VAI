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
import ChatSidebar from "../components/ChatSidebar";
import ShareModal from "../components/ShareModal";

export default function Chat() {
	const [isTyping, setIsTyping] = useState(false);
	const [showUpgrade, setShowUpgrade] = useState(false);
	const [showScrollButton, setShowScrollButton] = useState(false);
	const [sidebarOpen, setSidebarOpen] = useState(false);
	const [currentSessionId, setCurrentSessionId] = useState<string | undefined>();

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

	// Fetch active session on mount
	useEffect(() => {
		if (isAuthenticated && !currentSessionId) {
			apiRequest("GET", "/api/chat/sessions/active")
				.then((res) => res.json())
				.then((session) => {
					if (session && session.id) {
						setCurrentSessionId(session.id);
					}
				})
				.catch((err) => console.error("Failed to load active session", err));
		}
	}, [isAuthenticated]);

	// 2. Fetch Chat History
	const { data: chatHistory = [] } = useQuery({
		queryKey: ["/api/chat/history", currentSessionId],
		enabled: isAuthenticated,
		retry: false,
		queryFn: async () => {
			const url = currentSessionId 
				? `/api/chat/history?sessionId=${currentSessionId}` 
				: "/api/chat/history";
			const res = await apiRequest("GET", url);
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

	// Check scroll position on mount and when messages change
	useEffect(() => {
		handleScroll();
	}, [chatHistory]);

	// 3. Send Message
	const sendMessageMutation = useMutation({
		mutationFn: async (message: string) => {
			const response = await apiRequest("POST", "/api/chat/message", {
				message,
				sessionId: currentSessionId,
			});
			return response.json();
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["/api/chat/history"] });
			queryClient.invalidateQueries({ queryKey: ["chat-usage"] });
			queryClient.invalidateQueries({ queryKey: ["chat-sessions"] });
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

	// Share State
	const [isShareOpen, setIsShareOpen] = useState(false);
	const [shareContent, setShareContent] = useState("");
	const [shareMessageId, setShareMessageId] = useState("");

	const handleShare = (messageId: string, content: string) => {
		setShareContent(content);
		setShareMessageId(messageId);
		setIsShareOpen(true);
	};

	return (
		// Use 100dvh for mobile browsers to handle address bar
		<div className="flex flex-col h-[100dvh] bg-background text-foreground overflow-hidden">
			<ChatHeader />

			{/* Chat Sidebar */}
			<ChatSidebar
				isOpen={sidebarOpen}
				onToggle={() => setSidebarOpen(!sidebarOpen)}
				currentSessionId={currentSessionId}
				onSessionSelect={(sessionId) => {
					setCurrentSessionId(sessionId);
					setSidebarOpen(false);
				}}
				onNewSession={async () => {
					try {
						// Create a new session (saves current chat to history)
						const res = await apiRequest("POST", "/api/chat/sessions", {
							title: "New Conversation"
						});
						const newSession = await res.json();
						// Invalidate queries to refresh sidebar
						queryClient.invalidateQueries({ queryKey: ["chat-sessions"] });
						queryClient.invalidateQueries({ queryKey: ["/api/chat/history"] });
						setCurrentSessionId(newSession.id);
						setSidebarOpen(false);
						toast({
							title: "New conversation",
							description: "Your previous chat is saved in history.",
						});
					} catch (error) {
						toast({
							title: "Error",
							description: "Failed to start new conversation.",
							variant: "destructive",
						});
					}
				}}
			/>

			<main
				ref={scrollContainerRef}
				onScroll={handleScroll}
				className="flex-1 overflow-y-auto relative scroll-smooth bg-muted/20 dark:bg-background"
			>
				{/* Chat content */}
				<div className="min-h-full flex flex-col items-center py-6 md:py-10">
					<div className="w-full max-w-4xl flex-1 flex flex-col px-4 md:px-6">
						{chatHistory.length === 0 ? (
							<div className="flex-1 flex flex-col justify-center my-auto">
								<WelcomeCard onPromptClick={handlePromptClick} />
							</div>
						) : (
							<div className="flex flex-col gap-4 pb-4">
								{chatHistory.map((message: any) => (
									<ChatMessage
										key={message.id}
										id={message.id}
										message={message.message}
										isBot={message.isBot}
										timestamp={
											message.createdAt
												? new Date(message.createdAt)
												: undefined
										}
										userInitials={user?.firstName?.[0] || "U"}
										onShare={(id, content) => handleShare(id, content)}
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

				</main>

			{/* Scroll to bottom button - outside main for proper z-index */}
			{showScrollButton && (
				<button
					onClick={() => scrollToBottom()}
					title="Scroll to latest"
					style={{
						position: 'fixed',
						bottom: '112px',
						left: '50%',
						transform: 'translateX(-50%)',
						zIndex: 50,
						width: '48px',
						height: '48px',
						borderRadius: '50%',
						backgroundColor: 'hsl(var(--primary))',
						color: 'white',
						boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						border: 'none',
						cursor: 'pointer',
					}}
					className="hover:opacity-90 transition-opacity"
				>
					<ArrowDown className="h-5 w-5" />
				</button>
			)}

			<div className="bg-background/80 backdrop-blur-lg z-20 border-t">
				<ChatInput
					onSendMessage={handleSendMessage}
					disabled={
						isTyping || sendMessageMutation.isPending || remaining === 0
					}
				/>
			</div>

			<UpgradeModal open={showUpgrade} onClose={() => setShowUpgrade(false)} />
			
			<ShareModal
				isOpen={isShareOpen}
				onClose={() => setIsShareOpen(false)}
				content={shareContent}
				messageId={shareMessageId}
				sessionId={currentSessionId}
				toggleEnabled={true} // Allow switching to conversation sharing
			/>
		</div>
	);
}
