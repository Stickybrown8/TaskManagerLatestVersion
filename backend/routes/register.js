/*
 * ROUTES D'INSCRIPTION - backend/routes/register.js
 *
 * Explication simple:
 * Ce fichier gère l'inscription des nouveaux utilisateurs dans l'application.
 * Il permet de créer un nouveau compte en vérifiant que l'email n'est pas déjà utilisé
 * et en sécurisant le mot de passe avant de l'enregistrer dans la base de données.
 * C'est comme le formulaire d'inscription d'un site web.
 *
 * Explication technique:
 * Module Express.js contenant la route API RESTful pour l'enregistrement des utilisateurs,
 * avec validation des données, hachage sécurisé du mot de passe via bcrypt et création
 * de document utilisateur dans MongoDB.
 *
 * Où ce fichier est utilisé:
 * Appelé par le serveur backend lors de la requête API d'inscription,
 * utilisé par le frontend lorsqu'un utilisateur remplit le formulaire d'inscription.
 *
 * Connexions avec d'autres fichiers:
 * - Utilise le modèle User pour créer de nouveaux utilisateurs
 * - Importé dans le fichier principal du serveur (server.js/app.js)
 * - Appelé par le composant frontend d'inscription
 * - Indirectement lié au middleware d'authentification
 */

// === Début : Importation des dépendances ===
// Explication simple : On fait venir les outils dont on a besoin pour créer un compte utilisateur et protéger les mots de passe.
// Explication technique : Importation des modules Express pour le routage, bcrypt pour le hachage sécurisé des mots de passe, et du modèle User pour interagir avec la collection d'utilisateurs dans MongoDB.
const express = require('express');
const bcrypt = require('bcrypt');
const User = require('../models/User'); // adapte si ton modèle s'appelle différemment

const router = express.Router();
// === Fin : Importation des dépendances ===

// === Début : Route d'inscription des utilisateurs ===
// Explication simple : Cette fonction vérifie si les informations du nouveau membre sont complètes, s'assure que son email n'est pas déjà utilisé, protège son mot de passe et crée son compte.
// Explication technique : Endpoint POST qui valide les données entrantes, vérifie l'unicité de l'email, hache le mot de passe avec bcrypt et crée un nouveau document utilisateur dans la base de données.
// POST /api/register
router.post('/', async (req, res) => {
  const { name, email, password } = req.body;
  if(!email || !password || !name) {
    return res.status(400).json({ message: 'Tous les champs sont requis.' });
  }
  try {
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: 'Cet email existe déjà.' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashedPassword });
    res.status(201).json({ user: { _id: user._id, name: user.name, email: user.email } });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});
// === Fin : Route d'inscription des utilisateurs ===

// === Début : Exportation du routeur ===
// Explication simple : On rend notre fonction d'inscription disponible pour que l'application puisse l'utiliser.
// Explication technique : Exportation du routeur Express configuré pour être intégré dans l'application principale via le système de middleware Express.
module.exports = router;
// === Fin : Exportation du routeur ===
