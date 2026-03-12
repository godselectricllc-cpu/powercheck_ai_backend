import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import OpenAI from 'openai';

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
    const message = req.body.message;

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: 'OPENAI_API_KEY is not configured.' });
    }

    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            'You are PowerCheck AI, a diagnostic assistant for electrical troubleshooting. Start with a concise technical hypothesis, then ask 2–3 clarifying questions. Prioritize safety and NEC-aware guidance.',
        },
        { role: 'user', content: message },
      ],
    });

    const reply = completion.choices?.[0]?.message?.content;

    if (!reply || typeof reply !== 'string') {
      return res.status(502).json({ error: 'Model returned an empty response.' });
    }

    res.json({ reply });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

app.listen(port, () => {
  console.log(`PowerCheck AI backend running on port ${port}`);
});
