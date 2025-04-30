// backend/scripts/index-vector.js
require('dotenv/config');
const fs = require('fs');
const path = require('path');
const glob = require('glob');
const { RecursiveCharacterTextSplitter } = require('@langchain/textsplitters');
const { OpenAIEmbeddings } = require('@langchain/openai');
const { MongoDBAtlasVectorSearch } = require('@langchain/mongodb');
const { MongoClient } = require('mongodb');

async function main() {
  // 1) Connexion au cluster MongoDB
  const client = new MongoClient(process.env.MONGO_URI);
  await client.connect();
  console.log('✅ MongoDB client connecté pour indexation');
  const db = client.db('task_manager');
  const collection = db.collection('code_chunks');

  // 2) Récupérer tous les fichiers pertinents - AMÉLIORATION: inclure frontend et plus de types de fichiers
  const rootDir = path.resolve(__dirname, '../..');  // Remonte à la racine du projet
  const pattern = '**/*.@(ts|tsx|js|jsx|md|json|html|css)';  // Plus de types de fichiers
  
  // Inclure les fichiers du frontend et du backend, mais exclure les dossiers node_modules, build, etc.
  const files = glob.sync(pattern, {
    cwd: rootDir,
    ignore: ['**/node_modules/**', '**/build/**', '**/dist/**', '**/scripts/**']
  });

  console.log(`🔍 ${files.length} fichiers trouvés à indexer`);

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

  // 4) Générer les embeddings
  const embedder = new OpenAIEmbeddings({ openAIApiKey: process.env.OPENAI_API_KEY });

  // 5) Initialiser le vector store (identique)
  const vectorStore = new MongoDBAtlasVectorSearch(embedder, {
    collection,
    indexName: 'vector_index',
    textKey: 'pageContent',
    embeddingKey: 'embedding',
    primaryKey: '_id',
  });

  // 6) Ajouter les documents
  // D'abord, effacer l'ancienne indexation
  await collection.deleteMany({});
  console.log("✅ Ancienne indexation supprimée");
  
  // Ajouter les nouveaux documents
  await vectorStore.addDocuments(docs);
  console.log(`✅ Indexation terminée : ${docs.length} chunks enregistrés.`);

  // 7) Fermer la connexion
  await client.close();
}

main().catch(err => {
  console.error('❌ Erreur index-vector:', err);
  process.exit(1);
});