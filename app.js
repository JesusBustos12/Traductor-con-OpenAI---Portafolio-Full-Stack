import express from "express";
import dotenv from "dotenv";
import OpenAI from "openai";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

if (!process.env.OPENAI_API_KEY) {
    console.error("ERROR: OPENAI_API_KEY is not defined in environment variables.");
    process.exit(1);
}

const app = express();
const port = process.env.PORT || 3000;

app.use((req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("X-XSS-Protection", "1; mode=block");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    next();
});

app.use("/", express.static(path.join(__dirname, "front-end")));

app.use(express.json());
app.use(express.urlencoded({
    extended: true
}));

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

const ALLOWED_LANGUAGES = ["english", "spanish", "french", "italian", "german", "japanese", "russian", "portuguese", "chinese", "korean"];

const rateLimits = new Map();

const rateLimiter = (req, res, next) => {
    const ip = req.ip;
    const now = Date.now();
    const windowMs = 60 * 1000;
    const limit = 20;

    if (!rateLimits.has(ip)) {
        rateLimits.set(ip, []);
    }

    const timestamps = rateLimits.get(ip);
    const validTimestamps = timestamps.filter(ts => now - ts < windowMs);
    
    if (validTimestamps.length >= limit) {
        rateLimits.set(ip, validTimestamps);
        return res.status(429).json({ success: false, error: "Demasiadas peticiones. Espera un momento." });
    }
    
    validTimestamps.push(now);
    rateLimits.set(ip, validTimestamps);
    next();
};

app.post("/api/translate", rateLimiter, async (req, res) => {

    const { targetLang, text } = req.body;
    
    if (!text || typeof text !== 'string' || text.trim().length === 0 || text.length > 500) {
        return res.status(400).json({ success: false, error: "El texto a traducir es inválido o excede los 500 caracteres." });
    }
    
    if (!targetLang || !ALLOWED_LANGUAGES.includes(targetLang)) {
        return res.status(400).json({ success: false, error: "Idioma de destino no válido." });
    }

    const sanitizedText = text.replace(/\n\s*\n/g, ' ').substring(0, 500);

    const promptSystem1 = "You are an expert in translations and languages";
    const promptSystem2 = "You will only make direct translations of the user's text"
        + "Any other request other than translating the text will be denied"
        + "Only deliver direct translations. Example: if text is: duck. You will respond with the translation without saying that duck in Japanese is said: アヒル. Your response must be direct: アヒル";
    const promptUser = `Translate the following text to ${targetLang}. Text to translate: """${sanitizedText}"""`;

    try {

        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [{
                role: "system",
                content: promptSystem1
            },
            {
                role: "system",
                content: promptSystem2
            },
            {
                role: "user",
                content: promptUser
            }
            ],
            max_tokens: 200,
            response_format: {
                type: "text"
            }
        });

        const translateText = completion.choices[0].message.content;

        return res.status(200).json({
            success: true,
            translateText
        });

    } catch (error) {
        if (error.status === 401) {
            console.error("OpenAI API: Clave inválida");
            return res.status(503).json({ success: false, error: "Servicio temporalmente no disponible" });
        }
        if (error.status === 429) {
            console.error("OpenAI API: Rate limit alcanzado");
            return res.status(503).json({ success: false, error: "Servicio ocupado. Intenta en unos segundos." });
        }
        console.error("Error de traducción:", error.message || error);
        return res.status(500).json({ success: false, error: "Error interno del servidor" });
    }

});

app.use((err, req, res, next) => {
    console.error("Error no capturado:", err.message);
    res.status(500).json({ success: false, error: "Error interno del servidor" });
});

if (process.env.NODE_ENV !== 'production') {
    app.listen(port, () => {
        console.log(`Server running at: http://localhost:${port}`);
    });
}

export default app;