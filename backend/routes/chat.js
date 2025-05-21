/*
 * ROUTE D'ASSISTANT DE PROGRAMMATION IA - backend/routes/chat.js
 *
 * Explication simple:
 * Ce fichier contient le code pour un assistant IA qui t'aide à programmer.
 * Tu peux lui poser des questions, montrer des images de code ou des erreurs,
 * et il te répond intelligemment en cherchant dans la base de connaissances du projet.
 * C'est comme un tuteur personnel qui connait tout ton code!
 *
 * Explication technique:
 * Route Express.js qui intègre l'API OpenAI (GPT-4/GPT-4o) avec une recherche sémantique
 * via MongoDB Atlas Vector Search pour offrir des réponses contextuelles.
 * Supporte l'analyse de texte, d'images (vision) et le débogage d'erreurs.
 *
 * Où ce fichier est utilisé:
 * Appelé par le frontend quand l'utilisateur interagit avec l'assistant IA
 * dans l'interface de chat de l'application.
 *
 * Connexions avec d'autres fichiers:
 * - Importe les variables d'environnement depuis .env
 * - Se connecte à la base MongoDB pour la recherche vectorielle
 * - Intègre l'API OpenAI pour le traitement du langage et des images
 * - Lit le fichier README.md du projet pour fournir du contexte
 * - Appelé par les composants frontend de chat/assistant
 */

// === Début : Configuration de l'environnement et importation des dépendances ===
// Explication simple : On prépare tous les outils dont notre assistant a besoin pour fonctionner, comme un bricoleur qui sort ses outils de sa boîte.
// Explication technique : Importation des modules nécessaires - dotenv pour les variables d'environnement, express pour le routage, fs/path pour la manipulation de fichiers et les bibliothèques d'IA pour OpenAI et la recherche vectorielle.
require('dotenv').config();             // Charge .env

const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();

const { MongoClient } = require('mongodb');
const { OpenAI } = require('openai');
const { MongoDBAtlasVectorSearch } = require('@langchain/mongodb');
const { OpenAIEmbeddings } = require('@langchain/openai');
// === Fin : Configuration de l'environnement et importation des dépendances ===

// === Début : Initialisation des clients OpenAI et MongoDB ===
// Explication simple : On connecte notre assistant à son cerveau (OpenAI) et à sa bibliothèque de connaissances (MongoDB) pour qu'il puisse apprendre et répondre.
// Explication technique : Configuration du client OpenAI avec l'API key et initialisation asynchrone du vector store MongoDB Atlas pour la recherche sémantique, avec gestion des erreurs.
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
// === Fin : Initialisation des clients OpenAI et MongoDB ===

// === Début : Fonction d'analyse des logs d'erreur ===
// Explication simple : Cette fonction est comme un détective qui analyse un message d'erreur pour trouver des indices importants: quel type d'erreur, dans quel fichier et à quelle ligne.
// Explication technique : Fonction utilitaire qui extrait les métadonnées d'un log d'erreur via des expressions régulières, identifiant le type d'erreur, le fichier source, le numéro de ligne et le code problématique.
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
// === Fin : Fonction d'analyse des logs d'erreur ===

// === Début : Fonction de préparation des images pour l'API Vision ===
// Explication simple : Cette fonction vérifie si une image est dans le bon format pour être envoyée au "robot qui voit". Si l'image n'est pas au bon format, elle essaie de la corriger.
// Explication technique : Utilitaire qui valide et normalise les images fournies, supportant les formats data URL, les URLs HTTP/HTTPS, et rejetant les formats non reconnus, pour les rendre compatibles avec l'API Vision de GPT-4.
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
// === Fin : Fonction de préparation des images pour l'API Vision ===

// === Début : Route principale de l'API chat ===
// Explication simple : Ce gros bloc gère tout ce qui se passe quand tu envoies un message à l'assistant. Il reçoit ta question, cherche des informations sur ton code, les envoie à l'IA et te renvoie sa réponse.
// Explication technique : Endpoint POST qui orchestre tout le processus de traitement des requêtes utilisateur: analyse du message, recherche de contexte, extraction d'informations d'erreur si nécessaire, préparation des messages pour OpenAI et envoi de la réponse formatée.
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

    // === Début : Recherche contextuelle de documents pertinents ===
    // Explication simple : Ici, l'assistant cherche dans sa bibliothèque de connaissances des informations qui pourront l'aider à répondre à ta question, comme un détective qui cherche des indices.
    // Explication technique : Bloc de recherche sémantique qui utilise MongoDB Atlas Vector Search pour récupérer des documents pertinents, avec une stratégie différente selon qu'il s'agit d'une analyse d'erreur ou d'une requête normale.
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
    // === Fin : Recherche contextuelle de documents pertinents ===

    // === Début : Chargement des informations du projet ===
    // Explication simple : L'assistant essaie de comprendre ton projet en lisant son mode d'emploi (README), comme un nouvel élève qui lit le manuel de classe avant de répondre aux questions.
    // Explication technique : Lecture synchrone du fichier README.md du projet pour enrichir le contexte global de la conversation, avec gestion des erreurs si le fichier est inaccessible.
    // 4) Charger le README.md (identique)
    const readmePath = path.resolve(__dirname, '../../README.md');
    let readmeContent = '';
    try {
      readmeContent = fs.readFileSync(readmePath, 'utf8');
    } catch (err) {
      console.warn('⚠️ README non trouvé ou illisible à', readmePath, err.message);
    }
    // === Fin : Chargement des informations du projet ===

    // === Début : Préparation des messages pour l'IA ===
    // Explication simple : Ici, on prépare tout ce que l'assistant doit savoir avant de répondre - sa mission, les informations du projet, l'historique de votre conversation et ta question actuelle.
    // Explication technique : Construction du tableau de messages pour l'API OpenAI, incluant le message système (instructions), le contexte (README, recherche vectorielle), l'historique de conversation et le message utilisateur courant.
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
    // === Fin : Préparation des messages pour l'IA ===

    // === Début : Appel à l'API OpenAI ===
    // Explication simple : C'est le moment où l'assistant envoie ta question au "grand cerveau" d'OpenAI et attend sa réponse, comme quand tu poses une question difficile à ton professeur.
    // Explication technique : Envoi de la requête à l'API OpenAI avec le modèle approprié (adaptable selon présence d'image ou mode d'erreur), paramètres de génération ajustés et récupération de la réponse.
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
    // === Fin : Appel à l'API OpenAI ===
  } catch (err) {
    // === Début : Gestion des erreurs ===
    // Explication simple : Si quelque chose ne fonctionne pas, ce bloc s'occupe de créer un message d'erreur gentil pour t'expliquer ce qui s'est passé, comme quand un jeu vidéo te dit pourquoi il a planté.
    // Explication technique : Bloc de gestion d'exception qui capture, journalise et formate les erreurs rencontrées pendant le traitement, avec une attention particulière aux erreurs liées au traitement d'images.
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
    // === Fin : Gestion des erreurs ===
  }
});
// === Fin : Route principale de l'API chat ===

// === Début : Exportation du routeur ===
// Explication simple : Cette ligne rend notre assistant disponible pour le reste de l'application, comme quand tu mets ton jouet dans un endroit où tes amis peuvent le trouver.
// Explication technique : Exportation du routeur Express configuré pour permettre son montage dans l'application principale via le système de middleware Express.
module.exports = router;
// === Fin : Exportation du routeur ===