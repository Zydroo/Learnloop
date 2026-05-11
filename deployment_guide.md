# 🚀 LearnLoop V2 Deployment Guide

This guide explains how to deploy the entire ecosystem (Frontend, Backend, and AI Risk Service) for **FREE** using modern cloud platforms.

## Prerequisites
- A **GitHub** account.
- Accounts on **Vercel** (for Frontend) and **Render** (for Backend & AI).
- Your **Aiven MySQL** connection details.
- Your **AI API Keys** (Gemini, Groq, YouTube).

---

## 1. Prepare your GitHub Repository
1. Initialize a git repository in the root folder.
2. Create a `.gitignore` to exclude `node_modules`, `.env`, and `__pycache__`.
3. Push your code to a new private or public repository on GitHub.

---

## 2. Deploy the AI Risk Service (Python)
We will deploy this first because the Backend depends on its URL.
1. Log in to [Render.com](https://render.com).
2. Click **New +** > **Web Service**.
3. Connect your GitHub repository.
4. Select the `machine_learning` directory as the **Root Directory**.
5. **Runtime**: `Python 3`.
6. **Build Command**: `pip install -r requirements.txt`.
7. **Start Command**: `gunicorn api:app`.
8. **Plan**: Select **Free**.
9. **Environment Variables**: Add any needed vars (usually none for the ML service unless you added custom ones).
10. **Copy the URL**: Once deployed, it will look like `https://learnloop-ai-risk.onrender.com`.

---

## 3. Deploy the Backend (Node.js)
1. Log in to [Render.com](https://render.com).
2. Click **New +** > **Web Service**.
3. Connect your GitHub repository.
4. Select the `backend` directory as the **Root Directory**.
5. **Runtime**: `Node`.
6. **Build Command**: `npm install`.
7. **Start Command**: `npm start`.
8. **Plan**: Select **Free**.
9. **Environment Variables**:
   - `PORT`: `10000` (Render default)
   - `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`: (Your Aiven credentials)
   - `JWT_SECRET`: (A long random string)
   - `GEMINI_API_KEY`: (Your Google AI key)
   - `GROQ_API_KEY`: (Your Groq key)
   - `YOUTUBE_API_KEY`: (Your YouTube key)
   - `ML_API_URL`: `https://your-ai-risk-service-url.onrender.com` (From Step 2)
10. **Copy the URL**: Once deployed, it will look like `https://learnloop-backend.onrender.com`.

---

## 4. Deploy the Frontend (Next.js)
1. Log in to [Vercel.com](https://vercel.com).
2. Click **Add New** > **Project**.
3. Connect your GitHub repository.
4. Select the `frontend` directory as the **Root Directory**.
5. Vercel will auto-detect **Next.js**.
6. **Environment Variables**:
   - `NEXT_PUBLIC_API_URL`: `https://your-backend-url.onrender.com/api` (From Step 3)
7. Click **Deploy**.

---

## ✅ Important Notes
- **Cold Starts**: On Render's Free Plan, the backend and AI service will "go to sleep" after 15 minutes of inactivity. The first request might take 30-50 seconds to wake them up.
- **CORS**: I have already configured the backend to allow requests from Vercel. If you see CORS errors, ensure `origin: '*'` is set in `backend/src/server.js` or update it with your specific Vercel URL.
- **Database**: Your Aiven MySQL database is already cloud-hosted, so it will work perfectly across all services!
