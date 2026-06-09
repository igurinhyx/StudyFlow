const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;
const GEMINI_KEY = process.env.GEMINI_API_KEY;

// ============================================================
// 2. CORS RESTRITO — só aceita requisições do domínio Netlify
// ============================================================
const ALLOWED_ORIGINS = [
  'https://studyflow-br.netlify.app',
  'http://localhost:3000',
  'http://127.0.0.1:5500',
];

// Adicione aqui seu novo domínio quando renomear no Netlify:
// 'https://studyflow.netlify.app'

app.use(cors({
  origin: (origin, callback) => {
    // Permite requisições sem origin (ex: Render health check)
    if (!origin || ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Origem não permitida pelo CORS'));
    }
  }
}));

app.use(express.json({ limit: '50kb' })); // Limita tamanho do body
app.use(express.static('public'));

// ============================================================
// 3. RATE LIMITING — máx 20 req/minuto por IP
// ============================================================
const rateMap = new Map();
const RATE_LIMIT = 20;      // requisições
const RATE_WINDOW = 60000;  // 1 minuto em ms

function rateLimiter(req, res, next) {
  const ip = req.ip || req.connection.remoteAddress;
  const now = Date.now();
  const entry = rateMap.get(ip) || { count: 0, start: now };

  // Reseta janela se passou 1 minuto
  if (now - entry.start > RATE_WINDOW) {
    entry.count = 0;
    entry.start = now;
  }

  entry.count++;
  rateMap.set(ip, entry);

  if (entry.count > RATE_LIMIT) {
    return res.status(429).json({
      error: 'Muitas requisições. Aguarde um momento e tente novamente.'
    });
  }

  next();
}

// Limpa entradas antigas a cada 5 minutos (evita memory leak)
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of rateMap.entries()) {
    if (now - entry.start > RATE_WINDOW * 2) rateMap.delete(ip);
  }
}, 300000);

// Rota de saúde
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Rota principal com rate limiting aplicado
app.post('/api/chat', rateLimiter, async (req, res) => {
  if (!GEMINI_KEY) {
    return res.status(500).json({ error: 'Chave da API não configurada no servidor.' });
  }

  const { messages, system } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Campo "messages" obrigatório.' });
  }

  // Limita histórico a 30 mensagens para evitar abuso
  const limitedMessages = messages.slice(-30);

  const contents = limitedMessages.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }]
  }));

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: system || '' }] },
          contents,
          generationConfig: { maxOutputTokens: 1000 }
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: data.error?.message || 'Erro na API Gemini.' });
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Não consegui processar sua mensagem.';
    res.json({ content: [{ type: 'text', text }] });

  } catch (err) {
    console.error('Erro ao chamar a API Gemini:', err);
    res.status(500).json({ error: 'Erro interno ao contatar a IA.' });
  }
});

app.listen(PORT, () => {
  console.log(`StudyFlow backend rodando na porta ${PORT}`);
});
