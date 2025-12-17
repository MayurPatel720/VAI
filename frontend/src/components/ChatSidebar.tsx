import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "./ui/button";
import {
	MessageSquarePlus,
	History,
	Trash2,
	Edit2,
	Check,
	X,
	ChevronLeft,
	Bookmark,
	Home,
} from "lucide-react";
import { apiRequest } from "../lib/queryClient";

interface Session {
	id: string;
	title: string;
	messageCount: number;
	lastMessageAt: string;
	createdAt: string;
}

interface ChatSidebarProps {
	isOpen: boolean;
	onToggle: () => void;
	currentSessionId?: string;
	onSessionSelect: (sessionId: string) => void;
	onNewSession: () => void;
}

export default function ChatSidebar({
	isOpen,
	onToggle,
	currentSessionId,
	onSessionSelect,
	onNewSession,
}: ChatSidebarProps) {
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const [editingId, setEditingId] = useState<string | null>(null);
	const [editTitle, setEditTitle] = useState("");

	// Fetch sessions
	const { data, isLoading } = useQuery({
		queryKey: ["chat-sessions"],
		queryFn: async () => {
			const res = await apiRequest("GET", "/api/chat/sessions");
			return res.json();
		},
	});

	const sessions: Session[] = data?.sessions || [];

	// Delete session mutation
	const deleteMutation = useMutation({
		mutationFn: async (sessionId: string) => {
			await apiRequest("DELETE", `/api/chat/sessions/${sessionId}`);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["chat-sessions"] });
		},
	});

	// Update session mutation
	const updateMutation = useMutation({
		mutationFn: async ({ id, title }: { id: string; title: string }) => {
			await apiRequest("PATCH", `/api/chat/sessions/${id}`, { title });
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["chat-sessions"] });
			setEditingId(null);
		},
	});

	const handleStartEdit = (session: Session) => {
		setEditingId(session.id);
		setEditTitle(session.title);
	};

	const handleSaveEdit = () => {
		if (editingId && editTitle.trim()) {
			updateMutation.mutate({ id: editingId, title: editTitle.trim() });
		}
	};

	const formatDate = (dateStr: string) => {
		const date = new Date(dateStr);
		const now = new Date();
		const diff = now.getTime() - date.getTime();
		const days = Math.floor(diff / (1000 * 60 * 60 * 24));

		if (days === 0) return "Today";
		if (days === 1) return "Yesterday";
		if (days < 7) return `${days} days ago`;
		return date.toLocaleDateString();
	};

	return (
		<>
			{/* Toggle Button - Only visible when sidebar is closed */}
			<AnimatePresence>
				{!isOpen && (
					<motion.button
						initial={{ scale: 0, opacity: 0 }}
						animate={{ scale: 1, opacity: 1 }}
						exit={{ scale: 0, opacity: 0 }}
						onClick={onToggle}
						title="Chat History"
						style={{
							position: 'fixed',
							left: '16px',
							top: '80px',
							zIndex: 40,
							width: '44px',
							height: '44px',
							borderRadius: '12px',
							backgroundColor: 'var(--card)',
							border: '2px solid hsl(var(--primary) / 0.3)',
							boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.2)',
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							cursor: 'pointer',
						}}
						className="hover:scale-110 hover:shadow-xl transition-transform"
					>
						<History className="h-5 w-5 text-primary" />
					</motion.button>
				)}
			</AnimatePresence>

			{/* Sidebar */}
			<AnimatePresence>
				{isOpen && (
					<>
						{/* Mobile Overlay */}
						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							className="fixed inset-0 bg-black/50 z-[90] md:bg-transparent md:pointer-events-none"
							onClick={onToggle}
						/>

						{/* Sidebar Panel */}
						<motion.aside
							initial={{ x: -300 }}
							animate={{ x: 0 }}
							exit={{ x: -300 }}
							transition={{ type: "spring", damping: 25, stiffness: 300 }}
							className="fixed left-0 top-0 bottom-0 w-72 md:w-80 bg-card border-r border-border z-[95] flex flex-col shadow-2xl"
						>
							{/* Header */}
							<div className="p-4 border-b border-border">
								<div className="flex items-center justify-between mb-4">
									<h2 className="font-semibold text-lg">Chat History</h2>
									<Button
										variant="ghost"
										size="icon"
										onClick={onToggle}
									>
										<ChevronLeft className="h-5 w-5" />
									</Button>
								</div>

								<Button
									onClick={onNewSession}
									className="w-full gap-2"
								>
									<MessageSquarePlus className="h-4 w-4" />
									New Conversation
								</Button>
							</div>

							{/* Sessions List */}
							<div className="flex-1 overflow-y-auto p-2">
								{isLoading ? (
									<div className="flex items-center justify-center py-8">
										<div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
									</div>
								) : sessions.length === 0 ? (
									<div className="text-center py-8 text-muted-foreground">
										<History className="h-12 w-12 mx-auto mb-3 opacity-50" />
										<p className="text-sm">No conversations yet</p>
									</div>
								) : (
									<div className="space-y-1">
										{sessions.map((session) => (
											<div
												key={session.id}
												className={`group rounded-lg transition-colors ${
													currentSessionId === session.id
														? "bg-primary/10 border border-primary/20"
														: "hover:bg-muted/50"
												}`}
											>
												{editingId === session.id ? (
													<div className="p-3 flex items-center gap-2">
														<input
															type="text"
															value={editTitle}
															onChange={(e) => setEditTitle(e.target.value)}
															className="flex-1 bg-muted rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
															autoFocus
															onKeyDown={(e) => {
																if (e.key === "Enter") handleSaveEdit();
																if (e.key === "Escape") setEditingId(null);
															}}
														/>
														<Button
															variant="ghost"
															size="icon"
															className="h-7 w-7"
															onClick={handleSaveEdit}
														>
															<Check className="h-3.5 w-3.5 text-green-500" />
														</Button>
														<Button
															variant="ghost"
															size="icon"
															className="h-7 w-7"
															onClick={() => setEditingId(null)}
														>
															<X className="h-3.5 w-3.5 text-destructive" />
														</Button>
													</div>
												) : (
													<div
														onClick={() => onSessionSelect(session.id)}
														className="w-full p-3 text-left cursor-pointer"
													>
														<div className="flex items-start justify-between gap-2">
															<div className="flex-1 min-w-0">
																<p className="font-medium text-sm truncate">
																	{session.title}
																</p>
																<p className="text-xs text-muted-foreground mt-1">
																	{session.messageCount} messages •{" "}
																	{formatDate(session.lastMessageAt)}
																</p>
															</div>

															<div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
																<Button
																	variant="ghost"
																	size="icon"
																	className="h-7 w-7"
																	onClick={(e) => {
																		e.stopPropagation();
																		handleStartEdit(session);
																	}}
																>
																	<Edit2 className="h-3 w-3" />
																</Button>
																<Button
																	variant="ghost"
																	size="icon"
																	className="h-7 w-7 text-destructive hover:bg-destructive/10"
																	onClick={(e) => {
																		e.stopPropagation();
																		deleteMutation.mutate(session.id);
																	}}
																>
																	<Trash2 className="h-3 w-3" />
																</Button>
															</div>
														</div>
													</div>
												)}
											</div>
										))}
									</div>
								)}
							</div>

							{/* Footer Navigation */}
							<div className="p-3 border-t border-border space-y-1">
								<Button
									variant="ghost"
									className="w-full justify-start gap-2"
									onClick={() => navigate("/bookmarks")}
								>
									<Bookmark className="h-4 w-4" />
									Saved Bookmarks
								</Button>
								<Button
									variant="ghost"
									className="w-full justify-start gap-2"
									onClick={() => navigate("/")}
								>
									<Home className="h-4 w-4" />
									Back to Home
								</Button>
								<Button
									variant="ghost"
									className="w-full justify-start gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
									onClick={async () => {
										if (confirm("Delete ALL chat history? This cannot be undone.")) {
											try {
												await apiRequest("DELETE", "/api/chat/history");
												queryClient.invalidateQueries({ queryKey: ["/api/chat/history"] });
												queryClient.invalidateQueries({ queryKey: ["chat-sessions"] });
											} catch (e) {
												console.error("Failed to delete history", e);
											}
										}
									}}
								>
									<Trash2 className="h-4 w-4" />
									Delete All History
								</Button>
							</div>
						</motion.aside>
					</>
				)}
			</AnimatePresence>
		</>
	);
}
