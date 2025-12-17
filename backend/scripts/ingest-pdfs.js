/**
 * PDF Ingestion Script for RAG (Memory Optimized)
 * Processes PDFs one at a time to avoid memory issues
 * 
 * Run: node scripts/ingest-pdfs.js
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
const { MongoClient } = require('mongodb');
const OpenAI = require('openai');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Configuration
const PDF_DIR = path.join(__dirname, '../../files');
const CHUNK_SIZE = 600; // characters per chunk
const CHUNK_OVERLAP = 50; // smaller overlap to reduce data

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = 'test';  // Using same database as other collections
const COLLECTION_NAME = 'embeddings';

/**
 * Split text into overlapping chunks (optimized)
 */
function chunkText(text, source) {
    const chunks = [];
    // Aggressive cleaning to reduce size
    const cleanText = text.replace(/\s+/g, ' ').replace(/[\x00-\x1F\x7F]/g, '').trim();
    
    let start = 0;
    let chunkIndex = 0;
    
    while (start < cleanText.length) {
        const end = Math.min(start + CHUNK_SIZE, cleanText.length);
        const chunk = cleanText.slice(start, end);
        
        // Find a good break point
        let actualEnd = end;
        if (end < cleanText.length) {
            const lastPeriod = chunk.lastIndexOf('।'); // Gujarati sentence end
            const lastFullStop = chunk.lastIndexOf('.');
            const lastNewline = chunk.lastIndexOf('\n');
            
            const breakPoint = Math.max(lastPeriod, lastFullStop, lastNewline);
            if (breakPoint > CHUNK_SIZE * 0.4) {
                actualEnd = start + breakPoint + 1;
            }
        }
        
        const finalChunk = cleanText.slice(start, actualEnd).trim();
        if (finalChunk.length > 100) { // Only keep meaningful chunks
            chunks.push({
                text: finalChunk,
                source: source,
                chunkIndex: chunkIndex++,
                language: 'gujarati'
            });
        }
        
        start = actualEnd - CHUNK_OVERLAP;
        if (start <= 0) start = actualEnd;
        if (start >= cleanText.length) break;
        
        // Limit chunks per PDF to avoid memory issues
        if (chunkIndex > 500) {
            console.log(`   ⚠️ Limiting to first 500 chunks for memory`);
            break;
        }
    }
    
    return chunks;
}

/**
 * Generate embedding for a text chunk
 */
async function generateEmbedding(text) {
    const response = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: text.substring(0, 8000), // Limit text length
    });
    return response.data[0].embedding;
}

/**
 * Process a single PDF file
 */
async function processPDF(filePath) {
    console.log(`\n📖 Processing: ${path.basename(filePath)}`);
    
    const dataBuffer = fs.readFileSync(filePath);
    const pdfData = await pdfParse(dataBuffer);
    
    console.log(`   Pages: ${pdfData.numpages}`);
    console.log(`   Characters: ${pdfData.text.length}`);
    
    // Only use first portion if too large
    let textToProcess = pdfData.text;
    if (textToProcess.length > 500000) {
        console.log(`   ⚠️ File too large, using first 500K characters`);
        textToProcess = textToProcess.substring(0, 500000);
    }
    
    // Determine source name from filename
    const filename = path.basename(filePath, '.pdf');
    let sourceName = 'Unknown';
    if (filename.toLowerCase().includes('vachanamrut')) {
        sourceName = 'Vachanamrut';
    } else if (filename.toLowerCase().includes('swamini') || filename.toLowerCase().includes('vato')) {
        sourceName = 'Swamini Vato';
    } else if (filename.toLowerCase().includes('shikshapatri')) {
        sourceName = 'Shikshapatri';
    }
    
    // Chunk the text
    const chunks = chunkText(textToProcess, sourceName);
    console.log(`   Chunks created: ${chunks.length}`);
    
    // Free up memory
    textToProcess = null;
    
    return chunks;
}

/**
 * Main ingestion function
 */
async function ingestPDFs() {
    console.log('🚀 Starting PDF Ingestion for RAG...\n');
    
    // Connect to MongoDB
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    console.log('✅ Connected to MongoDB Atlas');
    
    const db = client.db(DB_NAME);
    const collection = db.collection(COLLECTION_NAME);
    
    // Clear existing embeddings
    await collection.deleteMany({});
    console.log('🗑️  Cleared existing embeddings');
    
    // Get all Gujarati PDF files
    const pdfFiles = fs.readdirSync(PDF_DIR)
        .filter(f => f.endsWith('.pdf') && f.toLowerCase().includes('gujarati'))
        .map(f => path.join(PDF_DIR, f));
    
    console.log(`\n📚 Found ${pdfFiles.length} Gujarati PDF(s) to process`);
    
    let totalChunks = 0;
    
    for (const pdfPath of pdfFiles) {
        try {
            const chunks = await processPDF(pdfPath);
            
            console.log(`   Generating embeddings (this may take a while)...`);
            
            const BATCH_SIZE = 10;
            for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
                const batch = chunks.slice(i, i + BATCH_SIZE);
                
                for (const chunk of batch) {
                    try {
                        const embedding = await generateEmbedding(chunk.text);
                        
                        await collection.insertOne({
                            text: chunk.text,
                            source: chunk.source,
                            chunkIndex: chunk.chunkIndex,
                            language: chunk.language,
                            embedding: embedding,
                            createdAt: new Date()
                        });
                        
                        totalChunks++;
                    } catch (embeddingError) {
                        console.error(`\n   ⚠️ Error chunk ${chunk.chunkIndex}:`, embeddingError.message.substring(0, 100));
                    }
                }
                
                // Progress indicator
                process.stdout.write(`\r   Progress: ${Math.min(i + BATCH_SIZE, chunks.length)}/${chunks.length} chunks`);
                
                // Delay between batches to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 200));
            }
            
            console.log(`\n   ✅ Completed: ${chunks.length} chunks processed`);
            
            // Force garbage collection between files
            if (global.gc) global.gc();
            
        } catch (error) {
            console.error(`\n❌ Error processing ${path.basename(pdfPath)}:`, error.message);
        }
    }
    
    await client.close();
    
    console.log('\n' + '='.repeat(50));
    console.log(`✨ INGESTION COMPLETE!`);
    console.log(`   Total chunks embedded: ${totalChunks}`);
    console.log(`   Collection: ${DB_NAME}.${COLLECTION_NAME}`);
    console.log(`   Now create the vector index in MongoDB Atlas!`);
    console.log('='.repeat(50) + '\n');
}

// Run the ingestion
ingestPDFs().catch(console.error);
