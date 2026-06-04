const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;
const GEMINI_KEY = process.env.GEMINI_API_KEY;

app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use(express.static('public'));

// Rota de saúde
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Rota principal: recebe mensagens do frontend e repassa para o Gemini
app.post('/api/chat', async (req, res) => {
  if (!GEMINI_KEY) {
    return res.status(500).json({ error: 'Chave da API não configurada no servidor.' });
  }

  const { messages, system } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Campo "messages" obrigatório.' });
  }

  // Converte o histórico para o formato do Gemini
  const contents = messages.map(m => ({
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

    // Normaliza a resposta para o mesmo formato que o frontend espera
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
