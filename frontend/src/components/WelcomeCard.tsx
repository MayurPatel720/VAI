import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { BookOpen, Heart, Lightbulb, Users } from "lucide-react";
import welcomeImage from "@assets/generated_images/Meditation_welcome_illustration_8b0a69d1.png";

interface WelcomeCardProps {
	onPromptClick: (prompt: string) => void;
}

const samplePrompts = [
	{ icon: BookOpen, text: "Tell me about the essence of Vachanamrut" },
	{ icon: Heart, text: "How can I develop true devotion to God?" },
	{ icon: Lightbulb, text: "What is the path to spiritual enlightenment?" },
	{ icon: Users, text: "Explain the importance of satsang" },
];

export default function WelcomeCard({ onPromptClick }: WelcomeCardProps) {
	return (
		<Card
			className="
				w-full p-6 sm:p-8 
				border-t-4 border-t-primary 
				shadow-lg rounded-2xl 
				bg-white/90 dark:bg-zinc-900/90 
				backdrop-blur-md transition-all duration-300
			"
			data-testid="card-welcome"
		>
			<div className="flex flex-col items-center text-center space-y-6">
				<img
					src={welcomeImage}
					alt="Meditation"
					className="
						w-24 h-24 sm:w-32 sm:h-32 
						object-contain opacity-95 mix-blend-multiply 
						dark:mix-blend-lighten dark:opacity-90 rounded-xl
					"
				/>

				<div className="space-y-2 px-2">
					<h2
						className="
							text-xl sm:text-2xl font-bold leading-snug 
							text-foreground dark:text-gray-100
						"
					>
						Welcome to Vachanamrut Spiritual Guidance
					</h2>
					<p
						className="
							text-sm sm:text-base max-w-lg mx-auto leading-relaxed 
							text-muted-foreground dark:text-gray-400
						"
					>
						Connect with the divine wisdom of Vachanamrut — a sacred scripture
						that reveals timeless truths about devotion, detachment, and
						self-realization. Ask, reflect, and walk the path toward inner
						enlightenment and divine love.
					</p>
				</div>

				<div className="w-full max-w-md sm:max-w-3xl">
					<p
						className="
							text-xs sm:text-sm font-medium mb-3 sm:mb-4 
							text-muted-foreground dark:text-gray-400
						"
					>
						Try asking about:
					</p>
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
						{samplePrompts.map((prompt, index) => {
							const Icon = prompt.icon;
							return (
								<Button
									key={index}
									variant="outline"
									className="
										h-auto py-3 px-4 
										justify-start text-left whitespace-normal break-words 
										flex items-start gap-3 rounded-xl border
										border-gray-200 dark:border-gray-700
										hover:border-primary/70 hover:bg-primary/5 
										dark:hover:bg-primary/10 
										transition-all duration-200
									"
									onClick={() => onPromptClick(prompt.text)}
									data-testid={`button-prompt-${index}`}
								>
									<Icon
										className="
											h-4 w-4 sm:h-5 sm:w-5 mt-1 flex-shrink-0 
											text-primary dark:text-orange-400
										"
									/>
									<span
										className="
											text-sm sm:text-base leading-snug 
											text-foreground dark:text-gray-100
										"
									>
										{prompt.text}
									</span>
								</Button>
							);
						})}
					</div>
				</div>
			</div>
		</Card>
	);
}
