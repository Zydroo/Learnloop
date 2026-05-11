# LearnLoop V2 — Deep-Dive AI Systems & Technical Specifications

## 1. AI System Architecture: Multi-Model Orchestration
LearnLoop V2 does not rely on a single model. Instead, it uses a **Heterogeneous AI Strategy** to balance speed, reasoning depth, and context window size.

### A. The "Brain" (Google Gemini 1.5 Pro/Flash)
- **Primary Use**: Complex content generation (Course curricula, Quizzes).
- **Why?**: Gemini offers a massive context window (up to 1M tokens), allowing it to ingest entire YouTube playlist metadata and generate coherent, multi-module structures without "forgetting" the beginning of the course.
- **Implementation**: Managed via `backend/src/services/aiService.js`.

### B. The "Fast Response" Agent (Groq / Llama 3 70B)
- **Primary Use**: Real-time chat with the Global Guide and Lesson Tutor.
- **Why?**: Groq provides ultra-low latency (under 500ms). This makes the platform feel "alive" and interactive during chat sessions.
- **Implementation**: Routed through the same `aiService.js` but used specifically for chat-completion tasks.

---

## 2. The "Global AI Guide" (Search & Discovery Engine)
This is the most complex AI component. It acts as an **Intent-Aware RAG (Retrieval-Augmented Generation)** agent.

### The Algorithm Flow:
1. **Input Analysis**: The user's query is sent to `askGlobalAssistant` in `aiController.js`.
2. **System Prompt Engineering**: The AI is instructed with a "Platform Schema." It knows about the database structure and the platform's current state.
3. **Missing Knowledge Detection**: 
    - The AI compares the query against its internal map of the platform.
    - If the user asks for "React Tutorials" and none exist in the local DB, the AI "Self-Triggers" a tool-call.
4. **YouTube Tooling**: 
    - The AI generates a JSON-structured search query.
    - The Backend executes `fetchYoutubePlaylists(query)`.
    - The AI receives the playlist data and formats it into the UI as **Recommendation Cards**.

---

## 3. The "Content Generator" (Automated Pedagogy)
How a raw YouTube link becomes a university-style course.

### The Pedagogy Pipeline (`services/contentGenerator.js`):
1. **Scraping Phase**: Uses the YouTube Data API to extract:
   - Video IDs (for embedding)
   - Snippets (titles and full descriptions)
   - Duration and thumbnails.
2. **Contextual Analysis**: The AI reads the descriptions of all videos (sometimes 20+ videos) to find common themes.
3. **Module Grouping**: 
   - Instead of just listing videos, the AI uses **Semantic Clustering**.
   - It groups related videos into "Modules" (e.g., "Basics," "Advanced," "Projects").
4. **Evaluation Generation**: 
   - For every lesson, the AI generates a JSON array of MCQs.
   - It identifies the "Correct Answer" and provides "Explanations" for each question.
5. **JSON Schema Enforcement**: We use **Constrained Output**. The AI is strictly forbidden from returning markdown or prose; it must return a valid JSON object that fits our SQL schema perfectly.

---

## 4. Student Dropout Risk (Machine Learning Service)
This is a standalone Python microservice located in `/machine_learning`.

### The Random Forest Algorithm:
1. **Training Data**: The model was built using a dataset of 1,000+ student profiles with features:
    - `LessonsCompleted`: Progress indicator.
    - `AverageScore`: Performance indicator.
    - `QuizAttempts`: Engagement indicator.
    - `DaysSinceLastLogin`: Retention indicator.
2. **Inference Flow**:
    - Every time a student finishes a lesson, the Node.js backend pushes their stats to the Python API (`/predict`).
    - The model calculates the "Gini Impurity" across its decision trees to determine the probability of the student dropping out.
3. **Output**: Returns a `risk_level` (High, Medium, Low). The Admin dashboard uses this to alert teachers.

---

## 5. Security & Isolation Logic
### A. User-Specific Privacy
- We implemented a **Row-Level Security (RLS)** pattern in the application layer.
- The `is_private` flag in the `courses` table ensures that generated content belongs strictly to the creator.
- **SQL Logic**: `SELECT * FROM courses WHERE is_private = 0 OR created_by = ?`

### B. JWT & State Security
- All AI requests are signed with a JWT.
- This prevents "Prompt Injection" from unauthenticated users and protects your API keys from being drained by bot traffic.

---

## 6. Hosting & Cloud Architecture
- **Railway (Dynamic Compute)**: Hosts the Node.js and Python processes. It manages the auto-scaling and health checks.
- **Netlify (Edge Delivery)**: Hosts the frontend on a global CDN.
- **Aiven (Managed Storage)**: Provides a redundant, encrypted MySQL instance.

---
**Technical Summary**: LearnLoop V2 is a **Service-Oriented Architecture (SOA)** that uses **LLM-as-a-Service** for generation and **Custom ML** for predictive analytics.
