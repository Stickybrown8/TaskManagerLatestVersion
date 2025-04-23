const express = require('express');
const bcrypt = require('bcrypt');
const User = require('../models/User'); // adapte si ton modèle s'appelle différemment

const router = express.Router();

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

module.exports = router;
