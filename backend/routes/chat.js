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

// NOUVELLE FONCTION: Extraire les infos d'erreur pour mieux cibler la recherche
function extractErrorInfo(errorLog) {
  const result = {
    errorType: '',
    fileName: '',
    lineNumber: null,
    errorMessage: '',
    exactError: ''
  };
  
  // Rechercher les erreurs TypeScript (très courant avec Netlify)
  const tsErrorMatch = errorLog.match(/TS(\d+):\s*(.*)/);
  if (tsErrorMatch) {
    result.errorType = `TypeScript Error TS${tsErrorMatch[1]}`;
    result.errorMessage = tsErrorMatch[2];
    result.exactError = tsErrorMatch[0];
  }
  
  // Rechercher les références de fichiers et lignes
  const fileLineMatch = errorLog.match(/(\S+\.[a-zA-Z0-9]+):(\d+)(?::(\d+))?/);
  if (fileLineMatch) {
    result.fileName = fileLineMatch[1];
    result.lineNumber = parseInt(fileLineMatch[2]);
  }
  
  // Rechercher la ligne de code problématique
  const codeLineMatch = errorLog.match(/>([^>]*\n[^>]*\^+[^>]*)/);
  if (codeLineMatch) {
    result.codeLine = codeLineMatch[1].trim();
  }
  
  return result;
}

