import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "../components/ui/button";
import { 
	Star, Trash2, ArrowLeft, Lock, Shield, Users, BarChart3, 
	MessageSquare, Crown, TrendingUp, Calendar 
} from "lucide-react";
import { baseURL } from "../lib/queryClient";

interface Analytics {
	totalUsers: number;
	newUsersToday: number;
	totalMessages: number;
	messagesToday: number;
	totalSessions: number;
	activeSubscriptions: number;
	planBreakdown: {
		silver: number;
		gold: number;
		premium: number;
	};
	freeUsers: number;
}

interface UserData {
	id: string;
	email: string;
	firstName: string;
	lastName: string;
	createdAt: string;
}

export default function Admin() {
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const [pin, setPin] = useState("");
	const [isAuthenticated, setIsAuthenticated] = useState(false);
	const [error, setError] = useState("");
	const [activeTab, setActiveTab] = useState<"dashboard" | "users" | "feedback">("dashboard");
	const [userSearch, setUserSearch] = useState("");

	// Verify PIN
	const verifyMutation = useMutation({
		mutationFn: async (pin: string) => {
			const res = await fetch(`${baseURL}/api/admin/verify`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ pin }),
			});
			if (!res.ok) throw new Error("Invalid PIN");
			return res.json();
		},
		onSuccess: () => {
			setIsAuthenticated(true);
			setError("");
		},
		onError: () => {
			setError("Invalid PIN. Please try again.");
		},
	});

	// Fetch analytics
	const { data: analytics, isLoading: analyticsLoading } = useQuery<Analytics>({
		queryKey: ["admin-analytics"],
		queryFn: async () => {
			const res = await fetch(`${baseURL}/api/admin/analytics`, {
				headers: { "x-admin-pin": pin },
			});
			if (!res.ok) throw new Error("Failed to fetch analytics");
			return res.json();
		},
		enabled: isAuthenticated,
	});

	// Fetch users
	const { data: usersData, isLoading: usersLoading } = useQuery<{ users: UserData[]; pagination: any }>({
		queryKey: ["admin-users", userSearch],
		queryFn: async () => {
			const url = userSearch 
				? `${baseURL}/api/admin/users?search=${encodeURIComponent(userSearch)}`
				: `${baseURL}/api/admin/users`;
			const res = await fetch(url, {
				headers: { "x-admin-pin": pin },
			});
			if (!res.ok) throw new Error("Failed to fetch users");
			return res.json();
		},
		enabled: isAuthenticated && activeTab === "users",
	});

	// Fetch feedback
	const { data: feedback = [], isLoading: feedbackLoading } = useQuery({
		queryKey: ["admin-feedback"],
		queryFn: async () => {
			const res = await fetch(`${baseURL}/api/admin/feedback`, {
				headers: { "x-admin-pin": pin },
			});
			if (!res.ok) throw new Error("Failed to fetch feedback");
			return res.json();
		},
		enabled: isAuthenticated && activeTab === "feedback",
	});

	// Delete feedback
	const deleteMutation = useMutation({
		mutationFn: async (id: string) => {
			const res = await fetch(`${baseURL}/api/admin/feedback/${id}`, {
				method: "DELETE",
				headers: { "x-admin-pin": pin },
			});
			if (!res.ok) throw new Error("Failed to delete");
			return res.json();
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["admin-feedback"] });
		},
	});

	const handlePinSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		verifyMutation.mutate(pin);
	};

	// PIN Entry Screen
	if (!isAuthenticated) {
		return (
			<div className="min-h-screen bg-background flex items-center justify-center p-4">
				<div className="w-full max-w-sm">
					<div className="bg-card border border-border rounded-2xl p-8 shadow-xl">
						<div className="flex justify-center mb-6">
							<div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center">
								<Shield className="h-8 w-8 text-primary" />
							</div>
						</div>
						<h1 className="text-2xl font-bold text-center mb-2">Admin Panel</h1>
						<p className="text-muted-foreground text-center mb-6">
							Enter your PIN to access
						</p>

						<form onSubmit={handlePinSubmit} className="space-y-4">
							<div className="relative">
								<Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
								<input
									type="password"
									value={pin}
									onChange={(e) => setPin(e.target.value)}
									placeholder="Enter PIN"
									className="w-full pl-10 pr-4 py-3 bg-muted/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-center text-lg tracking-widest"
									maxLength={4}
								/>
							</div>
							{error && (
								<p className="text-destructive text-sm text-center">{error}</p>
							)}
							<Button
								type="submit"
								className="w-full"
								disabled={verifyMutation.isPending || pin.length < 4}
							>
								{verifyMutation.isPending ? "Verifying..." : "Access Admin"}
							</Button>
						</form>

						<Button
							variant="ghost"
							className="w-full mt-4"
							onClick={() => navigate("/")}
						>
							<ArrowLeft className="h-4 w-4 mr-2" />
							Back to Home
						</Button>
					</div>
				</div>
			</div>
		);
	}

	// Admin Dashboard
	return (
		<div className="min-h-screen bg-background">
			{/* Header */}
			<header className="sticky top-0 z-10 bg-background/90 backdrop-blur-md border-b">
				<div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
					<div className="flex items-center gap-3">
						<Shield className="h-6 w-6 text-primary" />
						<h1 className="text-xl font-bold">Admin Panel</h1>
					</div>
					<Button variant="outline" onClick={() => navigate("/")}>
						<ArrowLeft className="h-4 w-4 mr-2" />
						Exit
					</Button>
				</div>
			</header>

			{/* Tabs */}
			<div className="border-b">
				<div className="max-w-6xl mx-auto px-4">
					<div className="flex gap-1">
						{[
							{ key: "dashboard", label: "Dashboard", icon: BarChart3 },
							{ key: "users", label: "Users", icon: Users },
							{ key: "feedback", label: "Feedback", icon: MessageSquare },
						].map(({ key, label, icon: Icon }) => (
							<button
								key={key}
								onClick={() => setActiveTab(key as typeof activeTab)}
								className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
									activeTab === key
										? "border-primary text-primary font-medium"
										: "border-transparent text-muted-foreground hover:text-foreground"
								}`}
							>
								<Icon className="h-4 w-4" />
								{label}
							</button>
						))}
					</div>
				</div>
			</div>

			{/* Content */}
			<main className="max-w-6xl mx-auto px-4 py-8">
				{/* Dashboard Tab */}
				{activeTab === "dashboard" && (
					<div className="space-y-6">
						{analyticsLoading ? (
							<p className="text-center text-muted-foreground py-12">Loading analytics...</p>
						) : analytics ? (
							<>
								{/* KPI Cards */}
								<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
									<div className="bg-card border rounded-xl p-4">
										<div className="flex items-center gap-2 text-muted-foreground mb-1">
											<Users className="h-4 w-4" />
											<span className="text-sm">Total Users</span>
										</div>
										<div className="text-2xl font-bold">{analytics.totalUsers}</div>
										<div className="text-xs text-green-600">+{analytics.newUsersToday} today</div>
									</div>
									<div className="bg-card border rounded-xl p-4">
										<div className="flex items-center gap-2 text-muted-foreground mb-1">
											<MessageSquare className="h-4 w-4" />
											<span className="text-sm">Total Messages</span>
										</div>
										<div className="text-2xl font-bold">{analytics.totalMessages}</div>
										<div className="text-xs text-green-600">+{analytics.messagesToday} today</div>
									</div>
									<div className="bg-card border rounded-xl p-4">
										<div className="flex items-center gap-2 text-muted-foreground mb-1">
											<TrendingUp className="h-4 w-4" />
											<span className="text-sm">Sessions</span>
										</div>
										<div className="text-2xl font-bold">{analytics.totalSessions}</div>
									</div>
									<div className="bg-card border rounded-xl p-4">
										<div className="flex items-center gap-2 text-muted-foreground mb-1">
											<Crown className="h-4 w-4" />
											<span className="text-sm">Paid Users</span>
										</div>
										<div className="text-2xl font-bold">{analytics.activeSubscriptions}</div>
									</div>
								</div>

								{/* Plan Breakdown */}
								<div className="bg-card border rounded-xl p-6">
									<h3 className="font-semibold mb-4">Plan Distribution</h3>
									<div className="grid grid-cols-4 gap-4">
										<div className="text-center p-4 bg-muted/30 rounded-lg">
											<div className="text-2xl font-bold">{analytics.freeUsers}</div>
											<div className="text-sm text-muted-foreground">Free</div>
										</div>
										<div className="text-center p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
											<div className="text-2xl font-bold">{analytics.planBreakdown.silver}</div>
											<div className="text-sm text-gray-600">Silver</div>
										</div>
										<div className="text-center p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
											<div className="text-2xl font-bold text-amber-600">{analytics.planBreakdown.gold}</div>
											<div className="text-sm text-amber-600">Gold</div>
										</div>
										<div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
											<div className="text-2xl font-bold text-purple-600">{analytics.planBreakdown.premium}</div>
											<div className="text-sm text-purple-600">Premium</div>
										</div>
									</div>
								</div>
							</>
						) : null}
					</div>
				)}

				{/* Users Tab */}
				{activeTab === "users" && (
					<div className="space-y-4">
						<div className="flex items-center gap-4">
							<input
								type="text"
								value={userSearch}
								onChange={(e) => setUserSearch(e.target.value)}
								placeholder="Search users by name or email..."
								className="flex-1 px-4 py-2 bg-muted/50 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
							/>
						</div>

						{usersLoading ? (
							<p className="text-center text-muted-foreground py-12">Loading users...</p>
						) : usersData?.users?.length === 0 ? (
							<p className="text-center text-muted-foreground py-12">No users found</p>
						) : (
							<div className="bg-card border rounded-xl overflow-hidden">
								<table className="w-full">
									<thead className="bg-muted/50">
										<tr>
											<th className="text-left px-4 py-3 text-sm font-medium">User</th>
											<th className="text-left px-4 py-3 text-sm font-medium">Email</th>
											<th className="text-left px-4 py-3 text-sm font-medium">Joined</th>
										</tr>
									</thead>
									<tbody>
										{usersData?.users?.map((user) => (
											<tr key={user.id} className="border-t hover:bg-muted/30">
												<td className="px-4 py-3">
													<div className="flex items-center gap-2">
														<div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
															{user.firstName[0]}{user.lastName[0]}
														</div>
														<span className="font-medium">{user.firstName} {user.lastName}</span>
													</div>
												</td>
												<td className="px-4 py-3 text-muted-foreground">{user.email}</td>
												<td className="px-4 py-3 text-muted-foreground">
													<div className="flex items-center gap-1">
														<Calendar className="h-3 w-3" />
														{new Date(user.createdAt).toLocaleDateString()}
													</div>
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						)}
					</div>
				)}

				{/* Feedback Tab */}
				{activeTab === "feedback" && (
					<div className="space-y-4">
						<div className="mb-6">
							<h2 className="text-2xl font-bold mb-2">User Feedback</h2>
							<p className="text-muted-foreground">
								{feedback.length} feedback submissions
							</p>
						</div>

						{feedbackLoading ? (
							<p className="text-center text-muted-foreground py-12">Loading feedback...</p>
						) : feedback.length === 0 ? (
							<div className="text-center py-12 bg-card rounded-xl border">
								<p className="text-muted-foreground">No feedback yet</p>
							</div>
						) : (
							<div className="grid gap-4">
								{feedback.map((item: any) => (
									<div
										key={item.id}
										className="bg-card border border-border rounded-xl p-6 hover:shadow-md transition-shadow"
									>
										<div className="flex items-start justify-between gap-4">
											<div className="flex-1">
												<div className="flex items-center gap-3 mb-2">
													<h3 className="font-semibold">{item.name}</h3>
													<span className="text-sm text-muted-foreground">
														{item.email}
													</span>
												</div>
												<div className="flex items-center gap-1 mb-3">
													{Array.from({ length: 5 }).map((_, i) => (
														<Star
															key={i}
															className={`h-4 w-4 ${
																i < item.rating
																	? "text-yellow-500 fill-yellow-500"
																	: "text-muted-foreground"
															}`}
														/>
													))}
												</div>
												<p className="text-foreground/80">{item.message}</p>
												<p className="text-xs text-muted-foreground mt-3">
													{new Date(item.createdAt).toLocaleString()}
												</p>
											</div>
											<Button
												variant="ghost"
												size="icon"
												className="text-destructive hover:bg-destructive/10"
												onClick={() => deleteMutation.mutate(item.id)}
											>
												<Trash2 className="h-4 w-4" />
											</Button>
										</div>
									</div>
								))}
							</div>
						)}
					</div>
				)}
			</main>
		</div>
	);
}
