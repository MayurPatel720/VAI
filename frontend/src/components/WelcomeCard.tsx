import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { BookOpen, Heart, Lightbulb, Users } from "lucide-react";
import welcomeImage from "@assets/generated_images/Meditation_welcome_illustration_8b0a69d1.png";

interface WelcomeCardProps {
	onPromptClick: (prompt: string) => void;
}

const samplePrompts = [
	{
		icon: BookOpen,
		text: "Tell me about the essence of Vachanamrut",
	},
	{
		icon: Heart,
		text: "How can I develop true devotion to God?",
	},
	{
		icon: Lightbulb,
		text: "What is the path to spiritual enlightenment?",
	},
	{
		icon: Users,
		text: "Explain the importance of satsang",
	},
];

export default function WelcomeCard({ onPromptClick }: WelcomeCardProps) {
	return (
		<Card
			className="w-full p-8 border-t-4 border-t-primary"
			data-testid="card-welcome"
		>
			<div className="flex flex-col items-center text-center space-y-6">
				<img
					src={welcomeImage}
					alt="Meditation"
					className="w-32 h-32 object-contain opacity-90"
				/>

				<div className="space-y-2">
					<h2 className="text-2xl font-serif font-semibold text-foreground">
						Welcome to Vachanamrut Spiritual Guidance
					</h2>
					<p className="text-base text-muted-foreground max-w-2xl">
						Connect with the divine wisdom of Vachanamrut. Ask questions about
						devotion, dharma, spiritual practices, and the path to liberation.
						Let these sacred teachings illuminate your spiritual journey.
					</p>
				</div>

				<div className="w-full max-w-3xl">
					<p className="text-sm text-muted-foreground mb-4">
						Try asking about:
					</p>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
						{samplePrompts.map((prompt, index) => {
							const Icon = prompt.icon;
							return (
								<Button
									key={index}
									variant="outline"
									className="h-auto py-3 px-4 justify-start text-left hover-elevate active-elevate-2"
									onClick={() => onPromptClick(prompt.text)}
									data-testid={`button-prompt-${index}`}
								>
									<Icon className="h-4 w-4 mr-3 flex-shrink-0 text-primary" />
									<span className="text-sm">{prompt.text}</span>
								</Button>
							);
						})}
					</div>
				</div>
			</div>
		</Card>
	);
}
