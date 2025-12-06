import { BookOpen, Sparkles, Heart, User, LogOut } from "lucide-react";
import logoImage from "@assets/generated_images/Spiritual_lotus_book_logo_bce59c2c.png";
import meditationImagedark from "@assets/generated_images/Meditation_welcome_illustration_8b0a69d1copy.png";
import meditationImage from "@assets/generated_images/Meditation_welcome_illustration_8b0a69d1.png";
import { useAuth } from "../hooks/useAuth";
import ThemeToggle from "../components/ThemeToggle";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import { Button } from "../components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { useNavigate } from "react-router-dom";
import PricingPlan from "./PricingPlan";
import AboutVachanamrut from "./AboutVachanamrut";
import Footer from "./Footer";
import { queryClient } from "../lib/queryClient";

export default function Landing() {
	const { user, isAuthenticated } = useAuth();
	const navigate = useNavigate();

	const getUserInitials = () => {
		if (!user) return "U";
		if (user.firstName && user.lastName) {
			return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
		}
		if (user.email) {
			return user.email[0].toUpperCase();
		}
		return "U";
	};

	return (
		<div className="min-h-screen bg-background" data-testid="page-landing">
			{/* Header */}
			<header className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b">
				<div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
					<div className="flex items-center md:gap-3">
						<img
							src={logoImage}
							alt="Vachanamrut Logo"
							className="w-10 h-10 object-contain"
						/>
						<h1 className="text-2xl font-bold text-foreground">Vachanamrut</h1>
					</div>
					<div className="flex items-center gap-2">
						<ThemeToggle />
						{isAuthenticated && user ? (
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button
										variant="ghost"
										size="icon"
										className="rounded-full"
										data-testid="button-user-menu"
									>
										<Avatar className="h-8 w-8">
											<AvatarImage
												src={user.profileImageUrl || undefined}
												alt={user.firstName || "User"}
											/>
											<AvatarFallback>{getUserInitials()}</AvatarFallback>
										</Avatar>
									</Button>
								</DropdownMenuTrigger>

								{/* FIXED SECTION START */}
								<DropdownMenuContent
									align="end"
									className="w-56 z-50 bg-white dark:bg-stone-900 border border-gray-200 dark:border-gray-800 shadow-xl"
								>
									<DropdownMenuLabel>
										<div className="flex flex-col space-y-1">
											<span className="text-sm font-medium leading-none text-gray-900 dark:text-gray-100">
												{user.firstName} {user.lastName}
											</span>
											<span className="text-xs leading-none text-gray-500 dark:text-gray-400">
												{user.email}
											</span>
											{user.subscription && (
												<span className="text-xs text-primary mt-1 capitalize">
													{user.subscription.plan} Plan
												</span>
											)}
										</div>
									</DropdownMenuLabel>
									<DropdownMenuSeparator className="bg-gray-200 dark:bg-gray-700" />
									<DropdownMenuItem
										className="cursor-pointer focus:bg-gray-100 dark:focus:bg-zinc-800"
										onClick={() => navigate("/chat")}
									>
										<Sparkles className="mr-2 h-4 w-4" />
										Go to Chat
									</DropdownMenuItem>
									<DropdownMenuItem
										className="cursor-pointer focus:bg-gray-100 dark:focus:bg-zinc-800"
										onClick={() => {
											localStorage.removeItem("token");
											queryClient.clear();
											navigate("/");
											window.location.reload();
										}}
									>
										<LogOut className="mr-2 h-4 w-4" />
										Logout
									</DropdownMenuItem>
								</DropdownMenuContent>
								{/* FIXED SECTION END */}
							</DropdownMenu>
						) : (
							<Button
								variant="outline"
								onClick={() => (window.location.href = "/api/login")}
								data-testid="button-login"
							>
								<User className="mr-2 h-4 w-4" />
								Login
							</Button>
						)}
					</div>
				</div>
			</header>

			{/* Hero Section */}
			<section className="pt-16 pb-16 md:pb-16 md:pt-24 px-4">
				<div className="max-w-6xl mx-auto">
					<div className="grid md:grid-cols-2 gap-12 items-center">
						<div className="space-y-6">
							<div className="inline-block px-4 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
								AI-Powered Spiritual Guidance
							</div>

							<h2 className="text-4xl md:text-5xl font-sans font-bold text-foreground leading-tight">
								Discover Divine Wisdom from Vachanamrut
							</h2>

							<p className="text-lg text-muted-foreground leading-relaxed">
								Connect with sacred teachings through AI-powered conversations.
								Receive personalized spiritual guidance rooted in the timeless
								wisdom of Vachanamrut, available in both Gujarati and English.
							</p>

							<div className="flex flex-wrap gap-4 pt-4">
								<Button
									size="lg"
									onClick={() => navigate("/chat")}
									className="text-base"
									data-testid="button-enter-chatbot"
								>
									<Sparkles className="mr-2 h-5 w-5" />
									Start Spiritual Journey
								</Button>
								<Button
									size="lg"
									variant="outline"
									onClick={() => {
										document
											.getElementById("pricing")
											?.scrollIntoView({ behavior: "smooth" });
									}}
									className="text-base"
									data-testid="button-view-pricing"
								>
									View Pricing
								</Button>
							</div>

							<div className="grid grid-cols-3 gap-6 pt-8">
								<div className="text-center">
									<BookOpen className="h-8 w-8 text-primary mx-auto mb-2" />
									<p className="text-sm font-medium text-foreground">
										Sacred Texts
									</p>
									<p className="text-xs text-muted-foreground">
										Authentic teachings
									</p>
								</div>
								<div className="text-center">
									<Sparkles className="h-8 w-8 text-primary mx-auto mb-2" />
									<p className="text-sm font-medium text-foreground">
										AI-Powered
									</p>
									<p className="text-xs text-muted-foreground">
										Smart guidance
									</p>
								</div>
								<div className="text-center">
									<Heart className="h-8 w-8 text-primary mx-auto mb-2" />
									<p className="text-sm font-medium text-foreground">
										Bilingual
									</p>
									<p className="text-xs text-muted-foreground">
										ગુજરાતી & English
									</p>
								</div>
							</div>
						</div>

						<div className="flex justify-center relative">
							<div className="absolute -z-10 w-72 h-72 rounded-full" />
							<div className="absolute w-[380px] h-[380px] rounded-full bg-amber-500/20 blur-3xl opacity-80 animate-pulse" />

							{/* Floating Sparkles */}
							<div className="absolute inset-0 pointer-events-none overflow-visible">
								<div className="absolute top-10 left-1/3 w-2 h-2 bg-amber-300 rounded-full blur-sm animate-bounce" />
								<div className="absolute top-20 right-1/4 w-1.5 h-1.5 bg-yellow-200 rounded-full blur-[2px] animate-ping" />
								<div className="absolute bottom-16 left-1/4 w-2 h-2 bg-orange-300 rounded-full blur-sm animate-ping" />
								<div className="absolute bottom-8 right-16 w-1.5 h-1.5 bg-amber-300 rounded-full blur-[2px] animate-bounce" />
							</div>
							<img
								src={meditationImage}
								alt="Spiritual Meditation"
								className="w-full max-w-md rounded-lg block dark:hidden opacity-90 mix-blend-multiply"
							/>

							<img
								src={meditationImagedark}
								alt="Spiritual Meditation Dark"
								className="w-full max-w-md rounded-lg hidden dark:block"
							/>
						</div>
					</div>
				</div>
			</section>
			<div className="relative w-3/4 mx-auto my-8 h-1 overflow-hidden rounded-full bg-orange-200">
				<div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-orange-400 to-transparent animate-pulse"></div>
			</div>
			<section id="about">
				<AboutVachanamrut />
			</section>
			<div className="relative w-3/4 mx-auto my-8 h-1 overflow-hidden rounded-full bg-orange-200">
				<div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-orange-400 to-transparent animate-pulse"></div>
			</div>

			<section id="pricing">
				<PricingPlan />
			</section>

			{/* Footer */}
			<Footer />
		</div>
	);
}
