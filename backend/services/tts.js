/**
 * Google Cloud Text-to-Speech Service
 * Provides high-quality TTS with support for multiple languages
 */

const textToSpeech = require('@google-cloud/text-to-speech');
const { Logger } = require('../utils/logger');

const logger = new Logger('TTS');

// Initialize the client
let ttsClient = null;

function getClient() {
    if (!ttsClient) {
        // Check if credentials are available
        if (!process.env.GOOGLE_APPLICATION_CREDENTIALS && !process.env.GOOGLE_CLOUD_PROJECT) {
            logger.warn('Google Cloud TTS credentials not configured');
            return null;
        }
        
        try {
            ttsClient = new textToSpeech.TextToSpeechClient();
            logger.success('Google Cloud TTS client initialized');
        } catch (error) {
            logger.error('Failed to initialize Google Cloud TTS', error);
            return null;
        }
    }
    return ttsClient;
}

/**
 * Available voice options optimized for spiritual content
 */
const VOICE_OPTIONS = {
    // For Gujarati content
    gujarati: {
        male: { languageCode: 'gu-IN', name: 'gu-IN-Standard-A', ssmlGender: 'MALE' },
        female: { languageCode: 'gu-IN', name: 'gu-IN-Standard-B', ssmlGender: 'FEMALE' }
    },
    // For Hindi content  
    hindi: {
        male: { languageCode: 'hi-IN', name: 'hi-IN-Neural2-B', ssmlGender: 'MALE' },
        female: { languageCode: 'hi-IN', name: 'hi-IN-Neural2-A', ssmlGender: 'FEMALE' }
    },
    // For English content
    english: {
        male: { languageCode: 'en-IN', name: 'en-IN-Neural2-B', ssmlGender: 'MALE' },
        female: { languageCode: 'en-IN', name: 'en-IN-Neural2-A', ssmlGender: 'FEMALE' }
    }
};

/**
 * Detect language of text (simple heuristic)
 */
function detectLanguage(text) {
    // Gujarati Unicode range: U+0A80 to U+0AFF
    const gujaratiChars = text.match(/[\u0A80-\u0AFF]/g) || [];
    // Hindi/Devanagari Unicode range: U+0900 to U+097F
    const hindiChars = text.match(/[\u0900-\u097F]/g) || [];
    // ASCII for English
    const englishChars = text.match(/[a-zA-Z]/g) || [];
    
    const total = gujaratiChars.length + hindiChars.length + englishChars.length;
    if (total === 0) return 'english';
    
    if (gujaratiChars.length / total > 0.3) return 'gujarati';
    if (hindiChars.length / total > 0.3) return 'hindi';
    return 'english';
}

/**
 * Convert text to speech using Google Cloud TTS
 * @param {string} text - Text to convert
 * @param {string} voiceGender - 'male' or 'female'
 * @param {number} speakingRate - Speed of speech (0.5 to 2.0)
 * @returns {Buffer} - MP3 audio buffer
 */
async function synthesizeSpeech(text, voiceGender = 'male', speakingRate = 1.0) {
    const client = getClient();
    
    if (!client) {
        throw new Error('Google Cloud TTS not configured');
    }
    
    // Clean text for better TTS
    const cleanText = text
        .replace(/```[\s\S]*?```/g, '') // Remove code blocks
        .replace(/\*\*/g, '') // Remove bold markdown
        .replace(/\*/g, '') // Remove italic markdown
        .replace(/#+\s/g, '') // Remove headers
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove links
        .replace(/<[^>]*>/g, '') // Remove HTML
        .trim();
    
    if (!cleanText) {
        throw new Error('No text to synthesize');
    }
    
    // Detect language and select appropriate voice
    const language = detectLanguage(cleanText);
    const voice = VOICE_OPTIONS[language][voiceGender] || VOICE_OPTIONS.english[voiceGender];
    
    logger.debug(`TTS: ${language} voice (${voiceGender}), ${cleanText.length} chars`);
    
    // Build the request
    const request = {
        input: { text: cleanText },
        voice: {
            languageCode: voice.languageCode,
            name: voice.name,
            ssmlGender: voice.ssmlGender
        },
        audioConfig: {
            audioEncoding: 'MP3',
            speakingRate: Math.max(0.5, Math.min(2.0, speakingRate)),
            pitch: 0, // Default pitch
            volumeGainDb: 0 // Default volume
        }
    };
    
    // Perform the text-to-speech request
    const [response] = await client.synthesizeSpeech(request);
    
    return response.audioContent;
}

/**
 * Get list of available voices
 */
async function listVoices() {
    const client = getClient();
    if (!client) return [];
    
    try {
        const [result] = await client.listVoices({});
        // Filter for Indian languages
        return result.voices.filter(voice => 
            voice.languageCodes.some(code => 
                code.startsWith('gu-') || code.startsWith('hi-') || code.startsWith('en-IN')
            )
        );
    } catch (error) {
        logger.error('Failed to list voices', error);
        return [];
    }
}

module.exports = {
    synthesizeSpeech,
    listVoices,
    detectLanguage,
    VOICE_OPTIONS
};
