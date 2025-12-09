import { useState } from "react";
import { Button } from "./ui/button";
import { Star, Send } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "../hooks/use-toast";
import { baseURL } from "../lib/queryClient";

export default function FeedbackForm() {
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [message, setMessage] = useState("");
	const [rating, setRating] = useState(5);
	const { toast } = useToast();

	const submitMutation = useMutation({
		mutationFn: async () => {
			const res = await fetch(`${baseURL}/api/feedback`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ name, email, message, rating }),
			});
			if (!res.ok) throw new Error("Failed to submit");
			return res.json();
		},
		onSuccess: () => {
			toast({
				title: "✨ Feedback Received!",
				description: "Thank you for your valuable feedback. We'll review it soon.",
			});
			setName("");
			setEmail("");
			setMessage("");
			setRating(5);
		},
		onError: () => {
			toast({
				title: "Error",
				description: "Failed to submit feedback. Please try again.",
				variant: "destructive",
			});
		},
	});

	return (
		<div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-xl">
			<div className="text-center mb-8">
				<h3 className="text-2xl font-bold mb-2 bg-gradient-to-r from-orange-600 to-orange-400 bg-clip-text text-transparent">
					Share Your Feedback
				</h3>
				<p className="text-muted-foreground text-sm">
					Help us improve your spiritual journey experience
				</p>
			</div>

			<form
				onSubmit={(e) => {
					e.preventDefault();
					submitMutation.mutate();
				}}
				className="space-y-5"
			>
				{/* Rating */}
				<div>
					<label className="block text-sm font-semibold mb-3">
						How would you rate your experience?
					</label>
					<div className="flex items-center justify-center gap-2 p-4 bg-muted/30 rounded-xl">
						{[1, 2, 3, 4, 5].map((star) => (
							<button
								key={star}
								type="button"
								onClick={() => setRating(star)}
								className="p-1 transition-all hover:scale-125 active:scale-95"
							>
								<Star
									className={`h-8 w-8 transition-all ${
										star <= rating
											? "text-yellow-500 fill-yellow-500 drop-shadow-lg"
											: "text-muted-foreground/30 hover:text-muted-foreground/60"
									}`}
								/>
							</button>
						))}
					</div>
				</div>

				{/* Name & Email Row */}
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div>
						<label className="block text-sm font-medium mb-2">
							Name <span className="text-destructive">*</span>
						</label>
						<input
							type="text"
							value={name}
							onChange={(e) => setName(e.target.value)}
							placeholder="John Doe"
							required
							className="w-full px-4 py-3 bg-background border-2 border-border rounded-xl 
								focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20
								transition-all placeholder:text-muted-foreground/50"
						/>
					</div>

					<div>
						<label className="block text-sm font-medium mb-2">
							Email <span className="text-destructive">*</span>
						</label>
						<input
							type="email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							placeholder="john@example.com"
							required
							className="w-full px-4 py-3 bg-background border-2 border-border rounded-xl 
								focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20
								transition-all placeholder:text-muted-foreground/50"
						/>
					</div>
				</div>

				{/* Message */}
				<div>
					<label className="block text-sm font-medium mb-2">
						Your Feedback <span className="text-destructive">*</span>
					</label>
					<textarea
						value={message}
						onChange={(e) => setMessage(e.target.value)}
						placeholder="Share your thoughts, suggestions, or any issues you encountered..."
						required
						rows={5}
						className="w-full px-4 py-3 bg-background border-2 border-border rounded-xl 
							focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20
							transition-all resize-none placeholder:text-muted-foreground/50"
					/>
				</div>

				<Button
					type="submit"
					className="w-full h-12 text-base font-semibold"
					disabled={submitMutation.isPending}
				>
					{submitMutation.isPending ? (
						<span className="flex items-center gap-2">
							<span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
							Submitting...
						</span>
					) : (
						<span className="flex items-center gap-2">
							<Send className="h-4 w-4" />
							Submit Feedback
						</span>
					)}
				</Button>
			</form>
		</div>
	);
}
