import { useState } from "react";
import { Menu, Sparkles, User, LogOut } from "lucide-react";
import ThemeToggle from "./ThemeToggle";
import logoImage from "@assets/generated_images/Spiritual_lotus_book_logo_bce59c2c.png";

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

import { queryClient } from "../lib/queryClient";
import { useAuth } from "../hooks/useAuth";
import { useNavigate } from "react-router-dom";

export default function LegalPolicies() {
	const [openSidebar, setOpenSidebar] = useState(false);
	const { user, isAuthenticated } = useAuth();
	const navigate = useNavigate();

	const getUserInitials = () => {
		if (!user) return "U";
		if (user.firstName && user.lastName) {
			return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
		}
		if (user.email) return user.email[0].toUpperCase();
		return "U";
	};

	const sections = [
		{ id: "contact", label: "Contact Us" },
		{ id: "terms", label: "Terms & Conditions" },
		{ id: "shipping", label: "Shipping & Delivery" },
		{ id: "refund", label: "Cancellation & Refund" },
		{ id: "privacy", label: "Privacy Policy" },
	];

	const scrollToSection = (id: string) => {
		document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
		setOpenSidebar(false);
	};

	return (
		<div className="min-h-screen bg-background text-foreground flex flex-col">
			{/* HEADER */}
			<header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b">
				<div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
					{/* Logo */}
					<div
						className="flex items-center md:gap-3 hover:cursor-pointer"
						onClick={() => navigate("/")}
					>
						<img
							src={logoImage}
							alt="Logo"
							className="w-10 h-10 object-contain"
						/>
						<h1 className="text-2xl font-bold">Vachanamrut</h1>
					</div>

					{/* Right Controls */}
					<div className="flex items-center gap-2">
						<ThemeToggle />

						{isAuthenticated && user ? (
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button variant="ghost" size="icon" className="rounded-full">
										<Avatar className="h-8 w-8">
											<AvatarImage src={user.profileImageUrl || undefined} />
											<AvatarFallback>{getUserInitials()}</AvatarFallback>
										</Avatar>
									</Button>
								</DropdownMenuTrigger>

								<DropdownMenuContent
									align="end"
									className="w-56 bg-popover border border-border shadow-xl"
								>
									<DropdownMenuLabel>
										<div className="flex flex-col space-y-1">
											<span className="text-sm font-medium">
												{user.firstName} {user.lastName}
											</span>
											<span className="text-xs text-muted-foreground">
												{user.email}
											</span>
											{user.subscription && (
												<span className="text-xs text-primary mt-1 capitalize">
													{user.subscription.plan} Plan
												</span>
											)}
										</div>
									</DropdownMenuLabel>

									<DropdownMenuSeparator />

									<DropdownMenuItem
										className="cursor-pointer"
										onClick={() => navigate("/chat")}
									>
										<Sparkles className="mr-2 h-4 w-4" />
										Go to Chat
									</DropdownMenuItem>

									<DropdownMenuItem
										className="cursor-pointer"
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
							</DropdownMenu>
						) : (
							<Button
								variant="outline"
								onClick={() => (window.location.href = "/api/login")}
							>
								<User className="mr-2 h-4 w-4" /> Login
							</Button>
						)}
					</div>
				</div>
			</header>

			{/* MAIN LAYOUT */}
			<div className="flex flex-1">
				{/* SIDEBAR */}
				<aside
					className={`fixed top-[72px] inset-y-0 left-0 w-64 bg-card border-r border-border z-30
                    transform transition-transform duration-300 ease-in-out
                    ${openSidebar ? "translate-x-0" : "-translate-x-full"}
                    md:translate-x-0`}
				>
					<div className="p-5 font-semibold text-lg border-b border-border">
						Legal Policies
					</div>

					<nav className="p-4 space-y-2">
						{sections.map((s) => (
							<button
								key={s.id}
								onClick={() => scrollToSection(s.id)}
								className="w-full text-left px-3 py-2 rounded-md hover:bg-accent hover:text-accent-foreground transition"
							>
								{s.label}
							</button>
						))}
					</nav>
				</aside>

				{/* Mobile Sidebar Button */}
				<button
					onClick={() => setOpenSidebar(true)}
					className="md:hidden fixed top-20 left-4 z-40 p-2 bg-primary text-primary-foreground rounded-md shadow-md"
				>
					<Menu className="h-5 w-5" />
				</button>

				{/* Mobile Overlay */}
				{openSidebar && (
					<div
						onClick={() => setOpenSidebar(false)}
						className="fixed inset-0 bg-black/40 backdrop-blur-sm z-20 md:hidden"
					/>
				)}

				{/* CONTENT */}
				<main className="flex-1 md:ml-64 px-6 md:px-16 py-10 max-w-4xl mx-auto space-y-16">
					{/* PAGE TITLE */}
					<h1 className="text-3xl md:text-4xl font-bold mb-10 text-center">
						Privacy Policies & Information
					</h1>

					{/* CONTACT */}
					<section id="contact" className="space-y-4">
						<h2 className="text-2xl font-semibold">Contact Us</h2>
						<p>
							Last updated on <strong>Dec 6th, 2025</strong>
						</p>

						<div className="bg-card border border-border p-4 rounded-lg space-y-2">
							<p>
								<strong>Merchant Name:</strong> MAYURKUMAR NILESHKUMAR PATEL
							</p>
							<p>
								<strong>Phone:</strong> 9726528720
							</p>
							<p>
								<strong>Email:</strong> ieitata44@gmail.com
							</p>
							<p>
								<strong>Address:</strong> Vinayak Residency, Surat, Gujarat –
								395004
							</p>
						</div>
					</section>

					{/* TERMS */}
					<section id="terms" className="space-y-4">
						<h2 className="text-2xl font-semibold">Terms & Conditions</h2>
						<p>
							Last updated on <strong>Dec 6th, 2025</strong>
						</p>

						<p>
							The terms <strong>"we", "us", "our"</strong> refer to
							<strong> MAYURKUMAR NILESHKUMAR PATEL</strong>. The terms
							<strong> "you", "your", "user"</strong> refer to anyone accessing
							our website.
						</p>

						<ul className="list-disc pl-6 space-y-2">
							<li>Website content may change without notice.</li>
							<li>
								We do not guarantee accuracy or completeness of information.
							</li>
							<li>Your use of materials is at your own risk.</li>
							<li>
								Website design, graphics, and layout are protected intellectual
								property.
							</li>
							<li>Unauthorized use may lead to legal action.</li>
							<li>External links do not imply endorsement.</li>
							<li>No links may be created without written consent.</li>
							<li>All disputes fall under Indian jurisdiction.</li>
						</ul>

						<p className="text-muted-foreground text-sm">
							Disclaimer: Razorpay is not responsible for merchant-provided
							policy content.
						</p>
					</section>

					{/* SHIPPING */}
					<section id="shipping" className="space-y-4">
						<h2 className="text-2xl font-semibold">
							Shipping & Delivery Policy
						</h2>
						<p>
							Last updated on <strong>Dec 6th, 2025</strong>
						</p>

						<ul className="list-disc pl-6 space-y-2">
							<li>
								International orders ship via registered couriers or speed post.
							</li>
							<li>
								Domestic orders ship via registered couriers or speed post.
							</li>
							<li>
								Orders ship within <strong>Not Applicable</strong> or as agreed.
							</li>
							<li>We are not responsible for courier/postal delays.</li>
							<li>Deliveries go to the provided address.</li>
							<li>Digital delivery is confirmed via email.</li>
						</ul>

						<p>
							<strong>Support:</strong> 9726528720 / ieitata44@gmail.com
						</p>

						<p className="text-muted-foreground text-sm">
							Disclaimer: Razorpay is not responsible for merchant content.
						</p>
					</section>

					{/* REFUND */}
					<section id="refund" className="space-y-4">
						<h2 className="text-2xl font-semibold">
							Cancellation & Refund Policy
						</h2>
						<p>
							Last updated on <strong>Dec 6th, 2025</strong>
						</p>

						<ul className="list-disc pl-6 space-y-2">
							<li>
								Cancellations allowed within <strong>Not Applicable</strong>{" "}
								hours.
							</li>
							<li>No cancellation if product is shipped.</li>
							<li>No cancellation for perishable items.</li>
							<li>
								Damage reports must be made within{" "}
								<strong>Not Applicable</strong>.
							</li>
							<li>
								Mismatch claims must be made within{" "}
								<strong>Not Applicable</strong>.
							</li>
							<li>Warranty items handled by manufacturer.</li>
							<li>
								Refunds processed within <strong>Not Applicable</strong>.
							</li>
						</ul>

						<p className="text-muted-foreground text-sm">
							Disclaimer: Razorpay is not responsible for merchant-provided
							content.
						</p>
					</section>

					{/* PRIVACY */}
					<section id="privacy" className="space-y-4 pb-20">
						<h2 className="text-2xl font-semibold">Privacy Policy</h2>
						<p>
							Last updated on <strong>Dec 6th, 2025</strong>
						</p>

						<p>
							We are committed to protecting your privacy. Information you
							provide is used safely and responsibly.
						</p>

						<h3 className="text-xl font-semibold">Information We Collect</h3>
						<ul className="list-disc pl-6 space-y-1">
							<li>Name</li>
							<li>Contact information including email</li>
							<li>Preferences & demographic details</li>
							<li>Survey and offer-related information</li>
						</ul>

						<h3 className="text-xl font-semibold">How We Use Information</h3>
						<ul className="list-disc pl-6 space-y-1">
							<li>Internal record keeping</li>
							<li>Improving our service</li>
							<li>Sending promotional emails</li>
							<li>Market research</li>
							<li>Website personalization</li>
						</ul>

						<h3 className="text-xl font-semibold">Cookies</h3>
						<p>Cookies help analyze traffic and improve user experience.</p>

						<h3 className="text-xl font-semibold">Data Control</h3>
						<p>You can withdraw marketing consent anytime by contacting us.</p>

						<p className="text-muted-foreground text-sm">
							Disclaimer: Razorpay is not responsible for merchant policy
							content.
						</p>
					</section>
				</main>
			</div>
		</div>
	);
}
