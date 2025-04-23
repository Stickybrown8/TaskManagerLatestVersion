import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '../hooks';
import { createClientStart, createClientSuccess, createClientFailure } from '../store/slices/clientsSlice';
import { addNotification } from '../store/slices/uiSlice';
import { motion } from 'framer-motion';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'https://task-manager-api-yx13.onrender.com';

const ClientForm: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'actif',
    contacts: [{
      name: '',
      role: '',
      email: '',
      phone: '',
      isMain: true
    }],
    notes: '',
    tags: [] as string[],
    logo: '' // Ajout d'un champ pour le logo
  });

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>('');

  const [profitabilityData, setProfitabilityData] = useState({
    hourlyRate: 100, // Taux horaire par défaut à 100€/h
    targetHours: 0,   // Heures cibles par mois
    monthlyBudget: 0  // Budget mensuel
  });
  
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // Pour la navigation entre les étapes du formulaire
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setLogoFile(file);
      
      // Créer un aperçu du logo
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setLogoPreview(result);
        // Mettre à jour également formData avec l'image en base64
        setFormData(prev => ({ ...prev, logo: result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProfitabilityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numValue = parseFloat(value);
    
    // Calculer automatiquement les valeurs liées
    if (name === 'monthlyBudget' && numValue > 0) {
      const targetHours = Math.round((numValue / profitabilityData.hourlyRate) * 10) / 10;
      setProfitabilityData(prev => ({
        ...prev,
        [name]: numValue,
        targetHours: targetHours
      }));
    } else if (name === 'hourlyRate' && numValue > 0) {
      // Recalculer les heures cibles si le taux horaire change
      const targetHours = profitabilityData.monthlyBudget > 0
        ? Math.round((profitabilityData.monthlyBudget / numValue) * 10) / 10
        : profitabilityData.targetHours;
      
      setProfitabilityData(prev => ({
        ...prev,
        [name]: numValue,
        targetHours: targetHours
      }));
    } else if (name === 'targetHours' && numValue >= 0) {
      // Recalculer le budget mensuel si les heures cibles changent
      const monthlyBudget = Math.round(numValue * profitabilityData.hourlyRate);
      
      setProfitabilityData(prev => ({
        ...prev,
        [name]: numValue,
        monthlyBudget: monthlyBudget
      }));
    } else {
      setProfitabilityData(prev => ({
        ...prev,
        [name]: numValue
      }));
    }
  };
  
  const handleContactChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const updatedContacts = [...formData.contacts];
    updatedContacts[index] = { ...updatedContacts[index], [name]: value };
    setFormData(prev => ({ ...prev, contacts: updatedContacts }));
  };
  
  const addContact = () => {
    setFormData(prev => ({
      ...prev,
      contacts: [...prev.contacts, {
        name: '',
        role: '',
        email: '',
        phone: '',
        isMain: false
      }]
    }));
  };
  
  const removeContact = (index: number) => {
    const updatedContacts = [...formData.contacts];
    updatedContacts.splice(index, 1);
    setFormData(prev => ({ ...prev, contacts: updatedContacts }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name) {  // Vérifiez le nom du client
      dispatch(addNotification({
        message: 'Veuillez remplir tous les champs obligatoires',
        type: 'error'
      }));
      return;
    }
    
    try {
      setLoading(true);
      dispatch(createClientStart());  // Action correcte
      
      // Récupérer le token d'authentification
      const token = localStorage.getItem('token');
      
      // Corriger l'URL en s'assurant qu'elle ne contient pas de double slash
      const apiUrl = API_URL.endsWith('/') ? `${API_URL}api/clients` : `${API_URL}/api/clients`;
      
      console.log("Envoi des données client:", formData);
      console.log("URL finale utilisée:", apiUrl);
      
      // Appel API avec l'URL correcte
      const response = await axios({
        method: 'post',
        url: apiUrl,
        data: formData,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        }
      });
      
      console.log("Réponse de création client:", response.data);
      
      const createdClient = response.data.client || response.data;
      dispatch(createClientSuccess(createdClient));
      
      dispatch(addNotification({
        message: 'Client créé avec succès!',
        type: 'success'
      }));
      
      navigate('/clients');
    } catch (error: any) {
      console.error("Erreur complète lors de la création du client:", error);
      
      // Afficher un message d'erreur plus détaillé
      const errorMessage = error.response?.data?.message || error.message || 'Erreur lors de la création du client';
      
      dispatch(createClientFailure(errorMessage));
      dispatch(addNotification({
        message: errorMessage,
        type: 'error'
      }));
      
      // Log supplémentaire pour le débogage
      if (error.response) {
        console.error("Réponse d'erreur:", error.response.data);
        console.error("Statut:", error.response.status);
      } else if (error.request) {
        console.error("Pas de réponse reçue:", error.request);
      }
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (formData.name.trim() === '') {
      dispatch(addNotification({
        message: 'Le nom du client est obligatoire',
        type: 'error'
      }));
      return;
    }
    setStep(2);
  };
  
  const prevStep = () => {
    setStep(1);
  };
  
  return (
    <div className="container mx-auto">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {step === 1 ? 'Nouveau Client - Informations' : 'Nouveau Client - Rentabilité'}
          </h1>
          <button
            onClick={() => navigate('/clients')}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
          >
            Annuler
          </button>
        </div>
        
        {/* Indicateur d'étape */}
        <div className="mb-6">
          <div className="flex items-center">
            <div className={`w-10 h-10 flex items-center justify-center rounded-full ${
              step >= 1 ? 'bg-primary-600 text-white' : 'bg-gray-300 text-gray-600'
            }`}>
              1
            </div>
            <div className={`flex-1 h-1 mx-2 ${
              step >= 2 ? 'bg-primary-600' : 'bg-gray-300'
            }`}></div>
            <div className={`w-10 h-10 flex items-center justify-center rounded-full ${
              step >= 2 ? 'bg-primary-600 text-white' : 'bg-gray-300 text-gray-600'
            }`}>
              2
            </div>
          </div>
          <div className="flex mt-2">
            <div className="flex-1 text-center text-sm">Informations</div>
            <div className="flex-1 text-center text-sm">Rentabilité</div>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          {/* Étape 1: Informations du client */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
                  Nom du client *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>
              
              {/* Logo du client */}
              <div>
                <label htmlFor="logo" className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
                  Logo du client
                </label>
                <div className="flex items-center space-x-4">
                  {logoPreview && (
                    <div className="w-20 h-20 border border-gray-300 dark:border-gray-600 rounded-md overflow-hidden">
                      <img src={logoPreview} alt="Aperçu du logo" className="w-full h-full object-contain" />
                    </div>
                  )}
                  <div className="flex-1">
                    <input
                      type="file"
                      id="logo"
                      name="logo"
                      accept="image/*"
                      onChange={handleLogoChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                    />
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      Format recommandé: carré, PNG ou JPG
                    </p>
                  </div>
                </div>
              </div>
              
              <div>
                <label htmlFor="description" className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                  rows={4}
                />
              </div>
              
              <div>
                <label htmlFor="status" className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
                  Statut
                </label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="actif">Actif</option>
                  <option value="inactif">Inactif</option>
                  <option value="archivé">Archivé</option>
                </select>
              </div>
              
              {/* Section des contacts */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-gray-700 dark:text-gray-300 font-medium">
                    Contacts
                  </label>
                  <button
                    type="button"
                    onClick={addContact}
                    className="px-2 py-1 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors text-sm"
                  >
                    + Ajouter un contact
                  </button>
                </div>
                
                {formData.contacts.map((contact, index) => (
                  <div key={index} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-md mb-3">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-medium text-gray-700 dark:text-gray-300">
                        {contact.isMain ? 'Contact principal' : `Contact ${index + 1}`}
                      </h4>
                      {index > 0 && (
                        <button
                          type="button"
                          onClick={() => removeContact(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          Supprimer
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                          Nom
                        </label>
                        <input
                          type="text"
                          name="name"
                          value={contact.name}
                          onChange={(e) => handleContactChange(index, e)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                          Rôle/Fonction
                        </label>
                        <input
                          type="text"
                          name="role"
                          value={contact.role}
                          onChange={(e) => handleContactChange(index, e)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                          Email
                        </label>
                        <input
                          type="email"
                          name="email"
                          value={contact.email}
                          onChange={(e) => handleContactChange(index, e)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                          Téléphone
                        </label>
                        <input
                          type="tel"
                          name="phone"
                          value={contact.phone}
                          onChange={(e) => handleContactChange(index, e)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div>
                <label htmlFor="notes" className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
                  Notes
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                  rows={3}
                />
              </div>
            </div>
          )}
          
          {/* Étape 2: Rentabilité */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg mb-4">
                <h3 className="text-blue-800 dark:text-blue-300 font-medium mb-2">
                  Configuration de la rentabilité
                </h3>
                <p className="text-blue-700 dark:text-blue-400 text-sm">
                  Ces informations vous aideront à suivre la rentabilité du client et à déterminer si vous respectez vos objectifs financiers.
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="hourlyRate" className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
                    Taux horaire (€/h) *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      id="hourlyRate"
                      name="hourlyRate"
                      min="0"
                      step="0.1"
                      value={profitabilityData.hourlyRate}
                      onChange={handleProfitabilityChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                      required
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <span className="text-gray-500">€/h</span>
                    </div>
                  </div>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Le taux horaire que vous souhaitez facturer pour ce client.
                  </p>
                </div>
                
                <div>
                  <label htmlFor="monthlyBudget" className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
                    Budget mensuel (€)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      id="monthlyBudget"
                      name="monthlyBudget"
                      min="0"
                      step="100"
                      value={profitabilityData.monthlyBudget}
                      onChange={handleProfitabilityChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <span className="text-gray-500">€</span>
                    </div>
                  </div>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Le montant mensuel facturé ou budgété pour ce client.
                  </p>
                </div>
                
                <div>
                  <label htmlFor="targetHours" className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
                    Heures cibles par mois
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      id="targetHours"
                      name="targetHours"
                      min="0"
                      step="0.5"
                      value={profitabilityData.targetHours}
                      onChange={handleProfitabilityChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <span className="text-gray-500">h</span>
                    </div>
                  </div>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    {profitabilityData.monthlyBudget > 0 
                      ? `Pour maintenir votre taux horaire de ${profitabilityData.hourlyRate}€/h avec un budget de ${profitabilityData.monthlyBudget}€, vous devez travailler ${profitabilityData.targetHours}h par mois.`
                      : "Nombre d'heures que vous prévoyez de consacrer à ce client par mois."}
                  </p>
                </div>
                
                <div className="flex items-end mb-4">
                  <div className={`w-full p-4 rounded-lg ${
                    profitabilityData.hourlyRate >= 100 
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                      : profitabilityData.hourlyRate >= 75
                        ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
                        : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                  }`}>
                    <h4 className="font-medium mb-1">Analyse de rentabilité</h4>
                    <p className="text-sm">
                      {profitabilityData.hourlyRate >= 100 
                        ? 'Excellent taux horaire ! Vous êtes dans une très bonne fourchette de rentabilité.'
                        : profitabilityData.hourlyRate >= 75
                          ? 'Taux horaire acceptable. Vous pourriez envisager d\'augmenter légèrement vos tarifs.'
                          : 'Attention : taux horaire bas. Essayez d\'augmenter vos tarifs ou de réduire le temps passé sur ce client.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div className="flex justify-between mt-6">
            {step === 2 && (
              <button
                type="button"
                onClick={prevStep}
                className="px-6 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
              >
                Précédent
              </button>
            )}
            
            {step === 1 ? (
              <button
                type="button"
                onClick={nextStep}
                className="ml-auto px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
              >
                Suivant
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors disabled:opacity-50"
              >
                {loading ? (
                  <div className="flex items-center">
                    <svg className="animate-spin h-5 w-5 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Création en cours...
                  </div>
                ) : 'Créer le client'}
              </button>
            )}
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default ClientForm;