// Fonction pour traiter les data URLs d'images (identique)
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
    const { 
      message, 
      history = [], 
      imageData, 
      modelChoice = 'gpt-4.1',
      errorLog = null,           // NOUVEAU: Pour passer un log d'erreur
      isDeploymentError = false  // NOUVEAU: Mode analyse d'erreur
    } = req.body;
    
    console.log(`📩 Requête reçue: ${message && message.length} caractères, modèle: ${modelChoice}`);
    console.log(`📚 ${history.length} messages dans l'historique`);
    console.log(`🔍 Mode analyse d'erreur: ${isDeploymentError}`);
    
    // Vérification et préparation de l'image (identique)
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

    // 3) Recherche des chunks pertinents - MODIFIÉ POUR LES ERREURS
    let docs = [];
    let context = "";
    
    if (isDeploymentError && errorLog) {
      // Mode analyse d'erreur: extraire les infos pour cibler la recherche
      const errorInfo = extractErrorInfo(errorLog);
      console.log("📊 Infos d'erreur extraites:", errorInfo);
      
      // Construire une requête ciblée
      const targetedQuery = `${errorInfo.errorType} ${errorInfo.errorMessage} ${errorInfo.fileName} ligne ${errorInfo.lineNumber}`;
      console.log(`🔎 Requête ciblée: ${targetedQuery}`);
      
      // Recherche spécifique avec plus de résultats pour le contexte d'erreur
      docs = await vectorStore.similaritySearch(targetedQuery, 8);
      
      // Si on a un nom de fichier, tenter de trouver des chunks contenant ce fichier spécifique
      if (errorInfo.fileName) {
        const fileNameQuery = `filename:${errorInfo.fileName}`;
        const fileSpecificDocs = await vectorStore.similaritySearch(fileNameQuery, 3);
        
        // Combiner les résultats en éliminant les doublons
        const allDocs = [...docs, ...fileSpecificDocs];
        const uniqueDocs = allDocs.filter((doc, index, self) => 
          index === self.findIndex(d => d.pageContent === doc.pageContent)
        );
        
        docs = uniqueDocs.slice(0, 10); // Limiter à 10 résultats max
      }
    } else {
      // Mode normal: recherche basée sur le message
      docs = await vectorStore.similaritySearch(message, 5);
    }
    
    // Formatter le contexte
    context = docs.map(d => {
      const source = d.metadata?.source ? `Source: ${d.metadata.source}` : '';
      return `${source}\n${d.pageContent}\n---\n`;
    }).join('\n');

    // 4) Charger le README.md (identique)
    const readmePath = path.resolve(__dirname, '../../README.md');
    let readmeContent = '';
    try {
      readmeContent = fs.readFileSync(readmePath, 'utf8');
    } catch (err) {
      console.warn('⚠️ README non trouvé ou illisible à', readmePath, err.message);
    }

    // 5) Prépare les messages - MODIFIÉ POUR LES ERREURS
    const messages = [];

    // Instruction système - adaptée pour les erreurs de déploiement
    if (isDeploymentError) {
      messages.push({
        role: 'system',
        content: `Tu es un expert en déploiement et debugging de code. Tu vas analyser une erreur de déploiement Netlify.
        
INSTRUCTIONS IMPORTANTES:
1. Donne le fichier et la ligne exacte où se trouve l'erreur
2. Explique clairement la cause de l'erreur en termes simples
3. Propose une solution COMPLÈTE avec le code corrigé
4. Indique TOUJOURS les étapes précises à suivre pour corriger l'erreur

Format pour ta réponse:
1. Identification précise de l'erreur: [Type d'erreur et explication]
2. Fichier concerné: [chemin/vers/le/fichier:ligne]
3. Cause fondamentale: [explication pour débutant]
4. Solution proposée: [code complet pour corriger]
5. Étapes pour appliquer la correction: [étapes numérotées]

N'oublie pas: Je suis débutant, sois très clair et précis!`
      });
      
      // Ajouter le log d'erreur en contexte prioritaire
      if (errorLog) {
        messages.push({
          role: 'system',
          content: `LOG D'ERREUR NETLIFY:\n${errorLog}`
        });
      }
    } else {
      // Mode normal
      messages.push({
        role: 'system',
        content: hasImage 
          ? 'Tu es un assistant qui aide à analyser des images et du code. Examine attentivement l\'image et réponds aux questions de l\'utilisateur. Décris exactement ce que tu vois dans l\'image.'
          : 'Tu es un assistant qui explique comme à un enfant de 10 ans. Pour chaque erreur, indique toujours le fichier et la ligne. Explique pas à pas chaque commande et fournis le code complet dans un bloc markdown avec le chemin du fichier. Utilise un langage simple et bienveillant.'
      });
    }

    // Contexte global du README
    if (readmeContent) {
      messages.push({
        role: 'system',
        content: `CONTEXTE GLOBAL DU PROJET (README.md) :\n${readmeContent}`
      });
    }

    // Contexte des extraits pertinents
    messages.push({ role: 'system', content: `Extraits pertinents :\n${context}` });

    // Ajouter l'historique des messages (identique)
    if (Array.isArray(history)) {
      const formattedHistory = history.map(msg => ({
        role: msg.role,
        content: msg.content
      }));
      messages.push(...formattedHistory);
    }
    
    // Message de l'utilisateur
    if (hasImage && processedImageData && modelChoice === 'gpt-4o') {
      // Format pour message avec image (identique)
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
      // Message texte standard
      console.log("✉️ Ajout d'un message texte uniquement");
      
      // Si mode erreur et pas de message spécifique, utiliser une demande par défaut
      const userMessage = isDeploymentError && !message.trim() 
        ? "Analyse cette erreur de déploiement et dis-moi comment la corriger"
        : message;
        
      messages.push({ role: 'user', content: userMessage });
    }

    // Déterminer le modèle à utiliser - Pour les erreurs, toujours utiliser GPT-4
    const finalModel = hasImage ? 'gpt-4o' : (isDeploymentError ? 'gpt-4.1' : modelChoice);
    console.log(`🚀 Envoi à l'API OpenAI avec le modèle: ${finalModel}`);
    
    // 6) Appel à l'API d'OpenAI avec le modèle sélectionné
    const completion = await openai.chat.completions.create({
      model: finalModel,
      messages,
      temperature: isDeploymentError ? 0.2 : 0.7, // Température réduite pour les erreurs
      max_tokens: 2000
    });

    console.log(`✅ Réponse reçue: ${completion.choices[0].message.content.length} caractères`);
    return res.json({ 
      reply: completion.choices[0].message.content,
      mode: isDeploymentError ? 'error_analysis' : 'chat'
    });
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