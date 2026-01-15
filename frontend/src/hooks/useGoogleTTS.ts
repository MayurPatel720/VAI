import { useState, useCallback, useRef } from "react";
import { baseURL } from "../lib/queryClient";

interface UseGoogleTTSReturn {
	speak: (text: string) => void;
	stop: () => void;
	isSpeaking: boolean;
	isLoading: boolean;
	error: string | null;
	voice: 'male' | 'female';
	setVoice: (voice: 'male' | 'female') => void;
	speed: number;
	setSpeed: (speed: number) => void;
}

/**
 * Google Cloud TTS Hook
 * Uses Google Cloud Text-to-Speech API for high-quality voice synthesis
 * Falls back to browser TTS if Google Cloud is unavailable
 */
export function useGoogleTTS(): UseGoogleTTSReturn {
	const [isSpeaking, setIsSpeaking] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [voice, setVoice] = useState<'male' | 'female'>('male');
	const [speed, setSpeed] = useState(1.0);
	
	const audioRef = useRef<HTMLAudioElement | null>(null);
	const currentUrlRef = useRef<string | null>(null);

	const stop = useCallback(() => {
		if (audioRef.current) {
			audioRef.current.pause();
			audioRef.current.currentTime = 0;
		}
		if (currentUrlRef.current) {
			URL.revokeObjectURL(currentUrlRef.current);
			currentUrlRef.current = null;
		}
		setIsSpeaking(false);
		setError(null);
	}, []);

	const speak = useCallback(async (text: string) => {
		if (!text?.trim()) return;
		
		// Stop any current playback
		stop();
		
		setIsLoading(true);
		setError(null);
		
		try {
			const token = localStorage.getItem("token");
			
			const response = await fetch(`${baseURL}/api/tts/synthesize`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${token}`
				},
				body: JSON.stringify({ text, voice, speed })
			});
			
			const data = await response.json();
			
			if (!response.ok) {
				// If TTS service unavailable, fall back to browser TTS
				if (data.fallback) {
					fallbackToBrowserTTS(text);
					return;
				}
				throw new Error(data.message || 'TTS failed');
			}
			
			// Convert base64 to audio blob
			const audioBytes = atob(data.audio);
			const audioArray = new Uint8Array(audioBytes.length);
			for (let i = 0; i < audioBytes.length; i++) {
				audioArray[i] = audioBytes.charCodeAt(i);
			}
			const audioBlob = new Blob([audioArray], { type: 'audio/mp3' });
			const audioUrl = URL.createObjectURL(audioBlob);
			
			// Store URL for cleanup
			currentUrlRef.current = audioUrl;
			
			// Create and play audio
			const audio = new Audio(audioUrl);
			audioRef.current = audio;
			
			audio.playbackRate = speed;
			
			audio.onplay = () => {
				setIsSpeaking(true);
				setIsLoading(false);
			};
			
			audio.onended = () => {
				setIsSpeaking(false);
				if (currentUrlRef.current) {
					URL.revokeObjectURL(currentUrlRef.current);
					currentUrlRef.current = null;
				}
			};
			
			audio.onerror = () => {
				setError('Failed to play audio');
				setIsSpeaking(false);
				setIsLoading(false);
			};
			
			await audio.play();
			
		} catch (err) {
			console.error('TTS Error:', err);
			// Fall back to browser TTS on any error
			fallbackToBrowserTTS(text);
		}
	}, [voice, speed, stop]);

	// Fallback to browser's built-in TTS
	const fallbackToBrowserTTS = (text: string) => {
		setIsLoading(false);
		
		if (!('speechSynthesis' in window)) {
			setError('Speech synthesis not supported');
			return;
		}
		
		const utterance = new SpeechSynthesisUtterance(text);
		utterance.rate = speed;
		
		utterance.onstart = () => setIsSpeaking(true);
		utterance.onend = () => setIsSpeaking(false);
		utterance.onerror = () => {
			setError('Browser TTS failed');
			setIsSpeaking(false);
		};
		
		speechSynthesis.speak(utterance);
	};

	return {
		speak,
		stop,
		isSpeaking,
		isLoading,
		error,
		voice,
		setVoice,
		speed,
		setSpeed
	};
}
