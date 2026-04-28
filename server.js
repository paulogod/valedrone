import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Carrega as variáveis de ambiente do arquivo .env
dotenv.config();

const app = express();
const port = 3000;

// Configura o servidor para aceitar requisições de outras origens e em formato JSON
app.use(cors());
app.use(express.json());

// Verifica se a chave da API foi configurada
if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'sua_chave_da_api_aqui') {
    console.warn('\nAVISO: Chave da API do Gemini não configurada!');
    console.warn('Por favor, edite o arquivo .env e adicione a sua GEMINI_API_KEY.\n');
}

// Inicializa a API do Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.post('/api/chat', async (req, res) => {
    try {
        const { prompt } = req.body;

        if (!prompt) {
            return res.status(400).json({ error: 'O prompt é obrigatório.' });
        }

        // Usa o modelo recomendado para chat e geração de texto
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();

        // Envia a resposta no mesmo formato que o frontend espera (similar ao Ollama para facilitar)
        res.json({ response: responseText });

    } catch (error) {
        console.error('Erro na comunicação com a API do Gemini:', error);
        res.status(500).json({ error: 'Erro ao gerar resposta da IA. Verifique sua chave da API.' });
    }
});

app.listen(port, () => {
    console.log(`Servidor rodando na porta ${port}`);
    console.log(`Endpoint de chat disponível em http://localhost:${port}/api/chat`);
});
