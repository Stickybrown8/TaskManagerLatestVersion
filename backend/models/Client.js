/*
 * MODÈLE CLIENT - backend/models/Client.js
 *
 * Explication simple:
 * Ce fichier définit comment sont structurés les clients dans l'application.
 * Il permet de stocker toutes les informations sur un client: son nom, sa description,
 * ses contacts, et les statistiques sur les tâches qui lui sont associées.
 *
 * Explication technique:
 * Modèle de données Mongoose pour la collection "clients" dans MongoDB,
 * définissant la structure, les validations et les middlewares pour les documents client.
 *
 * Où ce fichier est utilisé:
 * Dans les contrôleurs qui gèrent la création, la modification et la récupération
 * des clients pour les afficher dans l'interface utilisateur.
 *
 * Connexions avec d'autres fichiers:
 * - Référencé dans le modèle Task (pour associer des tâches à un client)
 * - Référencé dans le modèle Activity (pour suivre les activités liées aux clients)
 * - Utilisé dans les contrôleurs de client (client.controller.js)
 * - Probablement utilisé dans les services de rapports et d'analyse
 */

// === Début : Importation des dépendances ===
// Explication simple : On fait venir les outils dont on a besoin pour créer notre modèle de clients.
// Explication technique : Importation du module mongoose et extraction de l'objet Schema pour définir la structure du document MongoDB.
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
// === Fin : Importation des dépendances ===

// === Début : Définition du schéma de données pour les clients ===
// Explication simple : On crée un plan qui décrit toutes les informations qu'un client doit contenir, comme son nom, ses contacts et son état.
// Explication technique : Déclaration d'un schéma Mongoose avec les champs nécessaires, les types de données, les valeurs par défaut et les sous-documents imbriqués pour la collection de clients.
// Schéma client
const ClientSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['actif', 'inactif', 'archivé'],
    default: 'actif'
  },
  contacts: [{
    name: {
      type: String,
      required: true
    },
    role: {
      type: String
    },
    email: {
      type: String
    },
    phone: {
      type: String
    },
    isMain: {
      type: Boolean,
      default: false
    }
  }],
  notes: {
    type: String,
    default: ''
  },
  tags: [{
    type: String
  }],
  metrics: {
    tasksCompleted: {
      type: Number,
      default: 0
    },
    tasksInProgress: {
      type: Number,
      default: 0
    },
    tasksPending: {
      type: Number,
      default: 0
    },
    lastActivity: {
      type: Date,
      default: Date.now
    }
  }
});
// === Fin : Définition du schéma de données pour les clients ===

// === Début : Validation des données ===
// Explication simple : On vérifie que le nom du client est assez long pour être valide.
// Explication technique : Définition d'un validateur personnalisé pour le champ 'name' qui garantit une longueur minimale, avec un message d'erreur explicite.
// Ajouter des validateurs

ClientSchema.path('name').validate(function(value) {
  return value && value.length >= 2;
}, 'Le nom du client doit contenir au moins 2 caractères');
// === Fin : Validation des données ===

// === Début : Nettoyage automatique des données avant sauvegarde ===
// Explication simple : Avant d'enregistrer un client, on nettoie les espaces inutiles et on s'assure que toutes les informations nécessaires sont présentes.
// Explication technique : Définition d'un middleware 'pre-save' qui s'exécute avant chaque opération de sauvegarde pour normaliser les données et garantir la cohérence du document.
ClientSchema.pre('save', function(next) {
  // Nettoyer les valeurs avant enregistrement
  if (this.name) this.name = this.name.trim();
  if (this.description) this.description = this.description.trim();
  
  // S'assurer que lastActivity est toujours défini
  if (!this.lastActivity) this.lastActivity = new Date();
  
  next();
});
// === Fin : Nettoyage automatique des données avant sauvegarde ===

// === Début : Optimisation des performances avec des index ===
// Explication simple : On crée des raccourcis pour que l'ordinateur trouve plus vite les clients quand on lui demande.
// Explication technique : Création d'index MongoDB via Mongoose pour optimiser les requêtes fréquentes sur les champs 'name' et 'userId/status', améliorant ainsi les performances des opérations de recherche.
// Ajout d'index pour améliorer les performances
ClientSchema.index({ name: 1 });
ClientSchema.index({ userId: 1, status: 1 });
// === Fin : Optimisation des performances avec des index ===

// === Début : Exportation du modèle ===
// Explication simple : On donne un nom à notre plan et on le rend disponible pour que d'autres parties de l'application puissent l'utiliser.
// Explication technique : Création et exportation du modèle Mongoose "Client" basé sur le schéma défini, ce qui permet d'interagir avec la collection "clients" dans MongoDB.
module.exports = mongoose.model('Client', ClientSchema);
// === Fin : Exportation du modèle ===
