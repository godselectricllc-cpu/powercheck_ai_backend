require('dotenv').config();

const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');

const app = express();
const port = Number(process.env.PORT || 8080);

app.use(cors());
app.use(express.json());

const client = new OpenAI({
	apiKey: process.env.OPENAI_API_KEY,
});

app.get('/health', (_req, res) => {
	res.json({ ok: true });
});

app.post('/diagnose', async (req, res) => {
	try {
		const { message } = req.body || {};

		if (!message || typeof message !== 'string') {
			return res.status(400).json({ error: 'message is required.' });
		}

		if (!process.env.OPENAI_API_KEY) {
			return res.status(500).json({ error: 'OPENAI_API_KEY is not configured.' });
		}

		const response = await client.chat.completions.create({
			model: 'gpt-4o-mini',
			messages: [
				{
					role: 'system',
					content:
						'You are PowerCheck AI, a diagnostic assistant for electrical troubleshooting. Start with a concise technical hypothesis, then ask 2-3 clarifying questions to validate diagnosis. Prioritize safety and NEC-aware guidance. Never suggest unsafe live-circuit work.',
				},
				{ role: 'user', content: message },
			],
		});

		const reply = response.choices?.[0]?.message?.content;
		if (!reply || typeof reply !== 'string') {
			return res.status(502).json({ error: 'Model returned an empty response.' });
		}

		return res.json({ reply });
	} catch (error) {
		console.error('Diagnose error:', error);
		return res.status(500).json({ error: 'Server error' });
	}
});

app.listen(port, () => {
	console.log(`powercheck_ai_backend listening on port ${port}`);
});
