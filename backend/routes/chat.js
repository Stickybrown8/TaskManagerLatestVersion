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

// Fonction pour traiter les data URLs d'images
function prepareImageForGPT4Vision(dataURL) {
  if (!dataURL) return null;
  
  // Vérifier si c'est déjà une data URL correcte
  if (dataURL.startsWith('data:image/')) {
    // Nous utiliserons la data URL telle quelle
    console.log('📸 Image au format data URL détectée');
    return dataURL;
  }
  
  // Si c'est une URL HTTP, la retourner directement
  if (dataURL.startsWith('http://') || dataURL.startsWith('https://')) {
    console.log('📸 Image au format URL Web détectée');
    return dataURL;
  }
  
  // Si ce n'est ni une data URL ni une URL Web, c'est probablement un format non supporté
  console.warn('⚠️ Format d\'image non reconnu');
  return null;
}

// Route /api/chat
router.post('/', async (req, res) => {
  try {
    console.log("===== DÉBUT TRAITEMENT REQUÊTE CHAT =====");
    const { message, history = [], imageData, modelChoice = 'gpt-4.1' } = req.body;
    
    console.log(`📩 Requête reçue: ${message && message.length} caractères, modèle: ${modelChoice}`);
    console.log(`📚 ${history.length} messages dans l'historique`);
    
    // Vérification et préparation de l'image
    const hasImage = !!imageData;
    console.log(`🖼️ Image présente: ${hasImage}`, hasImage ? `(~${Math.round(imageData.length / 1024)}KB)` : '');
    
    let processedImageData = null;
    if (hasImage) {
      processedImageData = prepareImageForGPT4Vision(imageData);
      console.log(`🖼️ Image traitée: ${!!processedImageData}`);
    }
    
    // Vérifier si le vectorStore est prêt
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

    // 5) Prépare les messages
    const messages = [];

    // Instruction système
    messages.push({
      role: 'system',
      content: hasImage 
        ? 'Tu es un assistant qui aide à analyser des images et du code. Examine attentivement l\'image et réponds aux questions de l\'utilisateur. Décris exactement ce que tu vois dans l\'image.'
        : 'Tu es un assistant qui explique comme à un enfant de 10 ans. Pour chaque erreur, indique toujours le fichier et la ligne. Explique pas à pas chaque commande et fournis le code complet dans un bloc markdown avec le chemin du fichier. Utilise un langage simple et bienveillant.'
    });

    // Contexte global du README
    if (readmeContent) {
      messages.push({
        role: 'system',
        content: `CONTEXTE GLOBAL DU PROJET (README.md) :\n${readmeContent}`
      });
    }

    // Contexte des extraits pertinents
    messages.push({ role: 'system', content: `Extraits pertinents :\n${context}` });

    // Ajouter l'historique des messages
    if (Array.isArray(history)) {
      // S'assurer que les messages sont au bon format
      const formattedHistory = history.map(msg => ({
        role: msg.role,
        content: msg.content
      }));
      messages.push(...formattedHistory);
    }
    
    // CORRIGER LE FORMAT POUR LES MESSAGES AVEC IMAGES
    if (hasImage && processedImageData && modelChoice === 'gpt-4o') {
      // Format correct pour GPT-4o avec Vision
      console.log("📸 Ajout d'une image au message avec GPT-4o Vision");
      messages.push({
        role: 'user',
        content: [
          { type: "text", text: message || "Que vois-tu dans cette image?" },
          {
            type: "image_url",
            image_url: { 
              url: processedImageData,
              detail: "high" // Demander une analyse détaillée
            }
          }
        ]
      });
    } else {
      // Format standard pour les messages texte uniquement
      console.log("✉️ Ajout d'un message texte uniquement");
      messages.push({ role: 'user', content: message });
    }

    // Déterminer le bon modèle à utiliser
    const finalModel = hasImage ? 'gpt-4o' : modelChoice;
    console.log(`🚀 Envoi à l'API OpenAI avec le modèle: ${finalModel}`);
    
    // 6) Appel à l'API d'OpenAI avec le modèle sélectionné
    const completion = await openai.chat.completions.create({
      model: finalModel,
      messages,
      temperature: 0.7,
      max_tokens: 2000
    });

    console.log(`✅ Réponse reçue: ${completion.choices[0].message.content.length} caractères`);
    return res.json({ reply: completion.choices[0].message.content });
  } catch (err) {
    console.error('❌ Erreur chat détaillée:', err);
    
    // Préparer un message d'erreur utilisateur
    let userErrorMessage = "Une erreur s'est produite lors du traitement de votre demande.";
    
    // Vérifier si l'erreur est liée à l'image
    if (err.message && (
        err.message.includes('image') || 
        err.message.includes('vision') || 
        err.message.includes('not supported')
    )) {
      userErrorMessage = "Erreur lors du traitement de l'image. Veuillez vérifier que l'image est valide et réessayer.";
    }
    
    return res.status(500).json({ 
      error: err.message,
      reply: userErrorMessage
    });
  }
});

module.exports = router;