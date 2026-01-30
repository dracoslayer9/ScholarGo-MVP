# 🚀 Launching ScholarGo
You are ready to launch! Here is how to power the app with Gemini and deploy it for the world to see.

## 1. Powering with Gemini (Real AI)
The code is already set up to use the **Gemini 1.5 Pro** model. You just need an API Key.

1.  **Get your API Key**:
    *   Go to [Google AI Studio](https://aistudio.google.com/).
    *   Click "Get API key" and create a new key.

2.  **Add it to your project**:
    *   Create a file named `.env` in the root folder (`/quantum-satellite`).
    *   Add this line:
        ```env
        VITE_GEMINI_API_KEY=your_copied_api_key_here
        ```
    *   Restart your dev server (`npm run dev`). The app will now use real AI analysis!

## 2. Deploying to the World (Vercel)
The easiest way to launch is using **Vercel**.

1.  **Create a GitHub Repository**:
    *   Push your code to a new GitHub repository.

2.  **Deploy on Vercel**:
    *   Go to [Vercel.com](https://vercel.com) and sign up/login.
    *   Click "Add New..." -> "Project".
    *   Import your `ScholarGo` repository.
    *   **IMPORTANT**: In the "Environment Variables" section, add:
        *   Name: `VITE_GEMINI_API_KEY`
        *   Value: `your_copied_api_key_here`
    *   Click **Deploy**.

Within minutes, you will have a live URL (e.g., `scholargo.vercel.app`) to share with users!
