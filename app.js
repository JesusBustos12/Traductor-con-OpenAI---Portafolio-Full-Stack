import express from "express";
import dotenv from "dotenv";
import OpenAI from "openai";
import path from "path";
import { fileURLToPath } from "url";
import mysql from "mysql2/promise";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

if (!process.env.OPENAI_API_KEY) {
    console.error("ERROR: OPENAI_API_KEY is not defined in environment variables.");
    process.exit(1);
}

const pool = mysql.createPool({
    uri: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: true
    }
});

const MAX_TRANSLATIONS = 20;

// Initialize table if it doesn't exist
pool.query(`
    CREATE TABLE IF NOT EXISTS user_translations (
        ip_address VARCHAR(45) PRIMARY KEY,
        translation_count INT DEFAULT 0,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
`).catch(err => console.error("Error creating table:", err));

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

const rateLimiter = async (req, res, next) => {
    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    try {
        const [rows] = await pool.query(`
            SELECT IF(TIMESTAMPDIFF(HOUR, updated_at, CURRENT_TIMESTAMP) >= 24, 0, translation_count) as active_count 
            FROM user_translations 
            WHERE ip_address = ?
        `, [ip]);
        
        let currentCount = 0;
        if (rows.length > 0) {
            currentCount = rows[0].active_count;
        }

        if (currentCount >= MAX_TRANSLATIONS) {
            return res.status(429).json({ success: false, error: "Has alcanzado el límite máximo de 20 traducciones." });
        }
        
        next();
    } catch (dbError) {
        console.error("Error al consultar TiDB:", dbError);
        return res.status(500).json({ success: false, error: "Error interno del servidor al verificar límites." });
    }
};

app.get("/api/limit", async (req, res) => {
    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    try {
        const [rows] = await pool.query(`
            SELECT IF(TIMESTAMPDIFF(HOUR, updated_at, CURRENT_TIMESTAMP) >= 24, 0, translation_count) as active_count 
            FROM user_translations 
            WHERE ip_address = ?
        `, [ip]);
        
        let currentCount = 0;
        if (rows.length > 0) {
            currentCount = rows[0].active_count;
        }

        return res.status(200).json({ 
            success: true, 
            limit: MAX_TRANSLATIONS,
            remaining: Math.max(0, MAX_TRANSLATIONS - currentCount)
        });
    } catch (error) {
        return res.status(500).json({ success: false, remaining: 0 });
    }
});

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

        let newCount = 1;
        try {
            const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
            await pool.query(`
                INSERT INTO user_translations (ip_address, translation_count, updated_at) 
                VALUES (?, 1, CURRENT_TIMESTAMP) 
                ON DUPLICATE KEY UPDATE 
                    translation_count = IF(TIMESTAMPDIFF(HOUR, updated_at, CURRENT_TIMESTAMP) >= 24, 1, translation_count + 1),
                    updated_at = CURRENT_TIMESTAMP
            `, [ip]);
            const [rows] = await pool.query(`SELECT translation_count FROM user_translations WHERE ip_address = ?`, [ip]);
            if (rows.length > 0) newCount = rows[0].translation_count;
        } catch (dbError) {
            console.error("Error al actualizar límite en TiDB:", dbError);
        }

        return res.status(200).json({
            success: true,
            translateText,
            remaining: Math.max(0, MAX_TRANSLATIONS - newCount)
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