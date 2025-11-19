import { motion } from "framer-motion";

export default function AboutVachanamrut() {
	return (
		<motion.section
			className="text-center py-16 px-6 md:px-20 transition-colors duration-700 from-orange-50 via-white to-orange-100 dark:from-[#0b0b0b] dark:via-[#14100d] dark:to-[#1d150f]"
			initial={{ opacity: 0, y: 30 }}
			whileInView={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.8 }}
			viewport={{ once: true }}
		>
			<h2 className="text-4xl md:text-5xl font-extrabold mb-6 text-orange-700 dark:text-[#f5d6b1]">
				About{" "}
				<span className="text-[#c76c2e] dark:text-[#d58c50]">Vachanamrut</span>
			</h2>

			<p className="max-w-5xl mx-auto text-lg md:text-xl leading-relaxed text-gray-700 dark:text-gray-300 tracking-wide">
				The{" "}
				<strong className="text-[#b45309] dark:text-[#d58c50]">
					Vachanamrut
				</strong>{" "}
				is the principal scripture of the Swaminarayan tradition — a timeless
				compilation of{" "}
				<strong className="text-[#b45309] dark:text-[#d58c50]">
					273 discourses
				</strong>{" "}
				delivered by{" "}
				<strong className="text-[#b45309] dark:text-[#d58c50]">
					Bhagwan Swaminarayan
				</strong>{" "}
				between 1819 and 1829. It captures profound spiritual conversations on
				the nature of the self, God, liberation, and moral living — preserved
				exactly as spoken.
				<br />
				<br />
				Each discourse is dated and recorded with meticulous detail, giving it
				rare historical authenticity among Hindu scriptures. Through simple
				dialogue, deep philosophy, and practical guidance, the Vachanamrut
				beautifully bridges{" "}
				<strong className="text-[#b45309] dark:text-[#d58c50]">
					Vedantic wisdom and daily devotion
				</strong>
				, making spiritual realization both personal and practical.
			</p>
		</motion.section>
	);
}
