import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Button } from "../components/ui/button";
import { apiRequest } from "../lib/queryClient";
import {
	ArrowLeft,
	Search as SearchIcon,
	MessageSquare,
	Bookmark,
	History,
	Loader2,
	X,
	Calendar,
} from "lucide-react";
import { useDebounce } from "../hooks/useDebounce";

interface SearchResult {
	id: string;
	type: "message" | "bookmark" | "session";
	content?: string;
	title?: string;
	isBot?: boolean;
	category?: string;
	note?: string;
	sessionId?: string;
	messageCount?: number;
	createdAt: string;
}

interface SearchResponse {
	messages: SearchResult[];
	bookmarks: SearchResult[];
	sessions: SearchResult[];
	totalCount: number;
}

export default function Search() {
	const navigate = useNavigate();
	const [query, setQuery] = useState("");
	const [filter, setFilter] = useState<"all" | "messages" | "bookmarks" | "sessions">("all");
	const debouncedQuery = useDebounce(query, 300);

	// Search query
	const { data, isLoading, isFetching } = useQuery<SearchResponse>({
		queryKey: ["search", debouncedQuery, filter],
		queryFn: async () => {
			if (!debouncedQuery || debouncedQuery.length < 2) {
				return { messages: [], bookmarks: [], sessions: [], totalCount: 0 };
			}
			const res = await apiRequest("GET", `/api/search?q=${encodeURIComponent(debouncedQuery)}&type=${filter}`);
			return res.json();
		},
		enabled: debouncedQuery.length >= 2,
	});

	const highlightText = useCallback((text: string, searchQuery: string) => {
		if (!searchQuery) return text;
		try {
			const regex = new RegExp(`(${searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, "gi");
			const parts = text.split(regex);
			return parts.map((part, i) =>
				regex.test(part) ? (
					<mark key={i} className="bg-primary/30 text-foreground px-0.5 rounded">
						{part}
					</mark>
				) : (
					part
				)
			);
		} catch {
			return text;
		}
	}, []);

	const filterButtons = [
		{ key: "all", label: "All", icon: SearchIcon },
		{ key: "messages", label: "Messages", icon: MessageSquare },
		{ key: "bookmarks", label: "Bookmarks", icon: Bookmark },
		{ key: "sessions", label: "Sessions", icon: History },
	] as const;

	const handleResultClick = (result: SearchResult) => {
		if (result.type === "session") {
			navigate(`/chat?session=${result.id}`);
		} else if (result.type === "bookmark") {
			navigate("/bookmarks");
		} else if (result.sessionId) {
			navigate(`/chat?session=${result.sessionId}`);
		} else {
			navigate("/chat");
		}
	};

	return (
		<div className="min-h-screen bg-background">
			{/* Header */}
			<header className="sticky top-0 z-10 bg-background/95 backdrop-blur-md border-b border-border">
				<div className="max-w-3xl mx-auto px-4 py-4">
					<div className="flex items-center gap-3">
						<Button 
							variant="ghost" 
							size="icon" 
							onClick={() => navigate("/chat")}
							className="flex-shrink-0"
						>
							<ArrowLeft className="h-5 w-5" />
						</Button>
						
						{/* Search Input */}
						<div className="flex-1 relative">
							<SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
							<input
								type="text"
								value={query}
								onChange={(e) => setQuery(e.target.value)}
								placeholder="Search messages, bookmarks, sessions..."
								autoFocus
								className="w-full pl-9 pr-9 h-11 bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
							/>
							{query && (
								<button
									onClick={() => setQuery("")}
									className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
								>
									<X className="h-4 w-4" />
								</button>
							)}
						</div>
					</div>

					{/* Filter buttons */}
					<div className="flex gap-2 mt-4 overflow-x-auto pb-1">
						{filterButtons.map(({ key, label, icon: Icon }) => (
							<Button
								key={key}
								variant={filter === key ? "default" : "outline"}
								size="sm"
								onClick={() => setFilter(key)}
								className={`flex items-center gap-1.5 rounded-full ${
									filter === key 
										? "" 
										: "bg-muted/50 border-border hover:bg-muted"
								}`}
							>
								<Icon className="h-3.5 w-3.5" />
								{label}
							</Button>
						))}
					</div>
				</div>
			</header>

			<main className="max-w-3xl mx-auto px-4 py-6">
				{/* Loading state */}
				{(isLoading || isFetching) && debouncedQuery.length >= 2 && (
					<div className="flex items-center justify-center py-16">
						<Loader2 className="h-6 w-6 animate-spin text-primary" />
						<span className="ml-3 text-muted-foreground">Searching...</span>
					</div>
				)}

				{/* Empty state */}
				{!isLoading && !isFetching && debouncedQuery.length < 2 && (
					<div className="text-center py-20">
						<div className="h-16 w-16 mx-auto bg-muted rounded-full flex items-center justify-center mb-4">
							<SearchIcon className="h-8 w-8 text-muted-foreground" />
						</div>
						<h2 className="text-xl font-semibold mb-2">Search Your History</h2>
						<p className="text-muted-foreground max-w-sm mx-auto">
							Find messages, bookmarks, and conversations. Type at least 2 characters to start searching.
						</p>
					</div>
				)}

				{/* No results */}
				{!isLoading && !isFetching && debouncedQuery.length >= 2 && data?.totalCount === 0 && (
					<div className="text-center py-20">
						<div className="h-16 w-16 mx-auto bg-muted rounded-full flex items-center justify-center mb-4">
							<SearchIcon className="h-8 w-8 text-muted-foreground" />
						</div>
						<h2 className="text-xl font-semibold mb-2">No Results Found</h2>
						<p className="text-muted-foreground">
							Try different keywords or adjust your filters.
						</p>
					</div>
				)}

				{/* Results */}
				{data && data.totalCount > 0 && (
					<div className="space-y-8">
						{/* Messages */}
						{data.messages.length > 0 && (
							<section>
								<h3 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
									<MessageSquare className="h-4 w-4" />
									Messages ({data.messages.length})
								</h3>
								<div className="space-y-2">
									{data.messages.map((msg) => (
										<button
											key={msg.id}
											onClick={() => handleResultClick(msg)}
											className="w-full text-left p-4 bg-card border border-border rounded-xl hover:bg-accent hover:border-accent transition-colors"
										>
											<div className="flex items-start gap-3">
												<div className={`h-9 w-9 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-medium ${
													msg.isBot 
														? "bg-primary/10 text-primary" 
														: "bg-muted text-muted-foreground"
												}`}>
													{msg.isBot ? "AI" : "U"}
												</div>
												<div className="flex-1 min-w-0">
													<p className="text-sm line-clamp-2 text-foreground">
														{highlightText(msg.content || "", debouncedQuery)}
													</p>
													<div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
														<Calendar className="h-3 w-3" />
														{new Date(msg.createdAt).toLocaleDateString()}
													</div>
												</div>
											</div>
										</button>
									))}
								</div>
							</section>
						)}

						{/* Bookmarks */}
						{data.bookmarks.length > 0 && (
							<section>
								<h3 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
									<Bookmark className="h-4 w-4" />
									Bookmarks ({data.bookmarks.length})
								</h3>
								<div className="space-y-2">
									{data.bookmarks.map((bm) => (
										<button
											key={bm.id}
											onClick={() => handleResultClick(bm)}
											className="w-full text-left p-4 bg-card border border-border rounded-xl hover:bg-accent hover:border-accent transition-colors"
										>
											<p className="text-sm line-clamp-2 text-foreground">
												{highlightText(bm.content || "", debouncedQuery)}
											</p>
											<div className="flex items-center gap-2 mt-2">
												<span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full capitalize">
													{bm.category}
												</span>
												{bm.note && (
													<span className="text-xs text-muted-foreground truncate">
														{bm.note}
													</span>
												)}
											</div>
										</button>
									))}
								</div>
							</section>
						)}

						{/* Sessions */}
						{data.sessions.length > 0 && (
							<section>
								<h3 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
									<History className="h-4 w-4" />
									Sessions ({data.sessions.length})
								</h3>
								<div className="space-y-2">
									{data.sessions.map((sess) => (
										<button
											key={sess.id}
											onClick={() => handleResultClick(sess)}
											className="w-full text-left p-4 bg-card border border-border rounded-xl hover:bg-accent hover:border-accent transition-colors"
										>
											<p className="font-medium text-foreground">
												{highlightText(sess.title || "Untitled", debouncedQuery)}
											</p>
											<div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
												<span>{sess.messageCount} messages</span>
												<span>•</span>
												<span>{new Date(sess.createdAt).toLocaleDateString()}</span>
											</div>
										</button>
									))}
								</div>
							</section>
						)}
					</div>
				)}
			</main>
		</div>
	);
}
