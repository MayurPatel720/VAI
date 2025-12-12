import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "../lib/queryClient";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Loader2, ArrowRight, Quote } from "lucide-react";
import { Button } from "../components/ui/button";

interface SharedContent {
	type: 'message' | 'conversation';
	content: string | any[];
	createdAt: string;
}

export default function SharedView() {
	const { token } = useParams();
	const navigate = useNavigate();

	const { data, isLoading, error } = useQuery<SharedContent>({
		queryKey: ["shared", token],
		queryFn: async () => {
			const res = await apiRequest("GET", `/api/share/${token}`);
			return res.json();
		},
		enabled: !!token,
	});

	if (isLoading) {
		return (
			<div className="flex items-center justify-center min-h-screen bg-background">
				<Loader2 className="h-8 w-8 animate-spin text-primary" />
			</div>
		);
	}

	if (error || !data) {
		return (
			<div className="flex flex-col items-center justify-center min-h-screen bg-background p-4 text-center">
				<h1 className="text-2xl font-bold mb-2">Content Not Found</h1>
				<p className="text-muted-foreground mb-6">
					This shared link may have expired or is invalid.
				</p>
				<Button onClick={() => navigate("/")}>Go Home</Button>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-background text-foreground flex flex-col dark">
			{/* Simple Header */}
			<header className="border-b border-border bg-card p-4">
				<div className="max-w-4xl mx-auto flex items-center justify-between">
					<h1 className="font-bold text-lg flex items-center gap-2">
						Vachanamrut AI
					</h1>
					<Button size="sm" onClick={() => navigate("/chat")}>
						Try it yourself <ArrowRight className="ml-2 h-4 w-4" />
					</Button>
				</div>
			</header>

			{/* Content */}
			<main className="flex-1 max-w-3xl mx-auto w-full p-4 md:p-8">
				{data.type === 'message' ? (
					// Single Message View
					<div className="bg-card border border-border rounded-2xl p-6 md:p-10 shadow-xl relative overflow-hidden">
						<Quote className="absolute top-6 left-6 h-12 w-12 text-primary/10" />
						<div className="relative z-10 prose prose-invert max-w-none text-lg leading-relaxed">
							<ReactMarkdown remarkPlugins={[remarkGfm]}>
								{data.content as string}
							</ReactMarkdown>
						</div>
						<div className="mt-8 pt-6 border-t border-border flex justify-end">
							<p className="text-sm text-muted-foreground italic">
								Shared via Vachanamrut AI
							</p>
						</div>
					</div>
				) : (
					// Conversation View
					<div className="space-y-6">
						<div className="text-center mb-8">
							<h2 className="text-2xl font-bold">Shared Conversation</h2>
							<p className="text-muted-foreground">
								Read this spiritual dialogue with Vachanamrut AI
							</p>
						</div>

						<div className="space-y-6">
							{(data.content as any[]).map((msg, idx) => (
								<div
									key={idx}
									className={`flex ${msg.isBot ? 'justify-start' : 'justify-end'}`}
								>
									<div
										className={`max-w-[85%] rounded-2xl px-5 py-4 ${
											msg.isBot
												? 'bg-muted text-foreground rounded-tl-none'
												: 'bg-primary text-primary-foreground rounded-tr-none'
										}`}
									>
										<div className={`prose max-w-none text-sm md:text-base ${
											msg.isBot ? 'prose-invert' : 'prose-invert'
										}`}>
											<ReactMarkdown remarkPlugins={[remarkGfm]}>
												{msg.message}
											</ReactMarkdown>
										</div>
									</div>
								</div>
							))}
						</div>
					</div>
				)}

				{/* CTA Footer */}
				<div className="mt-12 text-center bg-primary/10 rounded-2xl p-8 border border-primary/20">
					<h3 className="text-xl font-bold mb-2">Find Your Own Peace</h3>
					<p className="text-muted-foreground mb-6 max-w-md mx-auto">
						Start your own personal spiritual journey with Vachanamrut AI today.
					</p>
					<Button size="lg" className="w-full md:w-auto" onClick={() => navigate("/chat")}>
						Start Chatting Now
					</Button>
				</div>
			</main>
		</div>
	);
}
