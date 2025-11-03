import { motion } from "framer-motion";

const Footer = () => {
	return (
		<motion.footer
			initial={{ opacity: 0, y: 40 }}
			whileInView={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.8, ease: "easeOut" }}
			className="relative mt-5 bg-gradient-to-br from-orange-50 via-white to-orange-100 border-t border-orange-200 text-center py-10"
		>
			{/* Glowing Line */}
			<div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-orange-400 to-transparent animate-pulse"></div>
			{/* Logo or Title */}
			<h2 className="text-2xl font-semibold text-orange-600 tracking-wide mb-2">
				Vachanamrut.ai
			</h2>
			<p className="text-sm text-orange-800 max-w-lg mx-auto px-4">
				Discover the eternal wisdom of Bhagwan Swaminarayan through interactive
				AI conversations and insightful reflections from the sacred text —
				Vachanamrut.
			</p>
			<div className="flex items-center justify-center my-6">
				<div className="h-[2px] flex-1 max-w-[100px] bg-gradient-to-r from-transparent via-orange-400 to-transparent"></div>
				<div className="h-[2px] flex-1 max-w-[100px] bg-gradient-to-r from-transparent via-orange-400 to-transparent"></div>
			</div>

			<div className="flex flex-wrap justify-center gap-6 text-sm text-orange-700 mb-4">
				<a href="#about" className="hover:text-orange-500 transition">
					About
				</a>
				<a href="#plans" className="hover:text-orange-500 transition">
					Pricing
				</a>
				<a href="#chat" className="hover:text-orange-500 transition">
					Chat
				</a>
				<a href="#contact" className="hover:text-orange-500 transition">
					Contact
				</a>
			</div>
			{/* Copyright */}
			<p className="text-xs text-orange-500 mt-4">
				© {new Date().getFullYear()} Vachanamrut.ai — All Rights Reserved.
			</p>
		</motion.footer>
	);
};

export default Footer;
