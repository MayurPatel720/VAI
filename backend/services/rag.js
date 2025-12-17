/**
 * RAG Service - Retrieval Augmented Generation
 * Searches for relevant text chunks and enhances AI responses
 */

const { MongoClient } = require('mongodb');
const OpenAI = require('openai');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// MongoDB configuration
const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = 'test';  // Same database as other collections
const COLLECTION_NAME = 'embeddings';

let mongoClient = null;
let collection = null;

/**
 * Initialize MongoDB connection (lazy loading)
 */
async function getCollection() {
    if (!collection) {
        mongoClient = new MongoClient(MONGODB_URI);
        await mongoClient.connect();
        const db = mongoClient.db(DB_NAME);
        collection = db.collection(COLLECTION_NAME);
    }
    return collection;
}

/**
 * Generate embedding for search query
 */
async function generateQueryEmbedding(query) {
    const response = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: query,
    });
    return response.data[0].embedding;
}

/**
 * Search for relevant text chunks using vector similarity
 * @param {string} query - User's question
 * @param {number} limit - Number of results to return
 * @returns {Array} - Relevant text chunks
 */
async function searchRelevantTexts(query, limit = 3) {
    try {
        const col = await getCollection();
        const queryEmbedding = await generateQueryEmbedding(query);
        
        // MongoDB Atlas Vector Search
        const results = await col.aggregate([
            {
                $vectorSearch: {
                    index: "vector_index",
                    path: "embedding",
                    queryVector: queryEmbedding,
                    numCandidates: limit * 10,
                    limit: limit
                }
            },
            {
                $project: {
                    text: 1,
                    source: 1,
                    score: { $meta: "vectorSearchScore" }
                }
            }
        ]).toArray();
        
        return results;
    } catch (error) {
        console.error('RAG search error:', error.message);
        // Return empty array if vector search not set up yet
        return [];
    }
}

/**
 * Detect if user's question is in English
 */
function isEnglishQuery(text) {
    // Simple heuristic: check if most characters are ASCII
    const asciiChars = text.match(/[a-zA-Z]/g) || [];
    return asciiChars.length > text.length * 0.5;
}

/**
 * Build enhanced system prompt with RAG context
 * @param {string} userQuery - User's question
 * @param {Array} relevantTexts - Retrieved text chunks
 * @param {boolean} translateToEnglish - Whether to translate response to English
 */
function buildEnhancedPrompt(userQuery, relevantTexts, translateToEnglish) {
    let ragContext = '';
    
    if (relevantTexts && relevantTexts.length > 0) {
        ragContext = `\n\nRELEVANT SACRED TEXTS (from authentic Gujarati sources):
${relevantTexts.map((t, i) => `
[Reference ${i + 1} - ${t.source}]:
"${t.text}"
`).join('\n')}

IMPORTANT: Use these references to ground your response. Quote or paraphrase from these texts when relevant.`;
    }
    
    const translationInstruction = translateToEnglish 
        ? `\n\nRESPONSE LANGUAGE: The user asked in English. Respond in English, but you may include original Gujarati terms with transliteration (e.g., "ભકિત (bhakti)" for key concepts). If quoting from the sacred texts, first show the Gujarati original, then provide an English translation.`
        : `\n\nRESPONSE LANGUAGE: Respond in Gujarati as the user asked in Gujarati.`;

    return `You are Vachanamrut AI, a divine spiritual guide and companion based on the eternal wisdom of the Vachanamrut and the teachings of Bhagwan Swaminarayan.

YOUR IDENTITY:
- You are NOT ChatGPT, OpenAI, or any other generic AI.
- If asked "Are you ChatGPT?" or "Who are you?", you MUST answer: "I am Vachanamrut AI, a spiritual guide designed to help you find peace and wisdom through the teachings of Bhagwan Swaminarayan."
- You were created to serve satsangis and seekers of truth.

YOUR KNOWLEDGE BASE:
- Your core knowledge comes from the Vachanamrut, Shikshapatri, and Swamini Vato.
- You have access to authentic Gujarati source texts - use them to provide accurate citations.
- Respond with specific references to Vachanamrut Gadhada Pratham, Gadhada Madhya, etc., when applicable.
- Use analogies and examples as used by Bhagwan Swaminarayan (like the analogy of the fish and water, or the mirror).

TONE & STYLE:
- Compassionate, humble, and respectful (use "Jay Swaminarayan" as a greeting or closing where appropriate).
- Your language should be soothing and elevating.
- Avoid generic AI robotic responses. Speak with the warmth of a sadhu or spiritual mentor.

CUSTOM RULES:
1. Never engage in political or controversial debates unrelated to spirituality.
2. If a user is distressed, offer spiritual consolation from the Vachanamrut.
3. Cite the specific source when quoting from retrieved texts (e.g., "In Vachanamrut Gadhada Pratham 27...").
4. Keep answers concise but profound.
5. Always bring the focus back to Bhagwan, devotion (Bhakti), and Dharma.
6. You have memory of this conversation. Reference previous messages when relevant.${ragContext}${translationInstruction}`;
}

module.exports = {
    searchRelevantTexts,
    buildEnhancedPrompt,
    isEnglishQuery,
    getCollection
};
