// === Ce fichier crée une base de données intelligente de tout le code du projet pour pouvoir y faire des recherches === /workspaces/TaskManagerLatestVersion/backend/scripts/index-vector.js
// Explication simple : Ce script est comme un robot qui lit tous les fichiers du projet, les découpe en petits morceaux, et leur attribue une "empreinte digitale" spéciale pour pouvoir retrouver très rapidement n'importe quelle partie du code en posant une question en langage naturel.
// Explication technique : Script Node.js autonome qui indexe les fichiers du projet en chunks textuels, génère des embeddings vectoriels via OpenAI, et les stocke dans une collection MongoDB avec recherche vectorielle.
// Utilisé dans : Exécuté manuellement via la commande "node scripts/index-vector.js" pour initialiser ou mettre à jour l'index vectoriel du code source.
// Connecté à : Base de données MongoDB (collection 'code_chunks'), API OpenAI pour la génération d'embeddings, et indirectement au système de chat qui utilisera cette base pour répondre aux questions sur le code.

// filepath: /workspaces/TaskManagerLatestVersion/backend/scripts/index-vector.js
// backend/scripts/index-vector.js

// === Début : Importation des dépendances ===
// Explication simple : Ces lignes sont comme une liste d'outils spéciaux que notre robot va utiliser pour faire son travail - un outil pour lire des fichiers, un autre pour les découper, encore un autre pour créer des "empreintes digitales", etc.
// Explication technique : Importation des bibliothèques Node.js nécessaires : configuration des variables d'environnement, manipulation de fichiers, recherche de fichiers par pattern, LangChain pour le traitement du texte et les embeddings, et MongoDB pour le stockage vectoriel.
require('dotenv/config');
const fs = require('fs');
const path = require('path');
const glob = require('glob');
const { RecursiveCharacterTextSplitter } = require('@langchain/textsplitters');
const { OpenAIEmbeddings } = require('@langchain/openai');
const { MongoDBAtlasVectorSearch } = require('@langchain/mongodb');
const { MongoClient } = require('mongodb');
// === Fin : Importation des dépendances ===

