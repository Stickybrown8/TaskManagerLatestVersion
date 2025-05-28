const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
  console.log('�� Connecté à MongoDB');
  
  const User = require('../models/User');
  
  const users = await User.find({});
  console.log(`\n📊 ${users.length} utilisateurs trouvés`);
  
  for (const user of users) {
    console.log(`\n👤 Utilisateur: ${user.name || user.email}`);
    
    if (!user.gamification) {
      user.gamification = {
        level: 1,
        experience: 0,
        points: 0,
        currentStreak: 0,
        longestStreak: 0,
        lastActivity: new Date(),
        badges: [],
        achievements: []
      };
      
      await user.save();
      console.log('  ✅ Gamification initialisée');
    } else {
      console.log('  ✅ Gamification déjà présente');
    }
  }
  
  process.exit(0);
}).catch(err => {
  console.error('❌ Erreur:', err);
  process.exit(1);
});
