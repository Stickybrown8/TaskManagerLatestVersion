/*
 * FORMULAIRE DE CRÉATION DE CLIENT - frontend/src/pages/ClientForm.tsx
 *
 * Explication simple:
 * Ce fichier crée une page qui te permet d'ajouter un nouveau client à l'application.
 * C'est comme remplir une fiche d'inscription pour un nouveau membre dans un club.
 * Tu remplis ses informations en deux étapes: d'abord ses coordonnées et contacts,
 * puis dans une deuxième étape, tu configures sa rentabilité (combien tu facturas,
 * combien de temps tu vas travailler pour lui, etc.).
 *
 * Explication technique:
 * Composant React fonctionnel qui implémente un formulaire multi-étapes pour la création
 * de nouveaux clients. Il gère la validation des données, le téléchargement de logo,
 * la configuration de la rentabilité avec calculs dynamiques, et l'envoi des données
 * à l'API backend via Redux.
 *
 * Où ce fichier est utilisé:
 * Rendu comme page principale dans l'application lorsque l'utilisateur navigue vers
 * la route '/clients/new' ou un chemin similaire pour l'ajout d'un client.
 *
 * Connexions avec d'autres fichiers:
 * - Utilise les hooks personnalisés useAppDispatch depuis '../hooks'
 * - Importe les actions depuis '../store/slices/clientsSlice' et '../store/slices/uiSlice'
 * - Communique avec l'API backend via axios pour créer de nouveaux clients
 * - Utilise le composant LogoUploader depuis '../components/Clients/LogoUploader'
 */

// === Début : Importation des dépendances ===
// Explication simple : On prend tous les outils dont on a besoin pour construire notre formulaire, comme quand tu rassembles tes crayons et ton papier avant de dessiner.
// Explication technique : Importation des hooks React, des composants de routage, des hooks Redux personnalisés, des actions Redux, des services d'API, et d'autres bibliothèques nécessaires.
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '../hooks';
import { clientsService } from '../services/api';
import {
  fetchClientsStart,
  fetchClientsSuccess,
  fetchClientsFailure,
  createClientStart,
  createClientSuccess,
  createClientFailure,
} from '../store/slices/clientsSlice';
import { addNotification } from '../store/slices/uiSlice';
import { motion } from 'framer-motion';
import axios from 'axios';
import LogoUploader from '../components/Clients/LogoUploader';
// === Fin : Importation des dépendances ===

// === Début : Configuration de l'API ===
// Explication simple : On définit l'adresse du serveur où on va envoyer les informations, comme quand tu écris l'adresse sur une enveloppe avant de l'envoyer.
// Explication technique : Déclaration d'une constante qui stocke l'URL de l'API avec une valeur par défaut en cas d'absence de variable d'environnement.
const API_URL = process.env.REACT_APP_API_URL || 'https://task-manager-api-yx13.onrender.com';
// === Fin : Configuration de l'API ===

