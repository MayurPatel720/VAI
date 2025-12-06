import { useNavigate } from "react-router-dom";
import ThemeToggle from "./ThemeToggle";
import logoImage from "@assets/generated_images/Spiritual_lotus_book_logo_bce59c2c.png";

export default function ChatHeader() {
	const navigate = useNavigate();
	return (
		<header
			className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b h-20"
			data-testid="header-main"
		>
			<div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between">
				<div
					className="flex items-center  md:gap-3  hover:cursor-pointer"
					onClick={() => navigate("/")}
				>
					<img
						src={logoImage}
						alt="Vachanamrut Logo"
						className="w-10 h-10 object-contain"
					/>
					<div className="flex flex-col">
						<h1 className="text-md md:text-3xl  font-bold text-foreground">
							Vachanamrut
						</h1>
						<p className="text-xs text-muted-foreground hidden sm:block ml-1">
							Spiritual Wisdom & Guidance
						</p>
					</div>
				</div>
				<ThemeToggle />
			</div>
		</header>
	);
}
