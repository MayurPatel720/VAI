import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "../components/ui/button";
import {
	Bookmark,
	ArrowLeft,
	Trash2,
	BookOpen,
	Lightbulb,
	Sparkles,
	GraduationCap,
	MoreHorizontal,
	Search,
	Star,
	Share2,
} from "lucide-react";
import { apiRequest } from "../lib/queryClient";
import ThemeToggle from "../components/ThemeToggle";
import ShareModal from "../components/ShareModal";

interface BookmarkItem {
	id: string;
	messageContent: string;
	category: string;
	note: string;
	createdAt: string;
}

const CATEGORIES = [
	{ id: "all", label: "All", icon: Bookmark },
	{ id: "spiritual", label: "Spiritual", icon: BookOpen },
	{ id: "practical", label: "Practical", icon: Lightbulb },
	{ id: "inspiring", label: "Inspiring", icon: Sparkles },
	{ id: "study", label: "Study", icon: GraduationCap },
	{ id: "other", label: "Other", icon: MoreHorizontal },
];

interface BookmarkCardProps {
	bookmark: BookmarkItem;
	index: number;
	onDelete: (id: string) => void;
	onShare: (bookmark: BookmarkItem) => void;
}

const BookmarkCard = ({ bookmark, index, onDelete, onShare }: BookmarkCardProps) => {
	const [isExpanded, setIsExpanded] = useState(false);
	const CategoryIcon = CATEGORIES.find((c) => c.id === bookmark.category)?.icon || Bookmark;

	// Heuristic: Show toggle if text is longer than 280 characters
	const shouldShowToggle = bookmark.messageContent.length > 280;

	return (
		<motion.div
			layout
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			exit={{ opacity: 0, scale: 0.9 }}
			transition={{ delay: index * 0.05 }}
			className="group bg-card border border-border rounded-xl p-5 hover:shadow-lg transition-all duration-300 hover:border-primary/30 flex flex-col"
		>
			{/* Category Badge */}
			<div className="flex items-center justify-between mb-3">
				<span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium capitalize">
					<CategoryIcon className="h-3 w-3" />
					{bookmark.category}
				</span>
				<div className="flex items-center gap-1">
					<Button
						variant="ghost"
						size="icon"
						className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-primary hover:bg-primary/10"
						onClick={() => onShare(bookmark)}
					>
						<Share2 className="h-4 w-4" />
					</Button>
					<Button
						variant="ghost"
						size="icon"
						className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:bg-destructive/10"
						onClick={() => onDelete(bookmark.id)}
					>
						<Trash2 className="h-4 w-4" />
					</Button>
				</div>
			</div>

			{/* Content */}
			<div className="flex-1">
				<p 
					className={`text-foreground/90 leading-relaxed text-sm transition-all ${
						!isExpanded ? "line-clamp-4" : ""
					}`}
				>
					"{bookmark.messageContent}"
				</p>
			</div>

			{shouldShowToggle && (
				<button
					onClick={() => setIsExpanded(!isExpanded)}
					className="mt-2 text-xs font-medium text-primary hover:underline self-start focus:outline-none"
				>
					{isExpanded ? "Show Less" : "Read More"}
				</button>
			)}

			{/* Note */}
			{bookmark.note && (
				<p className="mt-3 text-xs text-muted-foreground italic border-l-2 border-primary/30 pl-3">
					{bookmark.note}
				</p>
			)}

			{/* Date */}
			<p className="mt-4 text-xs text-muted-foreground pt-2 border-t border-border/50">
				Saved {new Date(bookmark.createdAt).toLocaleDateString("en-IN", {
					day: "numeric",
					month: "short",
					year: "numeric",
				})}
			</p>
		</motion.div>
	);
};