// === Début : Composant principal ClientForm ===
// Explication simple : C'est le grand chef d'orchestre qui va organiser toute la page de création de client, comme le chef d'une cuisine qui supervise la préparation d'un plat.
// Explication technique : Définition du composant fonctionnel React avec typage explicite, qui encapsule toute la logique et l'interface utilisateur du formulaire multi-étapes.
const ClientForm: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'actif',
    contacts: [
      {
        name: '',
        role: '',
        email: '',
        phone: '',
        isMain: true,
      },
    ],
    notes: '',
    tags: [] as string[],
    logo: '',
  });

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>('');
  const [profitabilityData, setProfitabilityData] = useState({
    hourlyRate: 100,
    targetHours: 0,
    monthlyBudget: 0,
  });

  const [loading, setLoading] = useState(false);
  const [activeSection, setActiveSection] = useState<'info' | 'profitability'>('info');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Validation en temps réel
  const validateField = (name: string, value: any) => {
    const newErrors = { ...errors };
    
    switch (name) {
      case 'name':
        if (!value.trim()) {
          newErrors.name = 'Le nom est obligatoire';
        } else {
          delete newErrors.name;
        }
        break;
      case 'email':
        if (value && !/\S+@\S+\.\S+/.test(value)) {
          newErrors.email = 'Email invalide';
        } else {
          delete newErrors.email;
        }
        break;
    }
    
    setErrors(newErrors);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    validateField(name, value);
  };

  // Gestion améliorée du drag & drop pour le logo
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      processLogoFile(file);
    }
  };

  const processLogoFile = (file: File) => {
    if (file.size > 2 * 1024 * 1024) {
      dispatch(addNotification({
        message: 'Le logo ne doit pas dépasser 2MB',
        type: 'error'
      }));
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setLogoFile(file);
      setFormData(prev => ({ ...prev, logo: reader.result as string }));
      setLogoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Gestion des contacts
  const handleContactChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const updatedContacts = [...formData.contacts];
    updatedContacts[index] = { ...updatedContacts[index], [name]: value };
    setFormData((prev) => ({ ...prev, contacts: updatedContacts }));
  };

  const addContact = () => {
    setFormData((prev) => ({
      ...prev,
      contacts: [
        ...prev.contacts,
        { name: '', role: '', email: '', phone: '', isMain: false },
      ],
    }));
  };

  const removeContact = (index: number) => {
    const updatedContacts = [...formData.contacts];
    updatedContacts.splice(index, 1);
    setFormData((prev) => ({ ...prev, contacts: updatedContacts }));
  };

  // Gestion des champs de rentabilité
  const handleProfitabilityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numValue = parseFloat(value) || 0;

    // Logique corrigée : monthlyBudget est défini par le client
    // targetHours est calculé automatiquement
    if (name === 'monthlyBudget') {
      const targetHours = profitabilityData.hourlyRate > 0 
        ? Math.round((numValue / profitabilityData.hourlyRate) * 10) / 10
        : 0;
      setProfitabilityData({
        ...profitabilityData,
        monthlyBudget: numValue,
        targetHours: targetHours,
      });
    } else if (name === 'hourlyRate') {
      const targetHours = profitabilityData.monthlyBudget > 0 && numValue > 0
        ? Math.round((profitabilityData.monthlyBudget / numValue) * 10) / 10
        : 0;
      setProfitabilityData({
        ...profitabilityData,
        hourlyRate: numValue,
        targetHours: targetHours,
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation complète
    if (!formData.name.trim()) {
      setErrors({ name: 'Le nom est obligatoire' });
      setActiveSection('info');
      return;
    }

    if (
      !profitabilityData.hourlyRate ||
      profitabilityData.hourlyRate <= 0
    ) {
      dispatch(
        addNotification({
          message: 'Merci de remplir correctement la configuration de la rentabilité.',
          type: 'error',
        }),
      );
      return;
    }

    try {
      setLoading(true);
      dispatch(createClientStart());

      const completeFormData = {
        ...formData,
        profitability: profitabilityData,
      };

      const token = localStorage.getItem('token');
      const apiUrl = API_URL.endsWith('/')
        ? `${API_URL}api/clients`
        : `${API_URL}/api/clients`;

      const response = await axios({
        method: 'post',
        url: apiUrl,
        data: completeFormData,
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : '',
        },
      });

      const createdClient = response.data.client || response.data;
      dispatch(createClientSuccess(createdClient));

      dispatch(fetchClientsStart());
      try {
        const clientsData = await clientsService.getClients();
        dispatch(fetchClientsSuccess(clientsData));
      } catch (err) {
        console.error('Erreur lors du rechargement des clients:', err);
        dispatch(fetchClientsFailure('Erreur lors du rechargement des clients'));
      }

      dispatch(
        addNotification({
          message: 'Client créé avec succès!',
          type: 'success',
        }),
      );

      navigate('/clients');
    } catch (error: any) {
      console.error('Erreur complète lors de la création du client:', error);

      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        'Erreur lors de la création du client';

      dispatch(createClientFailure(errorMessage));
      dispatch(
        addNotification({
          message: errorMessage,
          type: 'error',
        }),
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Header moderne */}
          <div className="mb-8">
            <button
              onClick={() => navigate('/clients')}
              className="mb-4 inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Retour aux clients
            </button>
            
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-[#026aa1] to-[#0487d9] text-transparent bg-clip-text mb-2">
                  Créer un nouveau client
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Ajoutez un client et configurez sa rentabilité en quelques clics
                </p>
              </div>
              
              {/* Indicateur de progression visuel */}
              <div className="hidden md:flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white
                    ${activeSection === 'info' ? 'bg-gradient-to-br from-[#026aa1] to-[#0487d9] shadow-lg' : 'bg-gray-300'}`}>
                    1
                  </div>
                  <span className={`font-medium ${activeSection === 'info' ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}>
                    Informations
                  </span>
                </div>
                <div className="w-16 h-0.5 bg-gray-300" />
                <div className="flex items-center gap-2">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white
                    ${activeSection === 'profitability' ? 'bg-gradient-to-br from-[#026aa1] to-[#0487d9] shadow-lg' : 'bg-gray-300'}`}>
                    2
                  </div>
                  <span className={`font-medium ${activeSection === 'profitability' ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}>
                    Rentabilité
                  </span>
                </div>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Onglets pour mobile */}
            <div className="md:hidden flex bg-gray-100 dark:bg-gray-800 rounded-xl p-1 mb-6">
              <button
                type="button"
                onClick={() => setActiveSection('info')}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
                  activeSection === 'info'
                    ? 'bg-white dark:bg-gray-700 text-[#026aa1] shadow-sm'
                    : 'text-gray-600 dark:text-gray-400'
                }`}
              >
                Informations
              </button>
              <button
                type="button"
                onClick={() => setActiveSection('profitability')}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
                  activeSection === 'profitability'
                    ? 'bg-white dark:bg-gray-700 text-[#026aa1] shadow-sm'
                    : 'text-gray-600 dark:text-gray-400'
                }`}
              >
                Rentabilité
              </button>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Section Informations */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className={`${activeSection === 'profitability' ? 'hidden md:block' : ''}`}
              >
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 space-y-6">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <span className="w-8 h-8 bg-gradient-to-br from-[#026aa1] to-[#0487d9] rounded-lg flex items-center justify-center text-white text-sm">
                      1
                    </span>
                    Informations générales
                  </h2>

                  {/* Logo avec drag & drop amélioré */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Logo du client
                    </label>
                    <div
                      onDrop={handleDrop}
                      onDragOver={(e) => e.preventDefault()}
                      className="relative border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-6 text-center hover:border-[#026aa1] transition-colors cursor-pointer group"
                    >
                      {logoPreview ? (
                        <div className="relative">
                          <img src={logoPreview} alt="Logo" className="w-32 h-32 mx-auto object-contain rounded-xl" />
                          <button
                            type="button"
                            onClick={() => {
                              setLogoFile(null);
                              setLogoPreview('');
                              setFormData(prev => ({ ...prev, logo: '' }));
                            }}
                            className="absolute top-0 right-0 transform translate-x-1/2 -translate-y-1/2 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 transition-colors shadow-lg"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="w-16 h-16 mx-auto bg-gray-100 dark:bg-gray-700 rounded-xl flex items-center justify-center group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20 transition-colors">
                            <svg className="w-8 h-8 text-gray-400 group-hover:text-[#026aa1]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Glissez une image ici ou
                          </p>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => e.target.files?.[0] && processLogoFile(e.target.files[0])}
                            className="hidden"
                            id="logo-upload"
                          />
                          <label
                            htmlFor="logo-upload"
                            className="inline-block px-4 py-2 bg-[#026aa1] text-white rounded-lg hover:bg-[#0487d9] transition-colors cursor-pointer"
                          >
                            Parcourir
                          </label>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Nom du client */}
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Nom du client *
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#026aa1] focus:border-transparent dark:bg-gray-700 dark:text-white transition-all ${
                        errors.name ? 'border-red-300 dark:border-red-600' : 'border-gray-200 dark:border-gray-600'
                      }`}
                      placeholder="Ex: Entreprise ABC"
                    />
                    {errors.name && (
                      <motion.p
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-1 text-sm text-red-600 dark:text-red-400"
                      >
                        {errors.name}
                      </motion.p>
                    )}
                  </div>

                  {/* Description */}
                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Description
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      rows={3}
                      className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#026aa1] focus:border-transparent dark:bg-gray-700 dark:text-white transition-all resize-none"
                      placeholder="Quelques mots sur ce client..."
                    />
                  </div>

                  {/* Statut avec icônes */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Statut
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { value: 'actif', label: 'Actif', icon: '✅', color: 'green' },
                        { value: 'inactif', label: 'Inactif', icon: '⏸️', color: 'yellow' },
                        { value: 'archivé', label: 'Archivé', icon: '📁', color: 'gray' }
                      ].map((status) => (
                        <button
                          key={status.value}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, status: status.value }))}
                          className={`p-3 rounded-xl border-2 transition-all ${
                            formData.status === status.value
                              ? `border-${status.color}-500 bg-${status.color}-50 dark:bg-${status.color}-900/20`
                              : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex flex-col items-center gap-1">
                            <span className="text-2xl">{status.icon}</span>
                            <span className={`text-sm font-medium ${
                              formData.status === status.value ? `text-${status.color}-700 dark:text-${status.color}-300` : 'text-gray-600 dark:text-gray-400'
                            }`}>
                              {status.label}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Contact principal simplifié */}
                  <div className="space-y-4">
                    <h3 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      Contact principal
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="text"
                        name="name"
                        value={formData.contacts[0].name}
                        onChange={(e) => handleContactChange(0, e)}
                        placeholder="Nom"
                        className="px-4 py-2 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#026aa1] focus:border-transparent dark:bg-gray-700 dark:text-white"
                      />
                      <input
                        type="email"
                        name="email"
                        value={formData.contacts[0].email}
                        onChange={(e) => handleContactChange(0, e)}
                        placeholder="Email"
                        className="px-4 py-2 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#026aa1] focus:border-transparent dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Section Rentabilité */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className={`${activeSection === 'info' ? 'hidden md:block' : ''}`}
              >
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 space-y-6">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <span className="w-8 h-8 bg-gradient-to-br from-[#026aa1] to-[#0487d9] rounded-lg flex items-center justify-center text-white text-sm">
                      2
                    </span>
                    Configuration de la rentabilité
                  </h2>

                  {/* Alerte informative */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">💡</span>
                      <div>
                        <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                          Optimisez votre rentabilité
                        </h4>
                        <p className="text-sm text-blue-700 dark:text-blue-300">
                          Définissez vos objectifs financiers pour ce client. Les calculs se font automatiquement!
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Taux horaire avec slider visuel */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Taux horaire souhaité
                    </label>
                    <div className="space-y-3">
                      <div className="flex items-center gap-4">
                        <input
                          type="range"
                          min="50"
                          max="200"
                          step="5"
                          value={profitabilityData.hourlyRate}
                          onChange={(e) => handleProfitabilityChange({ 
                            target: { name: 'hourlyRate', value: e.target.value }
                          } as any)}
                          className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        />
                        <div className="w-24 text-right">
                          <input
                            type="number"
                            name="hourlyRate"
                            value={profitabilityData.hourlyRate}
                            onChange={handleProfitabilityChange}
                            className="w-20 px-2 py-1 text-right border-2 border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#026aa1] dark:bg-gray-700 dark:text-white font-bold text-lg"
                          />
                          <span className="text-sm text-gray-500 ml-1">/h</span>
                        </div>
                      </div>
                      
                      {/* Indicateur de performance */}
                      <div className={`text-sm font-medium ${
                        profitabilityData.hourlyRate >= 150 ? 'text-green-600' :
                        profitabilityData.hourlyRate >= 100 ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>
                        {profitabilityData.hourlyRate >= 150 ? '🚀 Excellent taux! Vous valorisez bien votre expertise' :
                         profitabilityData.hourlyRate >= 100 ? '👍 Bon taux, dans la moyenne du marché' :
                         '⚠️ Attention, ce taux pourrait impacter votre rentabilité'}
                      </div>
                    </div>
                  </div>

                  {/* Budget mensuel du client */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Budget mensuel du client
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-3 text-gray-500">€</span>
                      <input
                        type="number"
                        name="monthlyBudget"
                        value={profitabilityData.monthlyBudget}
                        onChange={handleProfitabilityChange}
                        placeholder="Combien le client paye par mois"
                        className="w-full pl-8 pr-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#026aa1] focus:border-transparent dark:bg-gray-700 dark:text-white font-bold text-lg"
                      />
                    </div>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                      Montant que le client vous verse chaque mois
                    </p>
                  </div>

                  {/* Heures calculées automatiquement */}
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
                    <label className="block text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                      Heures à effectuer par mois
                    </label>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold text-blue-700 dark:text-blue-300">
                        {profitabilityData.targetHours}
                      </span>
                      <span className="text-lg text-blue-600 dark:text-blue-400">heures</span>
                    </div>
                    {profitabilityData.monthlyBudget > 0 && profitabilityData.hourlyRate > 0 && (
                      <p className="mt-2 text-sm text-blue-700 dark:text-blue-300">
                        Soit environ {Math.round(profitabilityData.targetHours / 8 * 10) / 10} jours de travail
                      </p>
                    )}
                  </div>

                  {/* Visualisation de la rentabilité améliorée */}
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-6">
                    <h4 className="font-medium text-green-900 dark:text-green-100 mb-4">
                      Analyse de rentabilité
                    </h4>
                    
                    <div className="space-y-4">
                      {profitabilityData.monthlyBudget > 0 && profitabilityData.hourlyRate > 0 ? (
                        <>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Heures par semaine</span>
                            <span className="font-bold text-gray-900 dark:text-white">
                              {Math.round(profitabilityData.targetHours / 4.33 * 10) / 10}h
                            </span>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Temps consacré</span>
                            <span className={`font-bold ${
                              profitabilityData.targetHours > 80 ? 'text-red-600' :
                              profitabilityData.targetHours > 60 ? 'text-yellow-600' :
                              'text-green-600'
                            }`}>
                              {Math.round(profitabilityData.targetHours / 160 * 100)}% du temps
                            </span>
                          </div>
                          
                          <div className="pt-3 border-t border-green-200 dark:border-green-800">
                            <div className="flex items-center justify-between">
                              <span className="text-lg font-medium text-gray-900 dark:text-white">
                                Revenu annuel
                              </span>
                              <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                                {(profitabilityData.monthlyBudget * 12).toLocaleString()}€
                              </span>
                            </div>
                          </div>

                          {profitabilityData.targetHours > 80 && (
                            <div className="mt-4 p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
                              <p className="text-sm text-red-700 dark:text-red-300">
                                ⚠️ Attention: Ce client demande beaucoup de temps. Considérez d'augmenter votre taux horaire.
                              </p>
                            </div>
                          )}
                        </>
                      ) : (
                        <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                          Remplissez le budget mensuel et votre taux horaire pour voir l'analyse
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Actions */}
            <div className="flex justify-between items-center pt-6">
              <button
                type="button"
                onClick={() => navigate('/clients')}
                className="px-6 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Annuler
              </button>
              
              <button
                type="submit"
                disabled={loading || !!Object.keys(errors).length}
                className="px-8 py-3 bg-gradient-to-r from-[#026aa1] to-[#0487d9] text-white rounded-xl font-medium 
                  hover:from-[#0487d9] hover:to-[#026aa1] disabled:opacity-50 disabled:cursor-not-allowed
                  transform hover:scale-105 transition-all duration-200 shadow-lg flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Création en cours...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Créer le client
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

// === Début : Export du composant ===
// Explication simple : On rend notre formulaire disponible pour que d'autres parties de l'application puissent l'utiliser, comme quand tu partages ton jouet avec tes amis.
// Explication technique : Export par défaut du composant pour permettre son importation dans le système de routage de l'application.
export default ClientForm;
// === Fin : Export du composant ===
