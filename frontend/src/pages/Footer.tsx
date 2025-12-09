import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import FeedbackForm from "../components/FeedbackForm";

const Footer = () => {
	const navigate = useNavigate();
	const [showFeedback, setShowFeedback] = useState(false);

	return (
		<motion.footer
			initial={{ opacity: 0, y: 40 }}
			whileInView={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.8, ease: "easeOut" }}
			className="relative mt-10 border-t py-10 
				bg-gradient-to-br from-orange-50 via-white to-orange-100 
				dark:from-[#0b0b0b] dark:via-[#111] dark:to-[#0c0c0c]
				border-orange-200 dark:border-[#1f1f1f]
				text-center transition-colors duration-500"
		>
			{/* Glowing Line */}
			<div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-orange-500 to-transparent animate-pulse opacity-60"></div>

			{/* Feedback Form Modal */}
			{showFeedback && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
					<div className="max-w-md w-full relative">
						<button
							onClick={() => setShowFeedback(false)}
							className="absolute -top-3 -right-3 bg-background border border-border rounded-full h-8 w-8 flex items-center justify-center shadow-lg hover:bg-muted transition-colors z-10"
						>
							×
						</button>
						<FeedbackForm />
					</div>
				</div>
			)}

			{/* Logo / Title */}
			<h2 className="text-2xl font-bold mb-3 text-orange-600 dark:text-orange-400 tracking-wide">
				Vachanamrut.ai
			</h2>

			<p className="text-sm max-w-lg mx-auto px-6 text-orange-800 dark:text-gray-300">
				Discover the eternal wisdom of Bhagwan Swaminarayan through interactive
				AI conversations and insightful reflections from the sacred text —
				Vachanamrut.
			</p>

			{/* Divider */}
			<div className="flex items-center justify-center my-8">
				<div className="h-[2px] flex-1 max-w-[100px] bg-gradient-to-r from-transparent via-orange-500 to-transparent opacity-60"></div>
				<div className="h-[2px] flex-1 max-w-[100px] bg-gradient-to-r from-transparent via-orange-500 to-transparent opacity-60"></div>
			</div>

			{/* Links */}
			<div className="flex flex-wrap justify-center gap-6 text-sm mb-4">
				<a
					href="#about"
					className="text-orange-700 dark:text-gray-400 hover:text-orange-500 dark:hover:text-orange-400 transition"
				>
					About
				</a>
				<a
					href="#pricing"
					className="text-orange-700 dark:text-gray-400 hover:text-orange-500 dark:hover:text-orange-400 transition"
				>
					Pricing
				</a>
				<a
					onClick={() => navigate("/chat")}
					className="text-orange-700 dark:text-gray-400 hover:text-orange-500 dark:hover:text-orange-400 cursor-pointer transition"
				>
					Chat
				</a>
				<a
					onClick={() => setShowFeedback(true)}
					className="text-orange-700 dark:text-gray-400 hover:text-orange-500 dark:hover:text-orange-400 cursor-pointer transition"
				>
					Feedback
				</a>
				<a
					onClick={() => navigate("/legal")}
					className="text-orange-700 dark:text-gray-400 hover:text-orange-500 dark:hover:text-orange-400 cursor-pointer transition"
				>
					Privacy Policy
				</a>
			</div>

			{/* Copyright */}
			<p className="text-xs text-orange-500 dark:text-gray-500 mt-4">
				© {new Date().getFullYear()} Vachanamrut.ai — All Rights Reserved.
			</p>
		</motion.footer>
	);
};

export default Footer;
