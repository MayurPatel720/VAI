// src/components/AnimatedPage.tsx
import { motion } from "framer-motion";
import { type ReactNode } from "react";

interface AnimatedPageProps {
	children: ReactNode;
}

export default function AnimatedPage({ children }: AnimatedPageProps) {
	return (
		<motion.div
			key={location.pathname}
			initial={{ opacity: 0, y: 25 }}
			animate={{ opacity: 1, y: 0 }}
			exit={{ opacity: 0, y: -25 }}
			transition={{ duration: 0.6, ease: "easeInOut" }}
			className="min-h-screen"
		>
			{children}
		</motion.div>
	);
}
