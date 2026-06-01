# 🎬 CineMatch AI: Neural Film Recommendation Platform & Cognitive Search Engine

[![React](https://img.shields.io/badge/Front_End-React_19_&_Vite-000000?style=for-the-badge&logo=react)](https://react.dev)
[![NodeJS](https://img.shields.io/badge/Back_End-Express_&_TypeScript-000000?style=for-the-badge&logo=node.js)](https://nodejs.org)
[![Python Engine](https://img.shields.io/badge/ML_Engine-Scikit--Learn_&_Pandas-000000?style=for-the-badge&logo=python)](https://python.org)
[![Gemini](https://img.shields.io/badge/Cognitive_LLM-Gemini_3.5_Flash-E50914?style=for-the-badge&logo=googlegemini)](https://ai.google.dev)

CineMatch AI is a premium, state-of-the-art dual-architecture (TypeScript + React and Python Streamlit) movie recommendation engine that turns film metadata analysis, directorship tags, scoring indices, and narrative arcs into an immersive, subscription-grade streaming experience.

Unlike primitive student recommendation lists, **CineMatch AI** simulates the sophisticated algorithms of premium networks like Netflix, enriched by customizable content similarity, mood controllers, and live AI critical breakdown via Google Gemini models.

---

## 🎨 Immersive Design Philosophy & Core Aesthetics

Our design philosophy centers on **architectural premiumism**:
*   **The Cinematic Deep Dark Canvas**: Styled entirely in pitch-blacks, luxurious grays, and glowing Netflix-red gradients (`#E50914`) to optimize visual focus.
*   **Neural Glassmorphism**: Cards, search bars, and floating detail panels utilize translucent backdrops paired with subtle glowing borders.
*   **Audio Synthesis Theater**: Built-in sound oscillators synthesize relaxing ambient sci-fi sound waves directly via the Web Audio API when previewing films!
*   **Data Science Bento**: Responsive SVG analytics and Plotly charts map database parameters with high-resolution visual feedback.

---

## ⚡ Core Platform Capabilities

### 1. Multi-Vector Cognitive Discovery
Combine **four distinct similarity dimensions** simultaneously:
*   **Cosine Similarity Matching**: Computes mathematical distances between movie feature words (director, cast overlap, keywords, genre tags, and plot descriptions).
*   **Relevance Tuning Seeds**: Instantly set any movie card as an active neural anchor to realign the entire recommendation deck around its stylistic motif.
*   **Active Mood Controllers**: Dynamically weight movie features based on emotional states (😄 Happy, 😢 Sad, ⚡ Motivated, 🔥 Excited, 🥺 Emotional, 🍃 Relaxed).
*   **Hard Category Constraints**: Refine your matches with structural genre overlays.

### 2. Conversational Film Critic Subroutine (Gemini AI Chat)
Consult a master AI critic leveraging the **Gemini 3.5 Flash** model. CineMatch AI analyses:
*   Complex thematic nuances (e.g., *"Suggest a mind-bending dystopian thriller with low-light neon lighting and a bleak ending"*).
*   In-chat overlay recommendation buttons that let you watch, watchlist, or seed discussed movies in a single click!

### 3. Machine Learning Analytics Lab
Examine catalog trends on beautiful interactive dashboards:
*   **Genre Frequency Matrices**: Horizontal neon bar distribution charts.
*   **Critic Metric Densities**: High-resolution rating distributions.
*   **Director Core Sovereignties**: Ranks of top auteurs based on critical score averages.

---

## 🪐 Multi-Stack Architecture & Workspaces

The platform is designed as an all-in-one showpiece with **two distinct operational environments**:

### Primary Architecture: Full-Stack React + Node (Express)
Perfect for production Clour Run deployment or local Node servers:
```
├── server.ts                  # Express.js production back-end and Gemini AI endpoint
├── package.json               # Full-stack NPM script manager and bundling configs
├── src/
│   ├── App.tsx                # Premium React 19 Client Dashboard, Audio Synths, and Chat UI
│   ├── main.tsx               # Main entrypoint
│   ├── types.ts               # Complete type safety interfaces
│   ├── data/
│   │   └── movies.ts          # Curated database metadata and mood matrices
│   └── utils/
│       └── recommender.ts     # Content similarity mathematical vector algorithms in TS
```

### Companion Architecture: Python Streamlit
Designed for lightning-fast ML demos, Streamlit Cloud, or Hugging Face spaces:
```
├── app.py                     # Streamlit platform front-end UI and Plotly dashboard
├── recommendation_engine.py  # TF-IDF vectorizer and Cosine Similarity analyzer
├── requirements.txt           # Python package requirements
```

---

## 🛠️ Step-by-Step Installation & Deployment

### Run the Primary React + Node.js Full-Stack App
1.  **Clone the workspace** locally.
2.  **Define your credentials** in a `.env` file at the root:
    ```env
    GEMINI_API_KEY="YOUR_OFFICIAL_GEMINI_API_KEY"
    ```
3.  **Install dependencies**:
    ```bash
    npm install
    ```
4.  **Run in Developer mode**:
    ```bash
    npm run dev
    ```
5.  **Build and Run in Production mode**:
    ```bash
    npm run build
    npm run start
    ```

### Run the Companion Python Streamlit App
1.  **Ensure you have Python 3.10+ installed**.
2.  **Install package requirements**:
    ```bash
    pip install -r requirements.txt
    ```
3.  **Boot the Streamlit web app**:
    ```bash
    streamlit run app.py
    ```

---

## 📊 ContentVector Algorithm Representation

$$\text{Similarity}(A, B) = \frac{\mathbf{A} \cdot \mathbf{B}}{\|\mathbf{A}\| \|\mathbf{B}\|} = \frac{\sum_{i=1}^{n} A_i B_i}{\sqrt{\sum_{i=1}^{n} A_i^2} \sqrt{\sum_{i=1}^{n} B_i^2}}$$

In **CineMatch OS**, the TF-IDF feature bag $\mathbf{A}$ is constructed with intentional weighted biases:
$$\mathbf{A} = \{ \text{Title} \} + 2 \times \{ \text{Genres} \} + 1.5 \times \{ \text{Keywords} \} + \{ \text{Director} \} + \{ \text{Cast} \} + \{ \text{Plot Description} \}$$

---

## 🔮 Future Roadmap Plans
*   **Collaborative Graph Database Overlay**: Integrating hybrid user rating inputs.
*   **TMDB API Media Crawler**: Automatic back-drops, poster, and trailer video lookups.
*   **Cinematic Audio Tone Analyzer**: Feeding actual background scores into the similarity profile.

---

## 🤝 Contributing
Contributions are absolutely welcome! Please feel free to open a Pull Request or request extra feature matrices.

*Crafted with absolute attention to detail and cinematic passion.*
