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

  // 2) Récupérer tous les fichiers pertinents
  const rootDir = path.resolve(__dirname, '..');
  const pattern = '**/*.@(ts|tsx|js|jsx|md)';
  const files = glob.sync(pattern, {
    cwd: rootDir,
    ignore: ['node_modules/**', 'public/**', 'scripts/**']
  });

  // 3) Lire et chunker manuellement
  const splitter = new RecursiveCharacterTextSplitter({ chunkSize: 2000, chunkOverlap: 200 });
  const docs = [];
  for (const filePath of files) {
    const content = fs.readFileSync(path.join(rootDir, filePath), 'utf8');
    const chunks = await splitter.splitText(content); // retourne un array de strings
    chunks.forEach(text => {
      docs.push({ pageContent: text, metadata: { source: filePath } });
    });
  }

  // 4) Générer les embeddings
  const embedder = new OpenAIEmbeddings({ openAIApiKey: process.env.OPENAI_API_KEY });

  // 5) Initialiser le vector store
  const vectorStore = new MongoDBAtlasVectorSearch(embedder, {
    collection,
    indexName: 'vector_index',
    textKey: 'pageContent',
    embeddingKey: 'embedding',
    primaryKey: '_id',
  });

  // 6) Ajouter les documents
  await vectorStore.addDocuments(docs);
  console.log(`✅ Indexation terminée : ${docs.length} chunks enregistrés.`);

  // 7) Fermer la connexion
  await client.close();
}

main().catch(err => {
  console.error('Erreur index-vector:', err);
  process.exit(1);
});
