import express from "express";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use("/", express.static("front-end"));

app.use(express.json());
app.use(express.urlencoded({
    extended: true
}));

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

app.post("/api/translate", async (req, res) => {

    const { targetLang, text } = req.body;
    const promptSystem1 = "You are an expert in translations and languages";
    const promptSystem2 = "You will only make direct translations of the user's text"
        + "Any other request other than translating the text will be denied"
        + "Only deliver direct translations. Example: if text is: duck. You will respond with the translation without saying that duck in Japanese is said: アヒル. Your response must be direct: アヒル";
    const promptUser = `Translate this text ${targetLang}: ${text}`;

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
            max_tokens: 40,
            response_format: {
                type: "text"
            }
        });

        const translateText = completion.choices[0].message.content;

        return res.status(200).json({
            translateText
        });

    } catch (exception) {
        console.log(exception);
        return res.status(500).json({
            exception: "Error when translating"
        });
    }

});

app.listen(port, () => {
    console.log("Your server is starting at: http://localhost" + port);
});