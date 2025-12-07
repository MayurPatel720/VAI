import { useNavigate } from "react-router-dom";
import ThemeToggle from "./ThemeToggle";
import logoImage from "@assets/generated_images/Spiritual_lotus_book_logo_bce59c2c.png";
import { useAuth } from "../hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "../lib/queryClient";

export default function ChatHeader() {
	const navigate = useNavigate();
	const { user } = useAuth();

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

	return (
		<header className="sticky top-0 z-10 bg-background/90 backdrop-blur-md border-b h-16 flex items-center">
			<div className="max-w-7xl mx-auto px-4 w-full flex items-center justify-between">
				{/* Left: Logo + Text + Chats Left */}
				<div
					className="flex items-center gap-1 cursor-pointer"
					onClick={() => navigate("/")}
				>
					<img
						src={logoImage}
						alt="Vachanamrut Logo"
						className="w-9 h-9 rounded-md"
					/>

					<div className="flex flex-col leading-tight">
						<p className="text-xl font-semibold text-foreground">Vachanamrut</p>

						<p className="text-xs mr-2 text-muted-foreground">
							{plan} plan - {remaining} Chats Left
						</p>
					</div>
				</div>

				{/* Theme Toggle */}
				<ThemeToggle />
			</div>
		</header>
	);
}
