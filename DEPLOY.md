# 🚀 Deploying ScholarGo from Playground

Yes, you can deploy directly from this folder! Follow these steps in your terminal.

## Option 1: Vercel (Recommended)
This is the best option because it supports the environment variables we need for the API key.

1.  **Login to Vercel**:
    ```bash
    npx vercel login
    ```
    *   Follow the instructions to log in via your browser.

2.  **Deploy**:
    ```bash
    npx vercel
    ```
    *   Set up and deploy? **Y**
    *   Which scope? (Select your username)
    *   Link to existing project? **N**
    *   Project name? **scholargo** (or leave default)
    *   Directory? **./** (leave default)
    *   Want to modify settings? **N**

3.  **Add API Key**:
    *   Go to the link Vercel gives you (Project Settings).
    *   Go to **Settings** -> **Environment Variables**.
    *   Add: `VITE_GEMINI_API_KEY` with your key value.
    *   **Redeploy** (or run `npx vercel --prod` in terminal) for it to take effect.

## Option 2: Netlify (Alternative)
1.  Run `npx netlify deploy`.
2.  Follow the login steps.
3.  Set the publish directory to `dist`.
