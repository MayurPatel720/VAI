/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useRef, useEffect, useCallback } from "react";
import ChatMessage from "../components/ChatMessage";
import ChatInput from "../components/ChatInput";
import WelcomeCard from "../components/WelcomeCard";
import ChatHeader from "../components/ChatHeader";
import UpgradeModal from "../components/UpgradeModal";
import { useAuth } from "../hooks/useAuth";
import { apiRequest, baseURL, queryClient } from "../lib/queryClient";
import { useToast } from "../hooks/use-toast";
import { isUnauthorizedError } from "../lib/authUtils";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ArrowDown, Sparkles, Loader2, Volume2, Square } from "lucide-react";
import ChatSidebar from "../components/ChatSidebar";
import ShareModal from "../components/ShareModal";
import { useGoogleTTS } from "../hooks/useGoogleTTS";

export default function Chat() {
	const [isTyping, setIsTyping] = useState(false);
	const [showUpgrade, setShowUpgrade] = useState(false);
	const [showScrollButton, setShowScrollButton] = useState(false);
	const [sidebarOpen, setSidebarOpen] = useState(false);
	const [currentSessionId, setCurrentSessionId] = useState<string | undefined>();
	const [pendingUserMessage, setPendingUserMessage] = useState<string | null>(null);
	const [streamingMessage, setStreamingMessage] = useState<string>("");
	const [suggestedQuestions] = useState<string[]>([]);

	const messagesEndRef = useRef<HTMLDivElement>(null);
	const scrollContainerRef = useRef<HTMLDivElement>(null);
	const abortControllerRef = useRef<AbortController | null>(null);

	const { isAuthenticated, user } = useAuth();
	const { toast } = useToast();
	const { speak, stop, isSpeaking, isLoading: ttsLoading } = useGoogleTTS();

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
				.catch(() => {
					// Silent fail - not critical for app functionality
				});
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

	const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
		messagesEndRef.current?.scrollIntoView({ behavior });
	}, []);

	useEffect(() => {
		if (chatHistory?.length || isTyping || pendingUserMessage || streamingMessage) {
			scrollToBottom();
		}
	}, [chatHistory, isTyping, pendingUserMessage, streamingMessage]);

	const handleScroll = useCallback(() => {
		if (!scrollContainerRef.current) return;
		const { scrollTop, scrollHeight, clientHeight } =
			scrollContainerRef.current;
		const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
		setShowScrollButton(!isNearBottom);
	}, []);

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
			setPendingUserMessage(null);
		},
		onError: (error: any) => {
			setIsTyping(false);
			setPendingUserMessage(null);
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

	// Stop generation function
	const stopGeneration = useCallback(() => {
		if (abortControllerRef.current) {
			abortControllerRef.current.abort();
			abortControllerRef.current = null;
		}
		setIsTyping(false);
		// Keep the partial response if any
		if (streamingMessage) {
			queryClient.invalidateQueries({ queryKey: ["/api/chat/history", currentSessionId] });
		}
		setPendingUserMessage(null);
		setStreamingMessage("");
	}, [streamingMessage, currentSessionId]);

	const handleSendMessage = async (text: string) => {
		if (remaining === 0) {
			setShowUpgrade(true);
			return;
		}
		if (!isAuthenticated) {
			toast({ title: "Login Required", variant: "destructive" });
			return;
		}
		
		// Show the user message immediately
		setPendingUserMessage(text);
		setIsTyping(true);
		setStreamingMessage("");

		// Create new AbortController for this request
		abortControllerRef.current = new AbortController();

		try {
			const token = localStorage.getItem("token");
			const response = await fetch(`${baseURL}/api/chat/stream`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"Authorization": `Bearer ${token}`,
				},
				body: JSON.stringify({
					message: text,
					sessionId: currentSessionId,
				}),
				signal: abortControllerRef.current.signal,
			});

			if (response.status === 403) {
				setShowUpgrade(true);
				setIsTyping(false);
				setPendingUserMessage(null);
				return;
			}

			if (!response.ok || !response.body) {
				throw new Error("Streaming failed");
			}

			const reader = response.body.getReader();
			const decoder = new TextDecoder();
			let fullMessage = "";

			while (true) {
				const { done, value } = await reader.read();
				if (done) break;

				const chunk = decoder.decode(value);
				const lines = chunk.split("\n\n");

				for (const line of lines) {
					if (line.startsWith("data: ")) {
						try {
							const data = JSON.parse(line.slice(6));
							if (data.error) {
								throw new Error(data.error);
							}
							if (data.content) {
								fullMessage += data.content;
								setStreamingMessage(fullMessage);
							}
							if (data.done) {
								// Streaming complete
								setIsTyping(false);
								setPendingUserMessage(null);
								setStreamingMessage("");
								// Refresh chat history to include saved message
								queryClient.invalidateQueries({ queryKey: ["/api/chat/history"] });
								queryClient.invalidateQueries({ queryKey: ["chat-usage"] });
								queryClient.invalidateQueries({ queryKey: ["chat-sessions"] });
							}
						} catch (parseError) {
							// Skip invalid JSON
						}
					}
				}
			}
		} catch (error: any) {
			setIsTyping(false);
			setPendingUserMessage(null);
			setStreamingMessage("");
			
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
		}
	};

	const handlePromptClick = useCallback((prompt: string) => {
		handleSendMessage(prompt);
	}, [remaining, isAuthenticated]);

	// Share State
	const [isShareOpen, setIsShareOpen] = useState(false);
	const [shareContent, setShareContent] = useState("");
	const [shareMessageId, setShareMessageId] = useState("");

	const handleShare = useCallback((messageId: string, content: string) => {
		setShareContent(content);
		setShareMessageId(messageId);
		setIsShareOpen(true);
	}, []);

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
						{chatHistory.length === 0 && !pendingUserMessage ? (
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
								onRegenerate={(messageId) => {
									// Find the previous user message and resend it
									const messageIndex = chatHistory.findIndex((m: any) => m.id === messageId);
									if (messageIndex > 0) {
										const previousMessage = chatHistory[messageIndex - 1];
										if (!previousMessage.isBot) {
											handleSendMessage(previousMessage.message);
										}
									}
								}}
							/>
								))}

								{/* Pending User Message - Shows immediately */}
								{pendingUserMessage && (
						<div className="group flex w-full gap-4 px-2 md:px-8 justify-end">
							<div className="flex w-full md:max-w-[75%] gap-2 md:gap-3 flex-row-reverse">
											<div className="flex flex-col min-w-0 items-end">
												<div className="flex items-center gap-2 mb-1 flex-row-reverse">
													<span className="text-sm font-semibold text-foreground/90">You</span>
												</div>
												<div className="rounded-2xl px-4 py-3 shadow-sm border bg-primary text-primary-foreground border-primary/20 rounded-tr-none">
													<div className="prose max-w-none text-[15px] leading-7 break-words prose-invert">
														{pendingUserMessage}
													</div>
												</div>
											</div>
										</div>
									</div>
								)}

								{/* AI Streaming Response / Thinking Indicator */}
								{isTyping && (
						<div className="flex w-full gap-2 md:gap-4 p-2 md:p-4 justify-start">
							<div className="flex flex-row gap-3 w-full md:max-w-[85%]">
											<div className="flex-shrink-0 mt-1">
												<div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center">
													<Sparkles className="h-4 w-4 text-amber-600 animate-spin-slow" />
												</div>
											</div>
											<div className="flex flex-col min-w-0">
												<div className="flex items-center gap-2 mb-1">
													<span className="text-sm font-semibold text-amber-600">Vachanamrut AI</span>
												</div>
												<div className="bg-background border border-border rounded-2xl rounded-tl-none px-4 py-3 shadow-sm">
													{streamingMessage ? (
														<div className="prose prose-sm dark:prose-invert max-w-none text-[15px] leading-7 break-words">
															{streamingMessage}
															<span className="inline-block w-2 h-4 ml-1 bg-amber-500 animate-pulse" />
														</div>
													) : (
														<div className="flex items-center gap-2">
															<Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
															<span className="text-sm text-muted-foreground font-medium">
																Thinking...
															</span>
														</div>
													)}
												</div>
												{/* Stop Button */}
												<button
													onClick={stopGeneration}
													className="flex items-center gap-1.5 mt-2 px-3 py-1.5 rounded-full bg-red-500/10 hover:bg-red-500/20 text-red-600 border border-red-500/30 text-xs font-medium transition-colors"
													title="Stop generating"
												>
													<Square className="h-3 w-3 fill-current" />
													Stop
												</button>
											</div>
										</div>
									</div>
								)}

				{/* Suggested Follow-up Questions */}
			{!isTyping && chatHistory.length > 0 && (
				<div className="px-2 md:px-8 py-2">
					<div className="flex flex-col md:flex-row md:flex-wrap gap-2 justify-center items-stretch md:items-center">
						{/* Listen Button - Prominent position */}
						<button
							onClick={() => {
								// Find last bot message
								const lastBotMessage = [...chatHistory].reverse().find((m: any) => m.isBot);
								if (lastBotMessage) {
									if (isSpeaking) {
										stop();
									} else {
										speak(lastBotMessage.message);
									}
								}
							}}
							disabled={ttsLoading}
							className={`w-full md:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-full font-medium transition-all ${
								isSpeaking 
									? "bg-amber-500 text-white" 
									: ttsLoading
										? "bg-amber-500/5 text-amber-400 border border-amber-500/20 cursor-wait"
										: "bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 border border-amber-500/30"
							}`}
							title={isSpeaking ? "Stop listening" : ttsLoading ? "Loading..." : "Listen to response"}
						>
							{ttsLoading ? (
								<Loader2 className="h-4 w-4 animate-spin" />
							) : (
								<Volume2 className={`h-4 w-4 ${isSpeaking ? "animate-pulse" : ""}`} />
							)}
							<span className="text-sm whitespace-normal md:whitespace-nowrap text-center">
								{isSpeaking ? "Stop" : ttsLoading ? "Loading..." : "Listen in Mahant Swami Maharaj's voice"}
							</span>
						</button>
						
						{/* Suggested Questions */}
						{(suggestedQuestions.length > 0 ? suggestedQuestions : [
							"Tell me about bhakti (devotion)",
							"What is the importance of satsang?",
							"How to overcome worldly attachments?",
						]).map((question, idx) => (
							<button
								key={idx}
								onClick={() => handleSendMessage(question)}
								className="w-full md:w-auto px-4 py-2 text-sm bg-muted/50 hover:bg-muted border border-border rounded-full text-muted-foreground hover:text-foreground transition-colors text-center"
							>
								{question}
							</button>
						))}
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
