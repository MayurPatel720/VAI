import { motion } from "framer-motion";

export default function AboutVachanamrut() {
	return (
		<motion.section
			className="bg-background text-center py-16 px-6 md:px-20"
			initial={{ opacity: 0, y: 30 }}
			whileInView={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.8 }}
			viewport={{ once: true }}
		>
			<h2 className="text-4xl font-bold mb-4">
				About <span className="text-primary">Vachanamrut</span>
			</h2>
			<p className="max-w-6xl mx-auto text-lg text-gray-600 leading-relaxed">
				The <strong>Vachanamrut</strong> is the principal scripture of the
				Swaminarayan tradition, a timeless compilation of{" "}
				<strong>273 discourses</strong> delivered by
				<strong> Bhagwan Swaminarayan</strong> between 1819 and 1829. It
				captures profound spiritual conversations on the nature of the self,
				God, liberation, and moral living, preserved exactly as spoken. Each
				discourse is dated and recorded with meticulous detail, giving it rare
				historical authenticity among Hindu scriptures. Through simple dialogue,
				deep philosophy, and practical guidance, the Vachanamrut bridges{" "}
				<strong>Vedantic wisdom and daily devotion</strong>, making spiritual
				realization both personal and practical.
			</p>
		</motion.section>
	);
}
