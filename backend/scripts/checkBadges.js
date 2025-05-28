const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
  console.log('🔍 Vérification des badges...');
  
  const Badge = require('../models/Badge');
  const badges = await Badge.find({});
  
  console.log(`\n📊 Nombre de badges trouvés: ${badges.length}`);
  
  if (badges.length > 0) {
    console.log('\n✅ Badges existants:');
    badges.forEach(badge => {
      console.log(`  ${badge.icon || '🏆'} ${badge.name} - ${badge.description}`);
    });
  } else {
    console.log('\n❌ Aucun badge trouvé dans la base de données');
  }
  
  process.exit(0);
}).catch(err => {
  console.error('❌ Erreur:', err);
  process.exit(1);
});
