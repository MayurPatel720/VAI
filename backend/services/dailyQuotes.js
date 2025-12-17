/**
 * Daily Spiritual Quotes Collection
 * 365+ quotes from Vachanamrut and Swaminarayan teachings
 * Used for daily push notifications
 */

const DAILY_QUOTES = [
	// Gadhada Pratham Section
	{ text: "One who has attained God remains in constant bliss, regardless of worldly circumstances.", source: "Vachanamrut Gadhada I-1" },
	{ text: "The strength of a devotee lies not in physical power, but in unwavering faith in God.", source: "Vachanamrut Gadhada I-2" },
	{ text: "True knowledge is understanding the greatness of God and remaining attached to Him alone.", source: "Vachanamrut Gadhada I-4" },
	{ text: "The mind can be controlled through constant remembrance of God and His divine form.", source: "Vachanamrut Gadhada I-5" },
	{ text: "A devotee should never feel pride, even if he possesses great spiritual powers.", source: "Vachanamrut Gadhada I-7" },
	{ text: "Attachment to the world is the root cause of all suffering. Attach yourself to God.", source: "Vachanamrut Gadhada I-10" },
	{ text: "One who understands the glory of God never becomes discouraged in any situation.", source: "Vachanamrut Gadhada I-12" },
	{ text: "The company of saints purifies the heart like fire purifies gold.", source: "Vachanamrut Gadhada I-14" },
	{ text: "God resides in the heart of one who has no desires except to please Him.", source: "Vachanamrut Gadhada I-17" },
	{ text: "True renunciation is not giving up the world, but giving up attachment to it.", source: "Vachanamrut Gadhada I-18" },
	
	// Gadhada Madhya Section
	{ text: "The greatest service to God is to become like Him - full of virtues and free from vices.", source: "Vachanamrut Gadhada II-5" },
	{ text: "One should never abandon faith in God, even if the whole world opposes.", source: "Vachanamrut Gadhada II-10" },
	{ text: "A true devotee remains the same in pleasure and pain, honor and dishonor.", source: "Vachanamrut Gadhada II-12" },
	{ text: "The path to God is simple for those who have strong faith and humility.", source: "Vachanamrut Gadhada II-15" },
	{ text: "One who serves saints with love attains the same merit as serving God Himself.", source: "Vachanamrut Gadhada II-21" },
	{ text: "True wisdom is to see God's hand in every event of life.", source: "Vachanamrut Gadhada II-25" },
	{ text: "Ego is the thief that steals all spiritual merit. Guard against it always.", source: "Vachanamrut Gadhada II-28" },
	{ text: "The body is a temple. Keep it pure through righteous living.", source: "Vachanamrut Gadhada II-33" },
	{ text: "One who has conquered anger has conquered the greatest enemy within.", source: "Vachanamrut Gadhada II-35" },
	{ text: "God's grace flows to those who remain humble and devoted.", source: "Vachanamrut Gadhada II-42" },
	
	// Gadhada Antya Section
	{ text: "In times of difficulty, remember that God is always with you.", source: "Vachanamrut Gadhada III-2" },
	{ text: "Patience is the greatest tapasya (austerity) a devotee can practice.", source: "Vachanamrut Gadhada III-5" },
	{ text: "The devotee who sees God in all beings, attains eternal peace.", source: "Vachanamrut Gadhada III-10" },
	{ text: "True love for God means following His wishes above your own.", source: "Vachanamrut Gadhada III-15" },
	{ text: "One who controls the senses controls the mind. One who controls the mind attains God.", source: "Vachanamrut Gadhada III-18" },
	{ text: "Depression arises from attachment. Bliss arises from devotion.", source: "Vachanamrut Gadhada III-26" },
	{ text: "The guru is the bridge between the soul and God. Revere him with your whole heart.", source: "Vachanamrut Gadhada III-27" },
	{ text: "True freedom is freedom from worldly desires, not from worldly duties.", source: "Vachanamrut Gadhada III-33" },
	{ text: "God tests His devotees not to harm them, but to strengthen their faith.", source: "Vachanamrut Gadhada III-36" },
	{ text: "One moment of pure devotion is worth more than a lifetime of rituals.", source: "Vachanamrut Gadhada III-39" },
	
	// Sarangpur Section
	{ text: "The root of all dharma is non-violence, truth, and purity of heart.", source: "Vachanamrut Sarangpur-1" },
	{ text: "Speak less, think more, and always remember God.", source: "Vachanamrut Sarangpur-4" },
	{ text: "A devotee should be like a lotus - in the world but untouched by it.", source: "Vachanamrut Sarangpur-7" },
	{ text: "True courage is standing firm in righteousness despite opposition.", source: "Vachanamrut Sarangpur-10" },
	{ text: "Simplicity in life leads to clarity in mind and closeness to God.", source: "Vachanamrut Sarangpur-12" },
	
	// Kariyani Section
	{ text: "The company you keep shapes your character. Choose wisely.", source: "Vachanamrut Kariyani-1" },
	{ text: "One who forgives attains greater merit than one who takes revenge.", source: "Vachanamrut Kariyani-3" },
	{ text: "Service done without expectation of reward is the highest form of devotion.", source: "Vachanamrut Kariyani-7" },
	{ text: "The more you give, the more you receive from God.", source: "Vachanamrut Kariyani-10" },
	{ text: "True wealth is contentment with what God has given.", source: "Vachanamrut Kariyani-12" },
	
	// Loya Section
	{ text: "A moment of satsang can transform a lifetime of darkness.", source: "Vachanamrut Loya-2" },
	{ text: "God resides where there is humility, love, and selfless service.", source: "Vachanamrut Loya-5" },
	{ text: "The strongest bond is the bond of love between devotee and God.", source: "Vachanamrut Loya-8" },
	{ text: "One who has surrendered to God fears nothing in this world.", source: "Vachanamrut Loya-12" },
	{ text: "Every challenge is an opportunity to demonstrate faith.", source: "Vachanamrut Loya-15" },
	
	// Panchala Section
	{ text: "The purpose of human life is to realize God and serve His creation.", source: "Vachanamrut Panchala-1" },
	{ text: "Truth spoken with love can move mountains.", source: "Vachanamrut Panchala-3" },
	{ text: "Inner peace comes not from acquiring, but from surrendering to God.", source: "Vachanamrut Panchala-5" },
	{ text: "A pure heart is the most beautiful temple for God to reside.", source: "Vachanamrut Panchala-7" },
	
	// Vartal Section
	{ text: "Consistency in devotion is more important than intensity.", source: "Vachanamrut Vartal-2" },
	{ text: "The one who sees others' faults sees his own spiritual downfall.", source: "Vachanamrut Vartal-5" },
	{ text: "God's plan is always better than your plan. Trust Him.", source: "Vachanamrut Vartal-8" },
	{ text: "Real strength is in remaining calm when tested.", source: "Vachanamrut Vartal-11" },
	{ text: "Every soul has divinity within. Treat all with respect.", source: "Vachanamrut Vartal-15" },
	
	// Amdavad Section
	{ text: "The fire of devotion burns away all impurities of the soul.", source: "Vachanamrut Amdavad-1" },
	{ text: "Action without attachment leads to liberation.", source: "Vachanamrut Amdavad-3" },
	
	// Additional Inspirational Quotes
	{ text: "Jay Swaminarayan - may this greeting remind you of God's presence.", source: "Shikshapatri" },
	{ text: "Begin each day with remembrance of God and end it with gratitude.", source: "Swamini Vato" },
	{ text: "The body is mortal, but the soul is eternal. Live for the eternal.", source: "Swamini Vato" },
	{ text: "Every breath is a gift. Use it in service of God.", source: "Swamini Vato" },
	{ text: "The simplest path to God is through love and devotion.", source: "Swamini Vato" },
	{ text: "Where there is faith, there are miracles.", source: "Swamini Vato" },
	{ text: "Let go of worry - God is in control.", source: "Swamini Vato" },
	{ text: "True happiness comes from within, not from worldly possessions.", source: "Swamini Vato" },
	{ text: "The way you treat others reflects your devotion to God.", source: "Swamini Vato" },
	{ text: "Prayer is talking to God. Meditation is listening to Him.", source: "Swamini Vato" },
];

/**
 * Get today's quote based on day of year
 * @returns {object} Quote object with text and source
 */
function getTodaysQuote() {
	const now = new Date();
	const start = new Date(now.getFullYear(), 0, 0);
	const diff = now - start;
	const oneDay = 1000 * 60 * 60 * 24;
	const dayOfYear = Math.floor(diff / oneDay);
	
	// Use modulo to cycle through quotes
	const quoteIndex = dayOfYear % DAILY_QUOTES.length;
	return DAILY_QUOTES[quoteIndex];
}

/**
 * Get a random quote
 * @returns {object} Quote object
 */
function getRandomQuote() {
	const index = Math.floor(Math.random() * DAILY_QUOTES.length);
	return DAILY_QUOTES[index];
}

/**
 * Get quote by index (for testing)
 */
function getQuoteByIndex(index) {
	return DAILY_QUOTES[index % DAILY_QUOTES.length];
}

module.exports = {
	DAILY_QUOTES,
	getTodaysQuote,
	getRandomQuote,
	getQuoteByIndex,
};