// === Début : Fonction principale d'indexation ===
// Explication simple : Cette fonction est comme le cerveau de notre robot qui organise étape par étape toutes les actions à faire pour créer notre base de données intelligente.
// Explication technique : Fonction asynchrone principale qui orchestre l'ensemble du processus d'indexation, de la connexion à MongoDB jusqu'à la génération et sauvegarde des embeddings vectoriels.
async function main() {
  // === Début : Connexion à la base de données ===
  // Explication simple : Cette partie aide notre robot à se connecter au grand entrepôt où il va ranger toutes les informations qu'il va collecter.
  // Explication technique : Initialisation de la connexion au client MongoDB en utilisant l'URI stockée dans les variables d'environnement, puis sélection de la base de données et de la collection spécifique.
  // 1) Connexion au cluster MongoDB
  const client = new MongoClient(process.env.MONGO_URI);
  await client.connect();
  console.log('✅ MongoDB client connecté pour indexation');
  const db = client.db('task_manager');
  const collection = db.collection('code_chunks');
  // === Fin : Connexion à la base de données ===

  // === Début : Recherche des fichiers à indexer ===
  // Explication simple : Ici, notre robot parcourt tous les dossiers du projet pour trouver les fichiers intéressants à lire, mais ignore les fichiers qui ne sont pas importants comme ceux dans les poubelles (node_modules).
  // Explication technique : Définition du répertoire racine et utilisation de glob pour rechercher tous les fichiers avec les extensions spécifiées, en excluant les répertoires non pertinents via le pattern et les options ignore.
  // 2) Récupérer tous les fichiers pertinents - AMÉLIORATION: inclure frontend et plus de types de fichiers
  const rootDir = path.resolve(__dirname, '../..');  // Remonte à la racine du projet
  const pattern = '**/*.@(ts|tsx|js|jsx|md|json|html|css)';  // Plus de types de fichiers
  
  // Inclure les fichiers du frontend et du backend, mais exclure les dossiers node_modules, build, etc.
  const files = glob.sync(pattern, {
    cwd: rootDir,
    ignore: ['**/node_modules/**', '**/build/**', '**/dist/**', '**/scripts/**']
  });

  console.log(`🔍 ${files.length} fichiers trouvés à indexer`);
  // === Fin : Recherche des fichiers à indexer ===

  // === Début : Découpage des fichiers en chunks ===
  // Explication simple : Notre robot découpe maintenant chaque fichier en petits morceaux faciles à digérer, comme quand tu coupes une grande pizza en parts pour mieux la manger.
  // Explication technique : Configuration du splitter LangChain pour découper les textes avec une taille et un chevauchement optimisés, puis lecture et découpage séquentiel de chaque fichier avec enrichissement des métadonnées.
  // 3) Lire et chunker manuellement
  const splitter = new RecursiveCharacterTextSplitter({ 
    chunkSize: 1500,      // Taille réduite pour plus de précision
    chunkOverlap: 200
  });
  const docs = [];
  
  for (const filePath of files) {
    try {
      const fullPath = path.join(rootDir, filePath);
      console.log(`Indexation de: ${filePath}`);
      
      const content = fs.readFileSync(fullPath, 'utf8');
      const chunks = await splitter.splitText(content);
      
      chunks.forEach((text, index) => {
        // Enrichir les métadonnées pour faciliter la recherche
        docs.push({ 
          pageContent: text, 
          metadata: { 
            source: filePath,
            chunk: index + 1,
            totalChunks: chunks.length,
            fileType: path.extname(filePath),
            isFrontend: filePath.includes('frontend/'),
            isBackend: filePath.includes('backend/'),
            isModel: filePath.includes('models/') || filePath.includes('schema'),
            lastModified: fs.statSync(fullPath).mtime.toISOString()
          }
        });
      });
    } catch (error) {
      console.error(`⚠️ Erreur lors de l'indexation de ${filePath}:`, error.message);
    }
  }
  // === Fin : Découpage des fichiers en chunks ===

  // === Début : Génération des embeddings ===
  // Explication simple : Ici, notre robot crée une "empreinte digitale" spéciale pour chaque morceau de texte, qui permettra plus tard de retrouver les morceaux qui ressemblent à ce qu'on cherche.
  // Explication technique : Initialisation du modèle d'embeddings OpenAI qui transformera les chunks textuels en vecteurs numériques, en utilisant la clé API fournie dans les variables d'environnement.
  // 4) Générer les embeddings
  const embedder = new OpenAIEmbeddings({ openAIApiKey: process.env.OPENAI_API_KEY });
  // === Fin : Génération des embeddings ===

  // === Début : Configuration du vector store ===
  // Explication simple : Cette partie prépare le grand entrepôt spécial où notre robot va ranger toutes les "empreintes digitales" des morceaux de texte.
  // Explication technique : Initialisation de l'intégration MongoDB Atlas Vector Search de LangChain avec la configuration des champs pour le stockage des embeddings et des métadonnées.
  // 5) Initialiser le vector store (identique)
  const vectorStore = new MongoDBAtlasVectorSearch(embedder, {
    collection,
    indexName: 'vector_index',
    textKey: 'pageContent',
    embeddingKey: 'embedding',
    primaryKey: '_id',
  });
  // === Fin : Configuration du vector store ===

  // === Début : Sauvegarde des documents dans la base de données ===
  // Explication simple : Notre robot efface d'abord toutes les anciennes informations pour faire place nette, puis range soigneusement tous les nouveaux morceaux de texte avec leurs "empreintes digitales" dans l'entrepôt.
  // Explication technique : Suppression des anciens documents de la collection pour éviter les duplications, puis ajout des nouveaux documents avec leurs embeddings générés par le modèle OpenAI.
  // 6) Ajouter les documents
  // D'abord, effacer l'ancienne indexation
  await collection.deleteMany({});
  console.log("✅ Ancienne indexation supprimée");
  
  // Ajouter les nouveaux documents
  await vectorStore.addDocuments(docs);
  console.log(`✅ Indexation terminée : ${docs.length} chunks enregistrés.`);
  // === Fin : Sauvegarde des documents dans la base de données ===

  // === Début : Fermeture de la connexion ===
  // Explication simple : Après avoir fini tout son travail, notre robot ferme proprement la porte de l'entrepôt pour s'assurer que tout est bien sécurisé.
  // Explication technique : Fermeture appropriée de la connexion MongoDB pour libérer les ressources système et éviter les fuites de connexion.
  // 7) Fermer la connexion
  await client.close();
  // === Fin : Fermeture de la connexion ===
}
// === Fin : Fonction principale d'indexation ===

// === Début : Exécution du script ===
// Explication simple : Cette dernière partie est comme le bouton "Démarrer" qui lance notre robot et le surveille pour s'assurer qu'il ne tombe pas en panne.
// Explication technique : Pattern d'auto-exécution de la fonction principale avec gestion des erreurs, affichant les exceptions dans la console et terminant le processus avec un code d'erreur en cas d'échec.
main().catch(err => {
  console.error('❌ Erreur index-vector:', err);
  process.exit(1);
});
// === Fin : Exécution du script ===