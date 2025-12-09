import { useState, useCallback, useRef, useEffect } from "react";

interface TTSOptions {
	rate?: number;
	pitch?: number;
	voice?: SpeechSynthesisVoice | null;
}

interface UseTTSReturn {
	speak: (text: string) => void;
	stop: () => void;
	pause: () => void;
	resume: () => void;
	isSpeaking: boolean;
	isPaused: boolean;
	isSupported: boolean;
	voices: SpeechSynthesisVoice[];
	rate: number;
	setRate: (rate: number) => void;
	currentVoice: SpeechSynthesisVoice | null;
	setCurrentVoice: (voice: SpeechSynthesisVoice | null) => void;
}

export function useTTS(options: TTSOptions = {}): UseTTSReturn {
	const [isSpeaking, setIsSpeaking] = useState(false);
	const [isPaused, setIsPaused] = useState(false);
	const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
	const [rate, setRate] = useState(options.rate || 1);
	const [currentVoice, setCurrentVoice] = useState<SpeechSynthesisVoice | null>(
		options.voice || null
	);
	const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

	// Check if TTS is supported
	const isSupported = typeof window !== "undefined" && "speechSynthesis" in window;

	// Load available voices
	useEffect(() => {
		if (!isSupported) return;

		const loadVoices = () => {
			const availableVoices = speechSynthesis.getVoices();
			setVoices(availableVoices);
			
			// Set default voice (prefer English)
			if (!currentVoice && availableVoices.length > 0) {
				const englishVoice = availableVoices.find(
					(v) => v.lang.startsWith("en") && v.name.includes("Google")
				) || availableVoices.find((v) => v.lang.startsWith("en")) || availableVoices[0];
				setCurrentVoice(englishVoice);
			}
		};

		loadVoices();
		speechSynthesis.addEventListener("voiceschanged", loadVoices);

		return () => {
			speechSynthesis.removeEventListener("voiceschanged", loadVoices);
		};
	}, [isSupported, currentVoice]);

	// Clean up on unmount
	useEffect(() => {
		return () => {
			if (isSupported) {
				speechSynthesis.cancel();
			}
		};
	}, [isSupported]);

	const speak = useCallback(
		(text: string) => {
			if (!isSupported) return;

			// Cancel any ongoing speech
			speechSynthesis.cancel();

			// Clean up text for better TTS
			const cleanText = text
				.replace(/```[\s\S]*?```/g, "") // Remove code blocks
				.replace(/\*\*/g, "") // Remove bold markers
				.replace(/\*/g, "") // Remove italic markers
				.replace(/#+\s/g, "") // Remove markdown headers
				.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // Remove markdown links
				.replace(/<[^>]*>/g, "") // Remove HTML tags
				.trim();

			if (!cleanText) return;

			const utterance = new SpeechSynthesisUtterance(cleanText);
			utterance.rate = rate;
			utterance.pitch = options.pitch || 1;

			if (currentVoice) {
				utterance.voice = currentVoice;
			}

			utterance.onstart = () => {
				setIsSpeaking(true);
				setIsPaused(false);
			};

			utterance.onend = () => {
				setIsSpeaking(false);
				setIsPaused(false);
			};

			utterance.onerror = () => {
				setIsSpeaking(false);
				setIsPaused(false);
			};

			utterance.onpause = () => {
				setIsPaused(true);
			};

			utterance.onresume = () => {
				setIsPaused(false);
			};

			utteranceRef.current = utterance;
			speechSynthesis.speak(utterance);
		},
		[isSupported, rate, currentVoice, options.pitch]
	);

	const stop = useCallback(() => {
		if (!isSupported) return;
		speechSynthesis.cancel();
		setIsSpeaking(false);
		setIsPaused(false);
	}, [isSupported]);

	const pause = useCallback(() => {
		if (!isSupported) return;
		speechSynthesis.pause();
		setIsPaused(true);
	}, [isSupported]);

	const resume = useCallback(() => {
		if (!isSupported) return;
		speechSynthesis.resume();
		setIsPaused(false);
	}, [isSupported]);

	return {
		speak,
		stop,
		pause,
		resume,
		isSpeaking,
		isPaused,
		isSupported,
		voices,
		rate,
		setRate,
		currentVoice,
		setCurrentVoice,
	};
}
