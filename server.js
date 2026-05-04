const fetch = require('node-fetch');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const CALLMEBOT_API_KEY = process.env.CALLMEBOT_API_KEY;
const PHONE = process.env.PHONE;

app.post('/api/send-sms', async (req, res) => {
    const { message } = req.body;
    const url = `https://api.callmebot.com/sms/send?phone=${PHONE}&text=${encodeURIComponent(message)}&apikey=${CALLMEBOT_API_KEY}`;
    try {
        const response = await fetch(url);
        const data = await response.json();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to send SMS' });
    }
});

// Other existing server.js code...
