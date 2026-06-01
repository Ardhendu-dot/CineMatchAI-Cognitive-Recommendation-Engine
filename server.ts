import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

// Ensure workspace relative paths are set correctly
const PORT = 3000;
const app = express();

app.use(express.json());

// Load movies server-side for recommendation endpoints
import { movies } from "./src/data/movies";
import { getRecommendations, getAnalyticsData } from "./src/utils/recommender";

// Lazy initialize Gemini AI client to avoid startup crashes if key is omitted
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      console.warn("WARNING: GEMINI_API_KEY environment variable is not defined. AI Chat and descriptions will degrade elegantly.");
      throw new Error("GEMINI_API_KEY is not defined. Please configure it in Settings > Secrets.");
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// REST APIs
// 1. Get raw movie list
app.get("/api/movies", (req, res) => {
  res.json({ movies });
});

// 2. Custom mathematical content recommendations
app.post("/api/recommend", (req, res) => {
  const { favoriteMovieIds = [], genreFilters = [], moodFilter, searchText = "" } = req.body;
  const recommended = getRecommendations(favoriteMovieIds, genreFilters, moodFilter, searchText);
  res.json({ movies: recommended });
});

// 3. Analytics endpoints
app.get("/api/analytics", (req, res) => {
  try {
    const data = getAnalyticsData();
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 4. AI Movie Assistant Chat powered by Gemini 3.5 Flash
app.post("/api/chat", async (req, res) => {
  const { messages = [], latestMessage = "" } = req.body;

  try {
    const ai = getGeminiClient();
    
    // Construct movies quick reference metadata to pass to Gemini
    const movieRefs = movies.map(m => ({
      id: m.id,
      title: m.title,
      genres: m.genres,
      director: m.director,
      tagline: m.tagline,
      overview: m.overview
    }));

    // Craft system instruction forcing the movie assistant context and strict JSON schema output matching our interfaces
    const systemPrompt = `You are CineMatch AI, an elite, highly sophisticated cinematic advisor and movies analyst with deep artistic, technical, and storytelling insights.
Your tone is futuristic, professional, and evocative (similar to a premium science fiction interfaces like Jarvis or a high-end cinephile platform).

We have an active in-app movie database of curated masterpieces. You MUST recommend movies from this database whenever possible.
Here is the official database of movies available:
${JSON.stringify(movieRefs)}

Respond strictly in JSON format matching this schema:
{
  "message": "Write a highly stylish, cinematically rich response (can use Markdown highlights) discussing their request, offering tailored cinematic reviews, and introducing your recommendations with elegant film theory terms (e.g. 'cinematography', 'tonal motifs', 'narrative kineticism'). Keep it under 250 words.",
  "suggestedMovieIds": ["movie-id-1", "movie-id-2"] // List of matching movie IDs from the provided database. MUST be a strict array of valid IDs from: ${JSON.stringify(movies.map(m => m.id))}. If no direct database movies match, include 1 or 2 closest ones or leave empty.
}

Conversation context:
${messages.map((m: any) => `${m.sender.toUpperCase()}: ${m.text}`).join("\n")}
LATEST USER QUERY: "${latestMessage}"`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: latestMessage,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            message: {
              type: Type.STRING,
              description: "The film expert messaging content in markdown format."
            },
            suggestedMovieIds: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Array of recommended movie IDs precisely matching the database IDs."
            }
          },
          required: ["message", "suggestedMovieIds"]
        }
      }
    });

    const bodyText = response.text || "{}";
    const data = JSON.parse(bodyText);
    res.json(data);

  } catch (err: any) {
    console.error("Gemini assistant error:", err);
    // Graceful fallback if Gemini API is not available/configured
    res.json({
      message: `CineMatch Subroutine offline (No API Connection). However, our local math engine suggests exploring our catalog of sci-fi, horror, or drama thrillers on the main dashboard!`,
      suggestedMovieIds: ["inception", "interstellar", "the-matrix"].slice(0, 2)
    });
  }
});

// 5. Cinematic Explanation: Dynamic movie synergy descriptions
app.post("/api/recommend/explain", async (req, res) => {
  const { chosenMovieTitles = [], targetMovieTitle = "" } = req.body;

  if (chosenMovieTitles.length === 0 || !targetMovieTitle) {
    return res.json({ explanation: "Highly matched based on shared thematic motifs and matching director attributes." });
  }

  try {
    const ai = getGeminiClient();
    
    const prompt = `Explain in a single evocative, atmospheric, 1-2 sentence cinematic review why "${targetMovieTitle}" is recommended for a subscriber who loves: ${chosenMovieTitles.join(", ")}. Use advanced cinematic terms. Do not include introductory phrases like "Here is the explanation...".`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        temperature: 0.8
      }
    });

    res.json({ explanation: response.text?.trim() || "Shares rich genre dynamics and stylistic signatures." });
  } catch (err) {
    res.json({ explanation: `Highly recommended due to deep overlap in genre architecture, script motifs, and visual direction signature.` });
  }
});

// Configure Vite middleware in development vs static serving in production
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting server in development mode...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting server in production mode...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`CineMatch AI Server actively listening on http://localhost:${PORT}`);
  });
}

startServer();
