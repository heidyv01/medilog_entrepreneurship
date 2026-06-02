import express from "express";
import path from "path";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";

let aiInstance: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (aiInstance) return aiInstance;
  const key = process.env.GEMINI_API_KEY;
  if (!key || key === "MY_GEMINI_API_KEY" || key.trim() === "") {
    throw new Error("GEMINI_API_KEY is not configured in environment secrets.");
  }
  aiInstance = new GoogleGenAI({
    apiKey: key,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
  return aiInstance;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Set payload size limits for image uploads
  app.use(express.json({ limit: "20mb" }));
  app.use(express.urlencoded({ extended: true, limit: "20mb" }));

  // API 1: Document/Form Scanner via Gemini Vision
  app.post("/api/scan", async (req, res) => {
    try {
      const { base64, mimeType } = req.body;
      if (!base64) {
        return res.status(400).json({ error: "No image base64 data provided" });
      }

      // Lazy load Gemini Client
      let aiClient;
      try {
        aiClient = getGeminiClient();
      } catch (err: any) {
        console.warn("Gemini client configuration failed:", err.message);
        // Fallback for demo when API key is missing
        return res.json({
          warning: "Demo-Modus aktiv (Kein API-Key konfiguriert). Bitte legen Sie Ihren GEMINI_API_KEY in den Einstellungen an.",
          nachname: "Mustermann",
          vorname: "Max",
          geburtsdatum: "1980-05-15",
          geschlecht: "Männlich",
          krankenkasse: "AOK Plus",
          hauptbeschwerde: "Brustschmerz",
          verlauf: "Akuter retrosternaler Druckschmerz seit ca. 45 Minuten, kaltschweißig, NRS 8/10.",
          vorerkrankungen: "Hypertonie, Hypercholesterinämie",
          medikamente: "Ramipril, Atorvastatin",
          allergien: "Keine",
          blutdruck: "155/95",
          puls: "92",
          temperatur: "36.8"
        });
      }

      const prompt = `Du bist ein hochentwickelter medizinischer Dokumentationsassistent. 
Lies dieses eingescannte medizinische Dokument (z.B. Einweisungsformular, Notarztprotokoll, Befundbericht, Laborblatt, Rezept) aufmerksam aus.
Extrahiere alle medizinischen und personenbezogenen Informationen und strukturiere sie genau in der folgenden JSON-Struktur. 
Antworte AUSSCHLIESSLICH mit validem JSON, ohne Markdown-Formatierung um das JSON (kein \`\`\`json, kein Text davor oder danach).

JSON-Struktur:
{
  "nachname": "Nachname aus dem Dokument oder leer",
  "vorname": "Vorname oder leer",
  "geburtsdatum": "Geburtsdatum im Format YYYY-MM-DD oder leer",
  "geschlecht": "Männlich oder Weiblich oder Divers oder leer",
  "krankenkasse": "Name der Versicherung (z.B. TK, AOK, privat) oder leer",
  "hauptbeschwerde": "Die primäre Beschwerde bzw. Symptomatik oder leer",
  "verlauf": "Symptomatischer Verlauf, Anamnesedaten, Unfallhergang o.ä. oder leer",
  "vorerkrankungen": "Liste der Vorerkrankungen durch Kommas getrennt oder leer",
  "medikamente": "Liste von bekannten Dauermedikamenten oder leer",
  "allergien": "Bekannte Allergien (z.B. Penicillin) oder leer",
  "blutdruck": "z.B. 120/80 oder leer",
  "puls": "Pulsfrequenz (Zahl) oder leer",
  "temperatur": "Körpertemperatur (z.B. 37.5) oder leer"
}`;

      const response = await aiClient.models.generateContent({
        model: "gemini-3.5-flash",
        contents: [
          {
            inlineData: {
              mimeType: mimeType || "image/jpeg",
              data: base64,
            },
          },
          { text: prompt },
        ],
        config: {
          responseMimeType: "application/json",
          temperature: 0.1,
        },
      });

      const responseText = response.text || "{}";
      const cleaned = responseText.replace(/```json|```/g, "").trim();
      
      try {
        const parsed = JSON.parse(cleaned);
        res.json(parsed);
      } catch (parseError) {
        console.error("Failed to parse Gemini output as JSON:", responseText);
        res.status(500).json({ error: "Fehler beim Strukturieren der Daten", raw: responseText });
      }
    } catch (error: any) {
      console.error("API Error during form scan:", error);
      res.status(500).json({ error: "Fehler beim Verarbeiten des Dokuments: " + error.message });
    }
  });

  // API 2: Refine Rough Dictation / Voice Inputs into Clinical Medical German Jargon
  app.post("/api/refine", async (req, res) => {
    try {
      const { text, context } = req.body;
      if (!text) {
        return res.status(400).json({ error: "No text to refine was provided" });
      }

      // Lazy load Gemini Client
      let aiClient;
      try {
        aiClient = getGeminiClient();
      } catch (err: any) {
        console.warn("Gemini client configuration failed:", err.message);
        // Fallback refinement when API key is missing
        return res.json({
          text: `[Refined Draft (Demo)] ${text}\n(Hinweis: Bitte legen Sie Ihren GEMINI_API_KEY in AI Studio secrets fest für echtes klinisches Jargon-Diktat.)`,
        });
      }

      const prompt = `Du bist ein deutscher Chefarzt und klinischer Dokumentationsprofi.
Formuliere die folgenden ungeordneten, umgangssprachlich diktierten stichpunktartigen Notizen eines Pflegers oder Arztes in hochprofessionelles, präzises deutsches medizinisches Fachjargon (Klinikjargon) um.
Verwende korrekte medizinische Fachbegriffe (z.B. 'akutes Abdomen', 'retrosternaler Thoraxschmerz', 'Dyspnoe', 'hypertensive Entgleisung', 'neuroleptische Medikation').
Halte dich exakt an die Fakten im Diktat, füge keine fiktiven Befunde hinzu, sondern strukturiere und veredle den Text für den offiziellen Entlassungsbrief oder die Krankenakte.
Der Kontext oder Fachbereich ist: ${context || "Allg. Notaufnahme / Innere Medizin"}.

Ungeordnete Vorgabe:
"${text}"

Formuliertes medizinisches Jargon (gibt nur den ausgearbeiteten Text zurück, keine Erklärungen oder Meta-Kommentare):`;

      const response = await aiClient.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          temperature: 0.2,
        },
      });

      res.json({ text: response.text?.trim() });
    } catch (error: any) {
      console.error("API Error during medical text refining:", error);
      res.status(500).json({ error: "Fehler beim Verfeinern des Diktats: " + error.message });
    }
  });

  // Serve static files / Vite asset handlers
  if (process.env.NODE_ENV !== "production") {
    console.log("Serving application in Development Mode with Vite HMR disabled proxy.");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Serving application in Production Mode.");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`MediLog Full-Stack Server listening at http://localhost:${PORT}`);
  });
}

startServer();
