/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useRef, useEffect } from "react";
import ChatMessage from "../components/ChatMessage";
import ChatInput from "../components/ChatInput";
import WelcomeCard from "../components/WelcomeCard";
import TypingIndicator from "../components/TypingIndicator";
import { useAuth } from "../hooks/useAuth";
import { apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "../hooks/use-toast";
import { isUnauthorizedError } from "../lib/authUtils";
import ChatHeader from "../components/ChatHeader";
import { useMutation, useQuery } from "@tanstack/react-query";
import UpgradeModal from "../components/UpgradeModal";

export default function Chat() {
	const [isTyping, setIsTyping] = useState(false);
	const [showUpgrade, setShowUpgrade] = useState(false);

	const messagesEndRef = useRef<HTMLDivElement>(null);
	const { isAuthenticated, user } = useAuth();
	const { toast } = useToast();

	// Chat usage query
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
		if (remaining === 0) setShowUpgrade(true);
	}, [remaining]);

	// Fetch chat history
	const { data: chatHistory = [] } = useQuery({
		queryKey: ["/api/chat/history"],
		enabled: isAuthenticated,
		retry: false,
		queryFn: async () => {
			const res = await apiRequest("GET", "/api/chat/history");
			return res.json();
		},
	});

	const scrollToBottom = () => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	};

	useEffect(() => {
		scrollToBottom();
	}, [chatHistory, isTyping]);

	// Send message mutation
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
					description: "Please login again to continue chatting",
					variant: "destructive",
				});
				setTimeout(() => {
					window.location.href = "/api/login";
				}, 1000);
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
			toast({
				title: "Login Required",
				description: "Please login to start chatting",
				variant: "destructive",
			});
			setTimeout(() => {
				window.location.href = "/api/login";
			}, 1000);
			return;
		}

		setIsTyping(true);
		sendMessageMutation.mutate(text);
	};

	const handlePromptClick = (prompt: string) => {
		handleSendMessage(prompt);
	};

	return (
		<div
			className="
				flex flex-col h-screen 
				bg-[#f5f5f7] dark:bg-background 
				text-foreground
			"
			data-testid="page-chat"
		>
			<ChatHeader />

			{/* SOFT BACKGROUND SECTION ADDED */}
			<main className="flex-1 overflow-y-auto bg-[#fafafa] dark:bg-background/80">
				<div
					className="max-w-4xl mx-auto px-4 py-8 
					bg-transparent
					"
				>
					{chatHistory.length === 0 ? (
						<WelcomeCard onPromptClick={handlePromptClick} />
					) : (
						<div className="space-y-4">
							{chatHistory.map((message: any) => (
								<ChatMessage
									key={message.id}
									message={message.message}
									isBot={message.isBot}
									timestamp={
										message.createdAt ? new Date(message.createdAt) : undefined
									}
								/>
							))}

							{isTyping && <TypingIndicator />}
							<div ref={messagesEndRef} />
						</div>
					)}
				</div>
			</main>

			<ChatInput
				onSendMessage={handleSendMessage}
				disabled={isTyping || sendMessageMutation.isPending || remaining === 0}
			/>

			<UpgradeModal open={showUpgrade} onClose={() => setShowUpgrade(false)} />
		</div>
	);
}
