import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from the root directory
app.use(express.static('.'));

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const CALLMEBOT_API_KEY = process.env.CALLMEBOT_API_KEY;
const PHONE = process.env.PHONE;

// Check if keys are set
if (!GEMINI_API_KEY || GEMINI_API_KEY === 'sua_chave_da_api_aqui') {
    console.warn('\nWARNING: Gemini API Key is not configured!');
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// Chat Endpoint
app.post('/api/chat', async (req, res) => {
    try {
        const { prompt } = req.body;
        if (!prompt) {
            return res.status(400).json({ error: 'Prompt is required.' });
        }

        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const result = await model.generateContent(prompt);
        const responseText = result.response.text();

        res.json({ response: responseText });
    } catch (error) {
        console.error('Gemini API Error:', error);
        res.status(500).json({ error: 'Error generating AI response.' });
    }
});

// SMS / WhatsApp Endpoint
app.post('/api/send-sms', async (req, res) => {
    const { message } = req.body;
    
    if (!CALLMEBOT_API_KEY || !PHONE) {
        return res.status(500).json({ error: 'CallMeBot config missing in .env' });
    }

    const url = `https://api.callmebot.com/whatsapp.php?phone=${PHONE}&text=${encodeURIComponent(message)}&apikey=${CALLMEBOT_API_KEY}`;
    
    try {
        // fetch is global in Node 18+
        const response = await fetch(url);
        // CallMeBot usually returns plain text, so we handle it gracefully
        const text = await response.text();
        res.json({ success: true, response: text });
    } catch (error) {
        console.error('CallMeBot Error:', error);
        res.status(500).json({ error: 'Failed to send WhatsApp message' });
    }
});

app.listen(port, () => {
    console.log(`Servidor rodando na porta ${port}`);
    console.log(`Acesse http://localhost:${port} para ver o site.`);
});
