# StudyFlow — Guia de Deploy no Render (com Gemini gratuito)

## Estrutura do projeto

```
studyflow-project/
├── server.js          ← backend Node.js (proxy seguro para a API)
├── package.json       ← dependências
├── .gitignore
├── README.md
└── public/
    └── studyflow.html ← frontend
```

---

## Passo 1 — Obter a chave gratuita do Gemini

1. Acesse **aistudio.google.com**
2. Faça login com sua conta Google
3. Clique em **Get API Key** → **Create API Key**
4. Copie a chave gerada (começa com `AIza...`)

---

## Passo 2 — Subir no GitHub

1. Acesse github.com e crie um repositório chamado `studyflow`
2. Faça upload de todos os arquivos desta pasta (incluindo a pasta `public/`)
3. Confirme o commit

---

## Passo 3 — Deploy no Render

1. Acesse **render.com** e entre com GitHub
2. Clique em **New → Web Service**
3. Selecione o repositório `studyflow`
4. Configure:
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Instance Type:** Free
5. Em **Environment Variables** adicione:
   - **Key:** `GEMINI_API_KEY`
   - **Value:** sua chave do Google (AIza...)
6. Clique em **Deploy Web Service**
7. Aguarde 1-2 min e copie a URL gerada (ex: `https://studyflow-xxx.onrender.com`)

---

## Passo 4 — Conectar o frontend

Abra `public/studyflow.html`, encontre esta linha e substitua pela sua URL do Render:

```js
window.STUDYFLOW_API = 'https://SEU-SERVIDOR.onrender.com';
```

Salve, faça commit e push. O Render redeploya automaticamente.

---

## Passo 5 — Publicar o frontend no Netlify

1. Acesse **netlify.com**
2. Arraste a pasta `public/` para a área de drop
3. Pronto — você recebe uma URL pública para compartilhar!
