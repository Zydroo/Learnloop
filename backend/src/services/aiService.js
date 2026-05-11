const { GoogleGenerativeAI } = require('@google/generative-ai');
const Groq = require('groq-sdk');
const { AI_MODELS, FALLBACK_CHAIN, VALIDATION } = require('../config/aiConfig');

/**
 * ============================================================
 * AI SERVICE — Multi-Provider Intelligence Layer
 * ============================================================
 */

// 1. Initialize Providers
// Force v1 API version which is more stable in many regions
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const groq = process.env.GROQ_API_KEY ? new Groq({ apiKey: process.env.GROQ_API_KEY }) : null;

/**
 * Execute a request on Groq (as a high-speed fallback)
 */
async function executeGroq(prompt, options = {}) {
    if (!groq) throw new Error('Groq API Key missing. Cannot use Groq fallback.');
    
    const response = await groq.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: options.model || AI_MODELS.ULTRA_FAST,
        temperature: options.temperature ?? 0.1,
        response_format: options.json ? { type: "json_object" } : undefined
    });

    return response.choices[0].message.content;
}

/**
 * Generate text with automatic Multi-Provider Fallback.
 * Gemini (Primary) → Gemini (Backup) → Groq (Ultimate Fallback)
 */
async function generateText(prompt, options = {}) {
    const primaryModelName = options.model || AI_MODELS.FAST;
    
    const executeGemini = async (modelName, attempt = 1) => {
        try {
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent({
                contents: [{ role: 'user', parts: [{ text: prompt }] }],
                generationConfig: {
                    temperature: options.temperature ?? 0.7,
                    maxOutputTokens: options.maxTokens ?? 4096,
                },
            });
            return result.response.text();
        } catch (error) {
            // Retry on Rate Limit (429)
            if (error.message?.includes('429') && attempt < 2) {
                console.warn(`⏳ Gemini Busy. Retrying in 2s...`);
                await new Promise(r => setTimeout(r, 2000));
                return executeGemini(modelName, attempt + 1);
            }
            throw error;
        }
    };

    try {
        // Attempt Groq Primary (As requested: use groq because gemeni hit limit)
        if (groq) {
            console.info(`🚀 Using Groq as primary provider...`);
            return await executeGroq(prompt, options);
        }
        
        // Fallback to Gemini if Groq is missing
        return await executeGemini(primaryModelName);
    } catch (groqError) {
        console.warn(`⚠️ Groq failed or missing: ${groqError.message}. Switching to Gemini...`);
        
        try {
            return await executeGemini(primaryModelName);
        } catch (geminiError) {
            console.error(`❌ Gemini Error:`, geminiError.message);
            
            // Try Gemini Fallback
            const backupModel = FALLBACK_CHAIN[primaryModelName];
            if (backupModel) {
                try {
                    console.info(`🔄 Trying Gemini Backup: ${backupModel}`);
                    return await executeGemini(backupModel);
                } catch (backupErr) {
                    console.error(`❌ Gemini Backup Failed:`, backupErr.message);
                }
            }
            throw new Error(`All AI Providers failed. Gemini Error: ${geminiError.message}`);
        }
    }
}


/**
 * Generate structured JSON with Multi-Provider Fallback.
 */
async function generateJSON(prompt) {
    const primaryModelName = AI_MODELS.FAST;
    
    const executeGeminiJSON = async (modelName, attempt = 1) => {
        try {
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent({
                contents: [{ role: 'user', parts: [{ text: prompt }] }],
                generationConfig: {
                    temperature: 0.1,
                    responseMimeType: "application/json",
                },
            });
            const text = result.response.text();
            const cleanText = text.replace(/```(?:json)?/g, '').replace(/```/g, '').trim();
            return JSON.parse(cleanText);
        } catch (error) {
            if (error.message?.includes('429') && attempt < 2) {
                await new Promise(r => setTimeout(r, 2000));
                return executeGeminiJSON(modelName, attempt + 1);
            }
            throw error;
        }
    };

    try {
        // Attempt Groq for JSON first (As requested)
        if (process.env.GROQ_API_KEY) {
            console.info(`🚀 Groq executing JSON request as primary...`);
            const dynamicGroq = new Groq({ apiKey: process.env.GROQ_API_KEY });
            const raw = await dynamicGroq.chat.completions.create({
                messages: [{ role: 'user', content: prompt + "\n\nIMPORTANT: Return ONLY a valid JSON object." }],
                model: AI_MODELS.ULTRA_FAST,
                temperature: 0.1,
                response_format: { type: "json_object" }
            });
            
            const content = raw.choices[0].message.content;
            const cleanContent = content.replace(/```(?:json)?/g, '').replace(/```/g, '').trim();
            return JSON.parse(cleanContent);
        }
        
        // Fallback to Gemini if Groq is missing
        return await executeGeminiJSON(primaryModelName);
    } catch (err) {
        console.warn(`⚠️ Groq JSON failed: ${err.message}. Switching to Gemini...`);
        
        try {
            return await executeGeminiJSON(primaryModelName);
        } catch (geminiErr) {
            console.error(`❌ Gemini JSON failed:`, geminiErr.message);
            throw new Error(`AI Providers exhausted. Gemini Error: ${geminiErr.message}`);
        }
    }
}


/**
 * Generate embedding vector. (Gemini only as Groq doesn't offer embeddings)
 */
async function generateEmbedding(text) {
    try {
        const model = genAI.getGenerativeModel({ model: AI_MODELS.EMBEDDING });
        const result = await model.embedContent(text);
        return result.embedding.values;
    } catch (error) {
        // Simple fallback for embedding
        try {
            const fallbackModel = genAI.getGenerativeModel({ model: "embedding-001" });
            const result = await fallbackModel.embedContent(text);
            return result.embedding.values;
        } catch (e) {
            throw new Error(`Embedding failed: ${error.message}`);
        }
    }
}

/**
 * Generate embeddings in batch.
 */
async function generateEmbeddings(texts) {
    const embeddings = [];
    for (const text of texts) {
        const emb = await generateEmbedding(text);
        embeddings.push(emb);
    }
    return embeddings;
}

module.exports = {
    generateText,
    generateJSON,
    generateEmbedding,
    generateEmbeddings,
};
