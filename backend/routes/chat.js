// routes/chat.js
require('dotenv').config();             // Charge .env

const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();

const { MongoClient } = require('mongodb');
const { OpenAI } = require('openai');
const { MongoDBAtlasVectorSearch } = require('@langchain/mongodb');
const { OpenAIEmbeddings } = require('@langchain/openai');

// 1) Initialise OpenAI
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// 2) Initialise et connecte le vectorStore
let vectorStore;
(async function initVectorStore() {
  try {
    const client = new MongoClient(process.env.MONGO_URI);
    await client.connect();
    console.log('✅ MongoDB client connecté');

    const db = client.db('task_manager');
    const coll = db.collection('code_chunks');

    const embedder = new OpenAIEmbeddings({ openAIApiKey: process.env.OPENAI_API_KEY });
    vectorStore = new MongoDBAtlasVectorSearch(embedder, {
      collection: coll,
      indexName: 'vector_index',
      textKey: 'pageContent',
      embeddingKey: 'embedding',
      primaryKey: '_id',
    });

    console.log('✅ Vector Store prêt');
  } catch (err) {
    console.error('❌ Erreur initVectorStore:', err);
  }
})();

// Route /api/chat
router.post('/', async (req, res) => {
  try {
    const { message, history = [] } = req.body;
    if (!vectorStore) {
      return res.status(503).json({ error: 'Vector Store non prêt, patientez quelques instants' });
    }

    // 3) Recherche des 5 meilleurs chunks
    const docs = await vectorStore.similaritySearch(message, 5);
    const context = docs.map(d => d.pageContent).join('\n---\n');

    // 4) Charger le README.md au niveau de la racine du repo
    const readmePath = path.resolve(__dirname, '../../README.md');
    let readmeContent = '';
    try {
      readmeContent = fs.readFileSync(readmePath, 'utf8');
    } catch (err) {
      console.warn('⚠️ README non trouvé ou illisible à', readmePath, err.message);
    }

    // 5) Prépare les messages, en injectant le contenu du README en premier
    const messages = [];
    if (readmeContent) {
      messages.push({ role: 'system', content: `CONTEXTE GLOBAL DU PROJET (lire README.md) :\n${readmeContent}` });
    }
    messages.push(
      { role: 'system', content: 'Tu es un assistant expert en code JavaScript/TypeScript/React/Node.js.' },
      { role: 'system', content: `Extraits pertinents :\n${context}` },
      ...history,
      { role: 'user', content: message }
    );

    // 6) Appel à GPT-4.1
    const completion = await openai.chat.completions.create({
      model: 'gpt-4.1',
      messages
    });

    return res.json({ reply: completion.choices[0].message.content });
  } catch (err) {
    console.error('Erreur chat:', err);
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
