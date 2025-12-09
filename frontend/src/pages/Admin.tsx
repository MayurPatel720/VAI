import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "../components/ui/button";
import { Star, Trash2, ArrowLeft, Lock, Shield } from "lucide-react";

export default function Admin() {
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const [pin, setPin] = useState("");
	const [isAuthenticated, setIsAuthenticated] = useState(false);
	const [error, setError] = useState("");

	// Verify PIN
	const verifyMutation = useMutation({
		mutationFn: async (pin: string) => {
			const res = await fetch("/api/admin/verify", {
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

	// Fetch feedback
	const { data: feedback = [], isLoading } = useQuery({
		queryKey: ["admin-feedback"],
		queryFn: async () => {
			const res = await fetch("/api/admin/feedback", {
				headers: { "x-admin-pin": pin },
			});
			if (!res.ok) throw new Error("Failed to fetch feedback");
			return res.json();
		},
		enabled: isAuthenticated,
	});

	// Delete feedback
	const deleteMutation = useMutation({
		mutationFn: async (id: string) => {
			const res = await fetch(`/api/admin/feedback/${id}`, {
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

			{/* Content */}
			<main className="max-w-6xl mx-auto px-4 py-8">
				<div className="mb-6">
					<h2 className="text-2xl font-bold mb-2">User Feedback</h2>
					<p className="text-muted-foreground">
						{feedback.length} feedback submissions
					</p>
				</div>

				{isLoading ? (
					<div className="text-center py-12">
						<p className="text-muted-foreground">Loading feedback...</p>
					</div>
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
			</main>
		</div>
	);
}
