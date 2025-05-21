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
// === Fin : Composant principal ClientForm ===

  // === Début : Initialisation des hooks et récupération des états de navigation ===
  // Explication simple : On prépare des outils pour parler avec le "cerveau" de l'application et pour pouvoir changer de page quand on a fini.
  // Explication technique : Configuration du dispatcher Redux pour les actions et du hook de navigation pour les redirections après soumission.
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  // === Fin : Initialisation des hooks et récupération des états de navigation ===

  // === Début : Configuration des états du formulaire - informations générales ===
  // Explication simple : On crée une grande boîte pour stocker toutes les informations sur le client, comme une fiche avec différentes sections à remplir.
  // Explication technique : Initialisation de l'état local avec useState pour stocker les données du formulaire, avec structure complète et valeurs par défaut.
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
  // === Fin : Configuration des états du formulaire - informations générales ===

  // === Début : États pour la gestion du logo ===
  // Explication simple : On prépare un espace spécial pour l'image du logo du client, comme quand tu gardes un cadre photo prêt pour y mettre une nouvelle photo.
  // Explication technique : Initialisation des états locaux pour gérer le fichier du logo et son aperçu, avec typage explicite pour le fichier.
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>('');
  // === Fin : États pour la gestion du logo ===

  // === Début : Configuration des états de rentabilité ===
  // Explication simple : On crée une boîte spéciale pour les informations sur l'argent que le client va rapporter, comme quand tu notes combien coûtent les choses dans ton tirelire.
  // Explication technique : Initialisation de l'état local pour les données de rentabilité avec structure et valeurs par défaut pour les calculs dynamiques.
  const [profitabilityData, setProfitabilityData] = useState({
    hourlyRate: 100,
    targetHours: 0,
    monthlyBudget: 0,
  });
  // === Fin : Configuration des états de rentabilité ===

  // === Début : États de l'interface utilisateur ===
  // Explication simple : On prépare des indicateurs pour savoir si le formulaire est en train d'envoyer des données et à quelle étape on se trouve, comme des panneaux indicateurs sur un chemin.
  // Explication technique : Initialisation des états locaux pour le statut de chargement et l'étape courante du formulaire multi-étapes.
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  // === Fin : États de l'interface utilisateur ===

  // === Début : Gestion des champs du formulaire général ===
  // Explication simple : Cette fonction s'occupe de mettre à jour les informations quand tu écris quelque chose dans un champ du formulaire, comme quand tu remplis une case sur un dessin "relier les points".
  // Explication technique : Fonction de gestion des événements onChange pour les champs de formulaire génériques, mettant à jour l'état formData de manière immutable.
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };
  // === Fin : Gestion des champs du formulaire général ===

  // === Début : Gestion du logo ===
  // Explication simple : Cette fonction s'occupe de sauvegarder l'image du logo quand tu en choisis une, comme quand tu colles une photo dans un album.
  // Explication technique : Fonction callback pour gérer la mise à jour du logo via le composant LogoUploader, stockant à la fois le fichier et l'aperçu.
  const handleLogoChange = (logo: string, file?: File) => {
    setLogoFile(file || null);
    setFormData((prev) => ({ ...prev, logo }));
    setLogoPreview(logo);
  };
  // === Fin : Gestion du logo ===

  // === Début : Gestion des contacts ===
  // Explication simple : Ces fonctions permettent d'ajouter, modifier ou supprimer des contacts pour le client, comme quand tu ajoutes ou enlèves des personnes dans ta liste d'amis.
  // Explication technique : Collection de fonctions pour manipuler le tableau de contacts dans l'état formData, avec mise à jour immutable de l'état et gestion des index.
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
  // === Fin : Gestion des contacts ===

  // === Début : Gestion des champs de rentabilité ===
  // Explication simple : Cette fonction fait des calculs automatiques quand tu changes un nombre dans la partie rentabilité, comme une calculatrice magique qui remplit les autres cases toute seule.
  // Explication technique : Fonction de gestion des événements onChange pour les champs de rentabilité, incluant des calculs interdépendants entre taux horaire, heures cibles et budget mensuel.
  const handleProfitabilityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numValue = parseFloat(value);

    if (name === 'monthlyBudget' && numValue > 0) {
      const targetHours = Math.round((numValue / profitabilityData.hourlyRate) * 10) / 10;
      setProfitabilityData((prev) => ({
        ...prev,
        [name]: numValue,
        targetHours: targetHours,
      }));
    } else if (name === 'hourlyRate' && numValue > 0) {
      const targetHours =
        profitabilityData.monthlyBudget > 0
          ? Math.round((profitabilityData.monthlyBudget / numValue) * 10) / 10
          : profitabilityData.targetHours;
      setProfitabilityData((prev) => ({
        ...prev,
        [name]: numValue,
        targetHours: targetHours,
      }));
    } else if (name === 'targetHours' && numValue >= 0) {
      const monthlyBudget = Math.round(numValue * profitabilityData.hourlyRate);
      setProfitabilityData((prev) => ({
        ...prev,
        [name]: numValue,
        monthlyBudget: monthlyBudget,
      }));
    } else {
      setProfitabilityData((prev) => ({
        ...prev,
        [name]: numValue,
      }));
    }
  };
  // === Fin : Gestion des champs de rentabilité ===

  // === Début : Navigation entre les étapes ===
  // Explication simple : Ces fonctions te permettent d'avancer à l'étape suivante ou de revenir en arrière dans le formulaire, comme tourner les pages d'un livre d'images.
  // Explication technique : Fonctions pour la navigation entre les étapes du formulaire multi-étapes, avec validation basique pour l'étape 1 et notification d'erreur si nécessaire.
  const nextStep = () => {
    if (formData.name.trim() === '') {
      dispatch(
        addNotification({
          message: 'Le nom du client est obligatoire',
          type: 'error',
        }),
      );
      return;
    }
    setStep(2);
  };

  const prevStep = () => {
    setStep(1);
  };
  // === Fin : Navigation entre les étapes ===

  // === Début : Soumission du formulaire ===
  // Explication simple : Cette fonction envoie toutes les informations remplies au serveur quand tu as fini de compléter le formulaire, comme poster une lettre dans une boîte aux lettres.
  // Explication technique : Fonction asynchrone de gestion de la soumission du formulaire, avec validation, combinaison des données, appel à l'API via axios, gestion des états de chargement et des erreurs via Redux, et redirection après succès.
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

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
  // === Fin : Soumission du formulaire ===

  // === Début : Rendu de l'interface utilisateur ===
  // Explication simple : C'est la partie qui dessine tout le formulaire sur l'écran, comme quand tu assembles toutes les pièces d'un puzzle pour voir l'image complète.
  // Explication technique : Retour du JSX principal qui structure l'interface utilisateur complète du formulaire, avec animations via framer-motion et rendu conditionnel des différentes étapes.
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

        {/* === Début : Indicateur d'étape === */}
        {/* Explication simple : Cette partie montre où tu en es dans le formulaire, comme une barre de progression qui te dit combien d'étapes il reste. */}
        {/* Explication technique : Composant visuel qui indique la progression à travers les étapes du formulaire, avec coloration conditionnelle basée sur l'étape actuelle. */}
        <div className="mb-6">
          <div className="flex items-center">
            <div
              className={`w-10 h-10 flex items-center justify-center rounded-full ${
                step >= 1 ? 'bg-primary-600 text-white' : 'bg-gray-300 text-gray-600'
              }`}
            >
              1
            </div>
            <div
              className={`flex-1 h-1 mx-2 ${
                step >= 2 ? 'bg-primary-600' : 'bg-gray-300'
              }`}
            ></div>
            <div
              className={`w-10 h-10 flex items-center justify-center rounded-full ${
                step >= 2 ? 'bg-primary-600 text-white' : 'bg-gray-300 text-gray-600'
              }`}
            >
              2
            </div>
          </div>
          <div className="flex mt-2">
            <div className="flex-1 text-center text-sm">Informations</div>
            <div className="flex-1 text-center text-sm">Rentabilité</div>
          </div>
        </div>
        {/* === Fin : Indicateur d'étape === */}

        {/* === Début : Étape 1 - Informations du client === */}
        {/* Explication simple : Cette section contient tous les champs pour les informations générales du client comme son nom, son logo et ses contacts, comme une carte d'identité que tu remplis. */}
        {/* Explication technique : Rendu conditionnel de la première étape du formulaire, avec champs pour les informations de base du client, téléchargement de logo et gestion des contacts, organisé en sections distinctes. */}
        {step === 1 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 space-y-4">
            <div>
              <label
                htmlFor="name"
                className="block text-gray-700 dark:text-gray-300 font-medium mb-2"
              >
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

            {/* Logo */}
            <LogoUploader 
              currentLogo={logoPreview} 
              onLogoChange={handleLogoChange}
              className="mb-4"
            />

            <div>
              <label
                htmlFor="description"
                className="block text-gray-700 dark:text-gray-300 font-medium mb-2"
              >
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
              <label
                htmlFor="status"
                className="block text-gray-700 dark:text-gray-300 font-medium mb-2"
              >
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

            {/* Contacts */}
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
                <div
                  key={index}
                  className="bg-gray-50 dark:bg-gray-700 p-4 rounded-md mb-3"
                >
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
              <label
                htmlFor="notes"
                className="block text-gray-700 dark:text-gray-300 font-medium mb-2"
              >
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

            <div className="flex justify-end mt-6">
              <button
                type="button"
                onClick={nextStep}
                className="ml-auto px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
              >
                Suivant
              </button>
            </div>
          </div>
        )}
        {/* === Fin : Étape 1 - Informations du client === */}

        {/* === Début : Étape 2 - Configuration de la rentabilité === */}
        {/* Explication simple : Cette section contient les champs pour définir combien le client va te payer et combien de temps tu vas travailler pour lui, comme quand tu établis un budget pour tes dépenses. */}
        {/* Explication technique : Rendu conditionnel de la deuxième étape du formulaire, avec champs interconnectés pour la rentabilité, calculs dynamiques, analyse conditionnelle, et boutons de navigation et de soumission. */}
        {step === 2 && (
          <form
            onSubmit={handleSubmit}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 space-y-6"
          >
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
                    ? `Pour maintenir votre taux horaire de ${profitabilityData.hourlyRate}€/h avec un budget de ${profitabilityData.monthlyBudget}€, vous devez travailler ${profitabilityData.targetHours} heures par mois.`
                    : "Nombre d'heures que vous prévoyez de consacrer à ce client par mois."}
                </p>
              </div>

              <div className="flex items-end mb-4">
                <div
                  className={`w-full p-4 rounded-lg ${
                    profitabilityData.hourlyRate >= 100
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                      : profitabilityData.hourlyRate >= 75
                      ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
                      : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                  }`}
                >
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

            <div className="flex justify-between mt-6">
              <button
                type="button"
                onClick={prevStep}
                className="px-6 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
              >
                Précédent
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors disabled:opacity-50"
              >
                {loading ? (
                  <div className="flex items-center">
                    <svg
                      className="animate-spin h-5 w-5 mr-2 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Création en cours...
                  </div>
                ) : (
                  'Créer le client'
                )}
              </button>
            </div>
          </form>
        )}
        {/* === Fin : Étape 2 - Configuration de la rentabilité === */}
      </motion.div>
    </div>
  );
  // === Fin : Rendu de l'interface utilisateur ===
};

// === Début : Export du composant ===
// Explication simple : On rend notre formulaire disponible pour que d'autres parties de l'application puissent l'utiliser, comme quand tu partages ton jouet avec tes amis.
// Explication technique : Export par défaut du composant pour permettre son importation dans le système de routage de l'application.
export default ClientForm;
// === Fin : Export du composant ===
