# Sahara Backend — Zero-Cost Cloud Deployment Guide

This guide walks you through deploying the Sahara FastAPI backend to the cloud with **zero hosting cost ($0.00 / month)**.

---

## 🚀 Option 1: Render.com (Recommended — 100% Free)

Render provides a **free web service tier** with free automatic SSL, continuous deployment from GitHub, and built-in Python support.

### Step-by-Step Instructions:

1. **Push your code to GitHub:**
   ```bash
   git add .
   git commit -m "Sahara v2: Privacy-hardened backend with zero-cost deployment configs"
   git push origin main
   ```

2. **Sign up / Log in to [Render.com](https://render.com)** (free, no credit card required).

3. **Deploy with 1-Click Blueprint (Easiest):**
   - Click **New +** $\rightarrow$ **Blueprint**.
   - Connect your GitHub repository (`Sahara`).
   - Render will detect `render.yaml` automatically.
   - Click **Apply**.

4. **Or Deploy as a Web Service Manually:**
   - Click **New +** $\rightarrow$ **Web Service**.
   - Connect your GitHub repository.
   - Configure the following settings:
     | Setting | Value |
     | :--- | :--- |
     | **Name** | `sahara-api` (or any name you choose) |
     | **Environment** | `Python 3` |
     | **Region** | Singapore / Frankfurt / Oregon |
     | **Branch** | `main` |
     | **Build Command** | `pip install -r requirements.txt` |
     | **Start Command** | `uvicorn backend.main:app --host 0.0.0.0 --port $PORT` |
     | **Instance Type** | **Free** ($0/month) |

5. **Set Environment Variables in Render Dashboard:**
   - Under **Environment Variables**, add:
     - `GEMINI_API_KEY`: *(Your Google Gemini API Key)*
     - `ADMIN_SECRET_KEY`: `sahara-admin-secret-2025` *(or your custom secure key)*
     - `DATABASE_FILE`: `backend/sahara.db`

6. **Click "Create Web Service"**:
   - Render will build and deploy your app.
   - In ~1-2 minutes, you will get a live URL: `https://sahara-api.onrender.com`.
   - Your interactive API docs will be live at: `https://sahara-api.onrender.com/docs`.

---

## ⚡ Option 2: Koyeb (100% Free Eco Tier)

Koyeb offers a free Eco instance with global edge routing and automatic HTTPS.

1. Create a free account at [Koyeb.com](https://www.koyeb.com).
2. Click **Create App** $\rightarrow$ **GitHub**.
3. Select your repository.
4. Set:
   - **Build type**: Dockerfile (or Python buildpack)
   - **Port**: `8000`
   - **Environment variables**: `GEMINI_API_KEY` and `ADMIN_SECRET_KEY`
5. Click **Deploy**.

---

## 🤗 Option 3: Hugging Face Spaces (Free Docker/FastAPI)

Hugging Face Spaces offers free permanent CPU hosting:

1. Create a free account at [HuggingFace.co](https://huggingface.co).
2. Click **New Space** $\rightarrow$ choose **Docker** SDK $\rightarrow$ **Blank**.
3. Push this repository or connect GitHub.
4. Add repository secrets in Settings: `GEMINI_API_KEY`, `ADMIN_SECRET_KEY`.
5. Your API runs permanently with free HTTPS.

---

## 🧪 Post-Deployment Verification

Once your backend is live, test it with:

```bash
# Health Check
curl https://your-app-url.onrender.com/api/health

# AI Chat Triage
curl -X POST https://your-app-url.onrender.com/api/chat \
  -H "Content-Type: application/json" \
  -d '{"userMessage": "I have exam stress"}'

# Interactive Swagger Documentation
Open https://your-app-url.onrender.com/docs in your browser!
```
