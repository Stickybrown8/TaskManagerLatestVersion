const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const Client = require('../models/Client');

// Obtenir tous les clients
router.get('/', verifyToken, async (req, res) => {
  try {
    const clients = await Client.find({ userId: req.userId });
    res.status(200).json(clients);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération des clients', error: error.message });
  }
});

// Obtenir un client par ID
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const client = await Client.findOne({ _id: req.params.id, userId: req.userId });
    if (!client) {
      return res.status(404).json({ message: 'Client non trouvé' });
    }
    res.status(200).json(client);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération du client', error: error.message });
  }
});

// Créer un nouveau client
router.post('/', verifyToken, async (req, res) => {
  try {
    const { name, email, phone, company, notes } = req.body;
    
    const newClient = new Client({
      userId: req.userId,
      name,
      email,
      phone,
      company,
      notes,
      createdAt: Date.now()
    });
    
    await newClient.save();
    res.status(201).json({ message: 'Client créé avec succès', client: newClient });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la création du client', error: error.message });
  }
});

// Mettre à jour un client
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const { name, email, phone, company, notes } = req.body;
    
    const updatedClient = await Client.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { name, email, phone, company, notes, updatedAt: Date.now() },
      { new: true }
    );
    
    if (!updatedClient) {
      return res.status(404).json({ message: 'Client non trouvé' });
    }
    
    res.status(200).json({ message: 'Client mis à jour avec succès', client: updatedClient });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la mise à jour du client', error: error.message });
  }
});

// Supprimer un client
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const deletedClient = await Client.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    
    if (!deletedClient) {
      return res.status(404).json({ message: 'Client non trouvé' });
    }
    
    res.status(200).json({ message: 'Client supprimé avec succès' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la suppression du client', error: error.message });
  }
});

module.exports = router;
