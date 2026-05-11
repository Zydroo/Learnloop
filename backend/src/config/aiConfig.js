/**
 * ============================================================
 * AI CONFIGURATION — Centralized Model Registry
 * ============================================================
 */

module.exports = {
    AI_MODELS: {
        FAST: "gemini-1.5-flash",
        REASONING: "gemini-1.5-pro",
        LIGHT: "gemini-1.5-flash",
        EMBEDDING: "text-embedding-004",
        ULTRA_FAST: "llama-3.1-8b-instant" // Groq model (higher TPM limit)
    },
    
    // Fallback chain: if model A fails, try model B
    FALLBACK_CHAIN: {
        "gemini-1.5-flash": "gemini-1.5-flash-8b",
        "gemini-1.5-pro": "gemini-1.5-flash",
        "GLOBAL_FALLBACK": "llama-3.1-8b-instant" // Ultimate fallback to Groq
    },

    VALIDATION: {
        MIN_API_KEY_LENGTH: 30,
        SUPPORTED_VERSIONS: ["v1", "v1beta"]
    }
};
