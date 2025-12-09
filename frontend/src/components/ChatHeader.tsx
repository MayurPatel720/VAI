import { useNavigate } from "react-router-dom";
import ThemeToggle from "./ThemeToggle";
import logoImage from "@assets/generated_images/Spiritual_lotus_book_logo_bce59c2c.png";
import { useAuth } from "../hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "../lib/queryClient";
import { Button } from "./ui/button";
import { Download, Search, X } from "lucide-react";
import { useState, useRef, useEffect } from "react";

interface ChatHeaderProps {
	onSearch?: (term: string) => void;
}

export default function ChatHeader({ onSearch }: ChatHeaderProps) {
	const navigate = useNavigate();
	const { user } = useAuth();
	const [showSearch, setShowSearch] = useState(false);
	const [searchTerm, setSearchTerm] = useState("");
	const searchInputRef = useRef<HTMLInputElement>(null);

	// Fetch today's chat usage
	const { data: usage } = useQuery({
		queryKey: ["chat-usage"],
		queryFn: async () => {
			const res = await apiRequest("GET", "/api/chat/usage");
			return res.json();
		},
		enabled: !!user,
	});

	// Chat limits
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

	// Focus input when search opens
	useEffect(() => {
		if (showSearch && searchInputRef.current) {
			searchInputRef.current.focus();
		}
	}, [showSearch]);

	const handleSearch = () => {
		if (!searchTerm.trim()) return;
		
		// Clear previous highlights
		document.querySelectorAll("[data-search-highlight]").forEach((el) => {
			(el as HTMLElement).style.backgroundColor = "";
			el.removeAttribute("data-search-highlight");
		});

		const messages = document.querySelectorAll(".prose");
		let found = false;
		
		messages.forEach((el) => {
			const text = el.textContent?.toLowerCase() || "";
			if (text.includes(searchTerm.toLowerCase())) {
				if (!found) {
					el.scrollIntoView({ behavior: "smooth", block: "center" });
					found = true;
				}
				(el as HTMLElement).style.backgroundColor = "rgba(234, 179, 8, 0.25)";
				el.setAttribute("data-search-highlight", "true");
			}
		});
		
		if (onSearch) onSearch(searchTerm);
	};

	const clearSearch = () => {
		setSearchTerm("");
		setShowSearch(false);
		document.querySelectorAll("[data-search-highlight]").forEach((el) => {
			(el as HTMLElement).style.backgroundColor = "";
			el.removeAttribute("data-search-highlight");
		});
	};

	return (
		<header className="sticky top-0 z-10 bg-background/90 backdrop-blur-md border-b h-16 flex items-center">
			<div className="max-w-7xl mx-auto px-4 w-full flex items-center justify-between gap-2">
				{/* Left: Logo + Text */}
				{!showSearch && (
					<div
						className="flex items-center gap-1 cursor-pointer flex-shrink-0"
						onClick={() => navigate("/")}
					>
						<img
							src={logoImage}
							alt="Vachanamrut Logo"
							className="w-9 h-9 rounded-md"
						/>
						<div className="flex flex-col leading-tight">
							<p className="text-xl font-semibold text-foreground">Vachanamrut</p>
							<p className="text-xs text-muted-foreground">
								{plan} plan - {remaining} Chats Left
							</p>
						</div>
					</div>
				)}

				{/* Search Input - Full Width when open */}
				{showSearch && (
					<div className="flex-1 flex items-center gap-2 bg-muted/50 rounded-full px-4 py-2 border border-border animate-in fade-in duration-200">
						<Search className="h-4 w-4 text-muted-foreground flex-shrink-0" />
						<input
							ref={searchInputRef}
							type="text"
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
							onKeyDown={(e) => {
								if (e.key === "Enter") handleSearch();
								if (e.key === "Escape") clearSearch();
							}}
							placeholder="Search in chats..."
							className="bg-transparent border-none outline-none text-sm flex-1 placeholder:text-muted-foreground/60"
						/>
						<Button
							size="sm"
							className="h-7 px-3 text-xs rounded-full"
							onClick={handleSearch}
						>
							Search
						</Button>
						<button
							onClick={clearSearch}
							className="text-muted-foreground hover:text-foreground transition-colors p-1"
						>
							<X className="h-4 w-4" />
						</button>
					</div>
				)}

				{/* Right: Actions */}
				<div className="flex items-center gap-1 flex-shrink-0">
					{!showSearch && (
						<Button
							variant="ghost"
							size="icon"
							className="text-muted-foreground hover:text-foreground"
							onClick={() => setShowSearch(true)}
							title="Search chats"
						>
							<Search className="h-4 w-4" />
						</Button>
					)}

					<Button
						variant="ghost"
						size="icon"
						className="hidden md:flex text-muted-foreground hover:text-foreground"
						onClick={() => {
							const history = document.querySelectorAll(".prose");
							let text = "";
							history.forEach((el, index) => {
								const role = index % 2 === 0 ? "User" : "AI";
								text += `[${role}]: ${el.textContent}\n\n`;
							});
							const blob = new Blob([text], { type: "text/plain" });
							const url = URL.createObjectURL(blob);
							const a = document.createElement("a");
							a.href = url;
							a.download = `conversation-${new Date().toISOString()}.txt`;
							a.click();
						}}
						title="Export Conversation"
					>
						<Download className="h-4 w-4" />
					</Button>
					<ThemeToggle />
				</div>
			</div>
		</header>
	);
}
