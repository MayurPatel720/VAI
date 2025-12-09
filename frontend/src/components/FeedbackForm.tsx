import { useState } from "react";
import { Button } from "./ui/button";
import { Star, Send, Check } from "lucide-react";
import { useMutation } from "@tanstack/react-query";

export default function FeedbackForm() {
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [message, setMessage] = useState("");
	const [rating, setRating] = useState(5);
	const [submitted, setSubmitted] = useState(false);

	const submitMutation = useMutation({
		mutationFn: async () => {
			const res = await fetch("/api/feedback", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ name, email, message, rating }),
			});
			if (!res.ok) throw new Error("Failed to submit");
			return res.json();
		},
		onSuccess: () => {
			setSubmitted(true);
			setName("");
			setEmail("");
			setMessage("");
			setRating(5);
		},
	});

	if (submitted) {
		return (
			<div className="bg-card border border-border rounded-2xl p-8 text-center">
				<div className="h-16 w-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
					<Check className="h-8 w-8 text-green-500" />
				</div>
				<h3 className="text-xl font-bold mb-2">Thank You!</h3>
				<p className="text-muted-foreground mb-6">
					Your feedback has been submitted successfully.
				</p>
				<Button variant="outline" onClick={() => setSubmitted(false)}>
					Send Another
				</Button>
			</div>
		);
	}

	return (
		<div className="bg-card border border-border rounded-2xl p-6 md:p-8">
			<h3 className="text-xl font-bold mb-2">Share Your Feedback</h3>
			<p className="text-muted-foreground mb-6">
				Help us improve your spiritual journey experience
			</p>

			<form
				onSubmit={(e) => {
					e.preventDefault();
					submitMutation.mutate();
				}}
				className="space-y-4"
			>
				{/* Rating */}
				<div>
					<label className="block text-sm font-medium mb-2">Your Rating</label>
					<div className="flex items-center gap-1">
						{[1, 2, 3, 4, 5].map((star) => (
							<button
								key={star}
								type="button"
								onClick={() => setRating(star)}
								className="p-1 transition-transform hover:scale-110"
							>
								<Star
									className={`h-6 w-6 transition-colors ${
										star <= rating
											? "text-yellow-500 fill-yellow-500"
											: "text-muted-foreground"
									}`}
								/>
							</button>
						))}
					</div>
				</div>

				{/* Name */}
				<div>
					<label className="block text-sm font-medium mb-2">Name</label>
					<input
						type="text"
						value={name}
						onChange={(e) => setName(e.target.value)}
						placeholder="Your name"
						required
						className="w-full px-4 py-3 bg-muted/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
					/>
				</div>

				{/* Email */}
				<div>
					<label className="block text-sm font-medium mb-2">Email</label>
					<input
						type="email"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						placeholder="your@email.com"
						required
						className="w-full px-4 py-3 bg-muted/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
					/>
				</div>

				{/* Message */}
				<div>
					<label className="block text-sm font-medium mb-2">Your Feedback</label>
					<textarea
						value={message}
						onChange={(e) => setMessage(e.target.value)}
						placeholder="Tell us what you think..."
						required
						rows={4}
						className="w-full px-4 py-3 bg-muted/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
					/>
				</div>

				<Button
					type="submit"
					className="w-full"
					disabled={submitMutation.isPending}
				>
					{submitMutation.isPending ? (
						"Submitting..."
					) : (
						<>
							<Send className="h-4 w-4 mr-2" />
							Submit Feedback
						</>
					)}
				</Button>
			</form>
		</div>
	);
}
