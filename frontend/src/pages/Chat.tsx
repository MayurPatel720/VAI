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

export default function Chat() {
	const [isTyping, setIsTyping] = useState(false);
	const messagesEndRef = useRef<HTMLDivElement>(null);
	const { user, isAuthenticated } = useAuth();
	const { toast } = useToast();
	console.log(user);

	// Fetch chat history for authenticated users
	const { data: chatHistory = [] } = useQuery<any[]>({
		queryKey: ["/api/chat/history"],
		enabled: isAuthenticated,
		retry: false,
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
			setIsTyping(false);
		},
		onError: (error: any) => {
			setIsTyping(false);

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
		<div className="flex flex-col h-screen" data-testid="page-chat">
			<ChatHeader />

			<main className="flex-1 overflow-y-auto">
				<div className="max-w-4xl mx-auto px-4 py-8">
					{chatHistory.length === 0 ? (
						<WelcomeCard onPromptClick={handlePromptClick} />
					) : (
						<div className="space-y-4">
							{chatHistory.map((message) => (
								<ChatMessage
									key={message.id}
									message={message.message}
									isBot={message.isBot}
									timestamp={
										message.timestamp ? new Date(message.timestamp) : undefined
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
				disabled={isTyping || sendMessageMutation.isPending}
			/>
		</div>
	);
}