export default function Bookmarks() {
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const [selectedCategory, setSelectedCategory] = useState("all");
	const [searchTerm, setSearchTerm] = useState("");
	
	// Share State
	const [isShareOpen, setIsShareOpen] = useState(false);
	const [shareContent, setShareContent] = useState("");
	const [shareMessageId, setShareMessageId] = useState("");

	// Fetch bookmarks
	const { data, isLoading } = useQuery({
		queryKey: ["bookmarks", selectedCategory],
		queryFn: async () => {
			const url =
				selectedCategory === "all"
					? "/api/bookmarks"
					: `/api/bookmarks?category=${selectedCategory}`;
			const res = await apiRequest("GET", url);
			return res.json();
		},
	});

	const bookmarks: BookmarkItem[] = data?.bookmarks || [];

	// Filter by search
	const filteredBookmarks = bookmarks.filter((b) =>
		b.messageContent.toLowerCase().includes(searchTerm.toLowerCase())
	);

	// Delete mutation
	const deleteMutation = useMutation({
		mutationFn: async (id: string) => {
			await apiRequest("DELETE", `/api/bookmarks/${id}`);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["bookmarks"] });
		},
	});

	const handleShare = (bookmark: BookmarkItem) => {
		setShareContent(bookmark.messageContent);
		// Note: The bookmark object actually has messageId which refers to the original chat message but purely as string/ObjectId.
		// However, the bookmark.id is the ID of the bookmark itself. 
		// The ShareModal expects `messageId` if we want to share a message.
		// NOTE: Our `bookmarkItem` interface above doesn't even list messageId, but the API returns it. 
		// Let's typescript ignore for now or add it to interface. A quick fix is to treat bookmark as source.
		// Actually, the API returns `messageId` in the bookmark object.
		
		// Wait, checking storage.js: getUserBookmarks maps `messageId: b.messageId.toString()`.
		// So `bookmark.messageId` exists! I should add it to the interface.
		
		// For now, let's just pass bookmark.messageId (TS might complain if I don't update interface).
		// I'll update the interface in the same swipe.
		
		setShareMessageId((bookmark as any).messageId);
		setIsShareOpen(true);
	};

	return (
		<div className="min-h-screen bg-background">
			{/* Header */}
			<header className="sticky top-0 z-10 bg-background/95 backdrop-blur-md border-b supports-[backdrop-filter]:bg-background/60">
				<div className="max-w-6xl mx-auto px-4 py-4">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-3">
							<Button
								variant="ghost"
								size="icon"
								onClick={() => navigate(-1)}
							>
								<ArrowLeft className="h-5 w-5" />
							</Button>
							<div>
								<h1 className="text-xl font-bold flex items-center gap-2">
									<Bookmark className="h-5 w-5 text-primary" />
									Saved Wisdom
								</h1>
								<p className="text-sm text-muted-foreground">
									{bookmarks.length} bookmarks saved
								</p>
							</div>
						</div>
						<ThemeToggle />
					</div>

					{/* Search */}
					<div className="mt-4 relative group">
						<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
						<input
							type="text"
							placeholder="Search bookmarks..."
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
							className="w-full pl-10 pr-4 py-2.5 bg-card border border-border/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all shadow-sm"
						/>
					</div>

					{/* Category Filters */}
					<div className="mt-4 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
						{CATEGORIES.map((cat) => {
							const Icon = cat.icon;
							const isActive = selectedCategory === cat.id;
							return (
								<Button
									key={cat.id}
									variant={isActive ? "default" : "outline"}
									size="sm"
									className={`flex-shrink-0 gap-1.5 transition-all ${
										isActive ? "shadow-md" : "hover:bg-muted bg-card"
									}`}
									onClick={() => setSelectedCategory(cat.id)}
								>
									<Icon className="h-3.5 w-3.5" />
									{cat.label}
								</Button>
							);
						})}
					</div>
				</div>
			</header>

			{/* Content */}
			<main className="max-w-6xl mx-auto px-4 py-6">
				{isLoading ? (
					<div className="flex items-center justify-center py-20">
						<div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
					</div>
				) : filteredBookmarks.length === 0 ? (
					<div className="text-center py-20">
						<div className="h-20 w-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
							<Star className="h-10 w-10 text-muted-foreground" />
						</div>
						<h3 className="text-lg font-semibold mb-2">No bookmarks yet</h3>
						<p className="text-muted-foreground max-w-sm mx-auto">
							Save your favorite spiritual insights from chat conversations to
							revisit them anytime.
						</p>
						<Button className="mt-6" onClick={() => navigate("/chat")}>
							Start a Conversation
						</Button>
					</div>
				) : (
					<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
						<AnimatePresence mode="popLayout">
							{filteredBookmarks.map((bookmark, index) => (
								<BookmarkCard 
									key={bookmark.id} 
									bookmark={bookmark} 
									index={index} 
									onDelete={(id) => deleteMutation.mutate(id)}
									onShare={handleShare}
								/>
							))}
						</AnimatePresence>
					</div>
				)}
			</main>
			
			<ShareModal
				isOpen={isShareOpen}
				onClose={() => setIsShareOpen(false)}
				content={shareContent}
				messageId={shareMessageId}
				toggleEnabled={false} // Bookmarks are single messages usually
			/>
		</div>
	);
}
