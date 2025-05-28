const mongoose = require('mongoose');
require('dotenv').config();

const badgesData = [
  {
    name: 'Nouveau Venu',
    description: 'Bienvenue dans Task Manager !',
    icon: '🌱',
    category: 'general',
    requirements: { 
      type: 'signup', 
      value: 1
    },
    rewards: { 
      experience: 10, 
      actionPoints: 5 
    },
    rarity: 'commun',  // En français !
    isActive: true
  },
  {
    name: 'Première Tâche',
    description: 'Créer votre première tâche',
    icon: '✅',
    category: 'tasks',
    requirements: { 
      type: 'tasks_created', 
      value: 1
    },
    rewards: { 
      experience: 20, 
      actionPoints: 10 
    },
    rarity: 'commun',  // En français !
    isActive: true
  },
  {
    name: 'Productif',
    description: 'Terminer 10 tâches',
    icon: '🚀',
    category: 'tasks',
    requirements: { 
      type: 'tasks_completed', 
      value: 10
    },
    rewards: { 
      experience: 50, 
      actionPoints: 25 
    },
    rarity: 'rare',  // En français !
    isActive: true
  },
  {
    name: 'Régulier',
    description: '7 jours de connexion consécutifs',
    icon: '🔥',
    category: 'engagement',
    requirements: { 
      type: 'streak', 
      value: 7
    },
    rewards: { 
      experience: 100, 
      actionPoints: 50 
    },
    rarity: 'rare',  // En français !
    isActive: true
  },
  {
    name: 'Maître des Tâches',
    description: 'Terminer 50 tâches',
    icon: '👑',
    category: 'tasks',
    requirements: { 
      type: 'tasks_completed', 
      value: 50
    },
    rewards: { 
      experience: 200, 
      actionPoints: 100 
    },
    rarity: 'épique',  // En français !
    isActive: true
  },
  {
    name: 'Légende Vivante',
    description: 'Atteindre le niveau 10',
    icon: '🏆',
    category: 'general',
    requirements: { 
      type: 'level', 
      value: 10
    },
    rewards: { 
      experience: 500, 
      actionPoints: 250 
    },
    rarity: 'légendaire',  // En français !
    isActive: true
  }
];

mongoose.connect(process.env.MONGO_URI).then(async () => {
  console.log('🔗 Connecté à MongoDB');
  
  const Badge = require('../models/Badge');
  
  // Supprimer les anciens badges
  await Badge.deleteMany({});
  console.log('🗑️  Badges existants supprimés');
  
  try {
    // Créer les nouveaux badges
    const createdBadges = await Badge.insertMany(badgesData);
    console.log(`\n✅ ${createdBadges.length} badges créés avec succès:`);
    
    createdBadges.forEach(badge => {
      console.log(`  ${badge.icon} ${badge.name} (${badge.rarity}) - ${badge.description}`);
    });
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
  
  process.exit(0);
}).catch(err => {
  console.error('❌ Erreur connexion:', err);
  process.exit(1);
});
