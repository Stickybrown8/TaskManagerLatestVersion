/*
 * PAGE DE DÉTAIL CLIENT - frontend/src/pages/ClientDetail.tsx
 *
 * Explication simple:
 * Ce fichier crée la page qui te montre toutes les informations sur un client spécifique. 
 * Tu peux y voir son nom, sa description, son logo, ses contacts, etc. Tu peux aussi 
 * modifier ces informations, voir les tâches associées à ce client, et même supprimer 
 * le client si nécessaire. C'est comme une fiche d'identité complète que tu peux consulter 
 * et modifier.
 *
 * Explication technique:
 * Composant React fonctionnel qui implémente une page de visualisation et d'édition détaillée
 * d'un client. Il gère la récupération des données depuis l'API, l'affichage conditionnel
 * selon les différents états (chargement, édition, erreur), la mise à jour des informations
 * client incluant les données de rentabilité, et l'intégration avec les tâches associées.
 *
 * Où ce fichier est utilisé:
 * Rendu comme page principale dans l'application lorsque l'utilisateur navigue vers la route
 * '/clients/:id', où ':id' est l'identifiant unique du client à afficher.
 *
 * Connexions avec d'autres fichiers:
 * - Utilise les hooks personnalisés useAppSelector et useAppDispatch depuis '../hooks'
 * - Importe actions depuis '../store/slices/clientsSlice' et '../store/slices/uiSlice'
 * - Utilise le hook useTasks depuis '../hooks/useTasks' pour récupérer les tâches liées
 * - Importe les composants LogoUploader et ClientLogo depuis '../components/Clients/'
 * - Communique avec l'API backend via axios pour les opérations CRUD sur les clients
 */

// === Début : Importation des dépendances ===
// Explication simple : On prend tous les outils dont on a besoin pour faire fonctionner notre page de client, comme quand tu rassembles tes jouets avant de commencer à jouer.
// Explication technique : Importation des hooks React pour la gestion d'état et du cycle de vie, des composants de routage, des hooks Redux personnalisés, des actions Redux, des services d'API, des composants UI spécifiques et des bibliothèques tierces.
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../hooks';
import { fetchClientStart, fetchClientSuccess, fetchClientFailure, updateClientStart, updateClientSuccess, updateClientFailure, deleteClientStart, deleteClientSuccess, deleteClientFailure } from '../store/slices/clientsSlice';
import { clientsService } from '../services/api';
import { addNotification } from '../store/slices/uiSlice';
import { motion } from 'framer-motion';
import axios from 'axios';
import { useTasks } from '../hooks/useTasks'; // Ajouter cet import
import LogoUploader from '../components/Clients/LogoUploader';
import ClientLogo from '../components/Clients/ClientLogo';

const API_URL = process.env.REACT_APP_API_URL || 'https://task-manager-api-yx13.onrender.com';
// === Fin : Importation des dépendances ===

// === Début : Définition des interfaces TypeScript ===
// Explication simple : On explique à l'ordinateur à quoi ressemble une tâche, avec toutes ses caractéristiques, comme quand tu décris à quoi ressemble un animal.
// Explication technique : Déclaration d'une interface TypeScript qui définit la structure d'objet pour les tâches, avec typage strict des propriétés et gestion des cas où clientId peut être soit une chaîne, soit un objet.
interface Task {
  _id: string;
  title: string;
  description?: string;
  status: string;
  dueDate?: string;
  clientId?: string | { _id: string; name?: string };
}
// === Fin : Définition des interfaces TypeScript ===

// === Début : Composant principal ClientDetail ===
// Explication simple : C'est le grand chef d'orchestre qui va organiser toute la page de détail du client, comme le chef d'une cuisine qui supervise la préparation d'un repas.
// Explication technique : Définition du composant fonctionnel React avec typage explicite, qui encapsule toute la logique et l'interface utilisateur de la page de détail client.
const ClientDetail: React.FC = () => {
// === Fin : Composant principal ClientDetail ===

  // === Début : Initialisation des hooks et des états ===
  // Explication simple : On prépare tous les ingrédients et ustensiles dont on aura besoin pour notre recette, comme quand tu sors tout ce qu'il te faut avant de cuisiner.
  // Explication technique : Configuration des hooks de routage pour l'identifiant et la navigation, initialisation du dispatcher Redux, récupération de l'état client depuis le store, et définition des états locaux pour le mode d'édition, la confirmation de suppression et les données du formulaire.
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  
  const clientsState = useAppSelector(state => state.clients || {});
  const { currentClient, loading, error } = clientsState;  
  const [isEditing, setIsEditing] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'actif',
    contacts: [] as any[],
    notes: '',
    tags: [] as string[],
    profitability: {
      hourlyRate: 100,
      targetHours: 0,
      monthlyBudget: 0
    },
    logo: '' // Ajouté ici
  });

  const { tasks, loading: tasksLoading, error: tasksError, refreshTasks } = useTasks(id);

  // États pour gérer le logo
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>('');
  // === Fin : Initialisation des hooks et des états ===

  // === Début : Chargement des données du client ===
  // Explication simple : Quand tu ouvres la page, on va chercher automatiquement toutes les informations sur le client, comme quand ton téléphone se connecte tout seul au Wi-Fi quand tu rentres chez toi.
  // Explication technique : Hook useEffect qui s'exécute au montage du composant et lors des changements d'identifiant pour récupérer les données du client depuis l'API avec gestion des erreurs et mise à jour du state local.
  useEffect(() => {
    const loadClient = async () => {
      if (id) {
        try {
          dispatch(fetchClientStart());
          
          // Récupérer le token d'authentification
          const token = localStorage.getItem('token');
          
          if (!token) {
            throw new Error("Token d'authentification manquant");
          }
          
          // Charger les détails du client
          const response = await axios.get(`${API_URL}/api/clients/${id}`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          const clientData = response.data;
          dispatch(fetchClientSuccess(clientData));
          
          // Charger les données de rentabilité si disponibles
          try {
            const profitabilityResponse = await axios.get(`${API_URL}/api/profitability/client/${id}`, {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });
            
            // Fusionner les données de rentabilité avec les données du client
            clientData.profitability = profitabilityResponse.data;
          } catch (err) {
            console.log('Pas de données de rentabilité pour ce client');
          }
          
          // Mettre à jour le formulaire avec les données du client
          setFormData({
            name: clientData.name || '',
            description: clientData.description || '',
            status: clientData.status || 'actif',
            contacts: clientData.contacts || [],
            notes: clientData.notes || '',
            tags: clientData.tags || [],
            logo: clientData.logo || '', // Ajouté ici
            profitability: {
              hourlyRate: clientData.profitability?.hourlyRate || 100,
              targetHours: clientData.profitability?.targetHours || 0,
              monthlyBudget: clientData.profitability?.monthlyBudget || 0
            }
          });
          
        } catch (error: any) {
          console.error("Erreur lors du chargement du client:", error);
          dispatch(fetchClientFailure(error.message));
          dispatch(addNotification({
            message: 'Erreur lors du chargement des informations du client',
            type: 'error'
          }));
        }
      }
    };

    loadClient();
  }, [dispatch, id]);
  // === Fin : Chargement des données du client ===

  // === Début : Initialisation du logo ===
  // Explication simple : On prépare l'image du logo du client pour la montrer, comme quand tu prépares une photo dans un cadre.
  // Explication technique : Hook useEffect qui surveille les changements du client courant pour initialiser l'aperçu du logo avec l'URL du logo existant.
  useEffect(() => {
    if (currentClient && currentClient.logo) {
      setLogoPreview(currentClient.logo);
    }
  }, [currentClient]);
  // === Fin : Initialisation du logo ===

  // === Début : Fonctions de gestion des formulaires ===
  // Explication simple : Ces fonctions permettent de changer les informations du client quand tu modifies le formulaire, comme quand tu changes les réponses sur une fiche d'enquête.
  // Explication technique : Collection de gestionnaires d'événements qui mettent à jour l'état du formulaire en réponse aux interactions utilisateur, avec logique spécifique pour les différents types de champs.
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleProfitabilityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numValue = parseFloat(value);

    if (name === 'monthlyBudget' && numValue > 0) {
      const targetHours = Math.round((numValue / formData.profitability.hourlyRate) * 10) / 10;
      setFormData(prev => ({
        ...prev,
        profitability: {
          ...prev.profitability,
          [name]: numValue,
          targetHours
        }
      }));
    } else if (name === 'hourlyRate' && numValue > 0) {
      const targetHours =
        formData.profitability.monthlyBudget > 0
          ? Math.round((formData.profitability.monthlyBudget / numValue) * 10) / 10
          : formData.profitability.targetHours;
      setFormData(prev => ({
        ...prev,
        profitability: {
          ...prev.profitability,
          [name]: numValue,
          targetHours
        }
      }));
    } else if (name === 'targetHours' && numValue >= 0) {
      const monthlyBudget = Math.round(numValue * formData.profitability.hourlyRate);
      setFormData(prev => ({
        ...prev,
        profitability: {
          ...prev.profitability,
          [name]: numValue,
          monthlyBudget
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        profitability: {
          ...prev.profitability,
          [name]: numValue
        }
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
      contacts: [
        ...prev.contacts,
        { name: '', role: '', email: '', phone: '', isMain: false }
      ]
    }));
  };

  const removeContact = (index: number) => {
    const updatedContacts = [...formData.contacts];
    updatedContacts.splice(index, 1);
    setFormData(prev => ({ ...prev, contacts: updatedContacts }));
  };

  const handleLogoChange = (logo: string, file?: File) => {
    setLogoFile(file || null);
    setFormData(prev => ({ ...prev, logo }));
    setLogoPreview(logo);
  };
  // === Fin : Fonctions de gestion des formulaires ===

  // === Début : Fonction de soumission du formulaire ===
  // Explication simple : Cette fonction envoie toutes les informations modifiées du client au serveur quand tu cliques sur "Enregistrer", comme quand tu poster une lettre dans une boîte aux lettres.
  // Explication technique : Fonction asynchrone qui gère la soumission du formulaire, dispatche les actions Redux appropriées, effectue la requête PUT pour mettre à jour le client avec gestion des erreurs et des notifications.
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!id) return;
    
    try {
      dispatch(updateClientStart());
      
      // Récupérer le token d'authentification
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error("Token d'authentification manquant");
      }
      
      // Mettre à jour les informations du client
      const response = await axios.put(`${API_URL}/api/clients/${id}`, formData, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const updatedClient = response.data.client || response.data;
      dispatch(updateClientSuccess(updatedClient));
      
      // Mettre à jour les données de rentabilité
      try {
        await axios.post(`${API_URL}/api/profitability/client/${id}`, formData.profitability, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      } catch (err) {
        console.error("Erreur lors de la mise à jour des données de rentabilité:", err);
      }
      
      dispatch(addNotification({
        message: 'Client mis à jour avec succès!',
        type: 'success'
      }));
      
      setIsEditing(false);
    } catch (error: any) {
      console.error("Erreur lors de la mise à jour du client:", error);
      dispatch(updateClientFailure(error.message));
      dispatch(addNotification({
        message: 'Erreur lors de la mise à jour du client',
        type: 'error'
      }));
    }
  };
  // === Fin : Fonction de soumission du formulaire ===

  // === Début : Fonction de suppression du client ===
  // Explication simple : Cette fonction supprime complètement le client de la base de données quand tu confirmes vouloir le supprimer, comme quand tu effaces définitivement un dessin.
  // Explication technique : Fonction asynchrone qui gère la suppression du client, dispatche les actions Redux correspondantes, effectue la requête DELETE à l'API, puis redirige l'utilisateur vers la liste des clients.
  const handleDelete = async () => {
    if (!id) return;
    
    try {
      dispatch(deleteClientStart());
      
      // Récupérer le token d'authentification
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error("Token d'authentification manquant");
      }
      
      // Supprimer le client
      await axios.delete(`${API_URL}/api/clients/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      dispatch(deleteClientSuccess(id));
      dispatch(addNotification({
        message: 'Client supprimé avec succès!',
        type: 'success'
      }));
      
      navigate('/clients');
    } catch (error: any) {
      console.error("Erreur lors de la suppression du client:", error);
      dispatch(deleteClientFailure(error.message));
      dispatch(addNotification({
        message: 'Erreur lors de la suppression du client',
        type: 'error'
      }));
    }
  };
  // === Fin : Fonction de suppression du client ===

  // === Début : Rendu conditionnel pour les états de chargement et d'erreur ===
  // Explication simple : Ces parties montrent un message d'attente ou d'erreur si les informations du client ne sont pas encore prêtes ou s'il y a eu un problème, comme quand une application te dit "chargement en cours..." ou "oups, quelque chose s'est mal passé".
  // Explication technique : Blocs de rendu conditionnel qui retournent des composants UI appropriés selon l'état du chargement, la présence d'erreurs ou l'absence de données client, avec des messages explicites et des options de navigation.
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 p-4 rounded-md">
          <p>Une erreur est survenue lors du chargement du client : {error}</p>
          <button 
            onClick={() => navigate('/clients')}
            className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
          >
            Retour à la liste des clients
          </button>
        </div>
      </div>
    );
  }

  if (!currentClient && !formData.name) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-200 p-4 rounded-md">
          <p>Client non trouvé.</p>
          <button 
            onClick={() => navigate('/clients')}
            className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
          >
            Retour à la liste des clients
          </button>
        </div>
      </div>
    );
  }
  // === Fin : Rendu conditionnel pour les états de chargement et d'erreur ===

  // === Début : Rendu principal du composant ===
  // Explication simple : C'est la partie qui dessine toute la page avec toutes les informations du client, comme quand tu assembles toutes les pièces d'un puzzle pour voir l'image complète.
  // Explication technique : Retour du JSX principal qui structure l'interface utilisateur complète de la page, avec en-tête, modale de confirmation de suppression, et rendu conditionnel entre mode édition et mode visualisation.
  return (
    <div className="container mx-auto px-4 py-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {isEditing ? 'Modifier le client' : formData.name}
          </h1>
          
          <div className="flex space-x-2">
            {!isEditing ? (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                >
                  Modifier
                </button>
                <button
                  onClick={() => setDeleteConfirmOpen(true)}
                  className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
                >
                  Supprimer
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
              >
                Annuler
              </button>
            )}
          </div>
        </div>
        
        {deleteConfirmOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md mx-auto">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Confirmer la suppression</h2>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Êtes-vous sûr de vouloir supprimer ce client ? Cette action est irréversible.
              </p>
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setDeleteConfirmOpen(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
                >
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        )}
  // === Fin : Rendu principal du composant ===
        
  // === Début : Rendu du formulaire d'édition ===
  // Explication simple : C'est la partie qui montre tous les champs à remplir quand tu veux modifier les informations du client, comme un questionnaire que tu dois compléter.
  // Explication technique : Rendu conditionnel du formulaire en mode édition, avec structure complète des champs, validation et soumission, organisé en sections logiques (informations générales, rentabilité, contacts).
        {isEditing ? (
          <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 space-y-6">
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
              
              <div className="mb-4">
                <label htmlFor="logo" className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
                  Logo du client
                </label>
                <LogoUploader
                  currentLogo={formData.logo || ''}
                  onLogoChange={handleLogoChange}
                  className="mb-4"
                />
              </div>
              
              {/* Configuration de rentabilité */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Configuration de rentabilité</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label htmlFor="hourlyRate" className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
                      Taux horaire (€/h)
                    </label>
                    <input
                      type="number"
                      id="hourlyRate"
                      name="hourlyRate"
                      value={formData.profitability.hourlyRate}
                      onChange={handleProfitabilityChange}
                      min="0"
                      step="0.1"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="monthlyBudget" className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
                      Budget mensuel (€)
                    </label>
                    <input
                      type="number"
                      id="monthlyBudget"
                      name="monthlyBudget"
                      value={formData.profitability.monthlyBudget}
                      onChange={handleProfitabilityChange}
                      min="0"
                      step="100"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="targetHours" className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
                      Heures cibles par mois
                    </label>
                    <input
                      type="number"
                      id="targetHours"
                      name="targetHours"
                      value={formData.profitability.targetHours}
                      onChange={handleProfitabilityChange}
                      min="0"
                      step="0.5"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>
              </div>
              
              {/* Contacts */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Contacts</h3>
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
            
            <div className="flex justify-end mt-6">
              <button
                type="submit"
                className="px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
              >
                Enregistrer les modifications
              </button>
            </div>
          </form>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Informations</h2>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Description</h3>
                    <p className="text-gray-800 dark:text-gray-200 mt-1">{formData.description || 'Aucune description'}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Statut</h3>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium mt-1 ${
                      formData.status === 'actif' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                      formData.status === 'inactif' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                      'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                    }`}>
                      {formData.status.charAt(0).toUpperCase() + formData.status.slice(1)}
                    </span>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Notes</h3>
                    <p className="text-gray-800 dark:text-gray-200 mt-1">{formData.notes || 'Aucune note'}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Contacts</h2>
                
                {formData.contacts.length === 0 ? (
                  <p className="text-gray-600 dark:text-gray-400">Aucun contact enregistré.</p>
                ) : (
                  <div className="space-y-4">
                    {formData.contacts.map((contact, index) => (
                      <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium text-gray-900 dark:text-white">{contact.name}</h3>
                          {contact.isMain && (
                            <span className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 text-xs font-medium px-2 py-1 rounded-full">
                              Contact principal
                            </span>
                          )}
                        </div>
                        
                        <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                          {contact.role && (
                            <div>
                              <span className="text-gray-500 dark:text-gray-400">Rôle:</span> {contact.role}
                            </div>
                          )}
                          {contact.email && (
                            <div>
                              <span className="text-gray-500 dark:text-gray-400">Email:</span>{' '}
                              <a href={`mailto:${contact.email}`} className="text-primary-600 dark:text-primary-400 hover:underline">
                                {contact.email}
                              </a>
                            </div>
                          )}
                          {contact.phone && (
                            <div>
                              <span className="text-gray-500 dark:text-gray-400">Téléphone:</span>{' '}
                              <a href={`tel:${contact.phone}`} className="text-primary-600 dark:text-primary-400 hover:underline">
                                {contact.phone}
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            <div>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Rentabilité</h2>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Taux horaire</h3>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{formData.profitability.hourlyRate} €/h</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Budget mensuel</h3>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{formData.profitability.monthlyBudget} €</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Heures cibles</h3>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{formData.profitability.targetHours} h</p>
                  </div>
                  
                  <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Revenus horaires</h3>
                      <p className={`text-lg font-semibold ${
                        formData.profitability.hourlyRate >= 100 ? 'text-green-600 dark:text-green-400' :
                        formData.profitability.hourlyRate >= 75 ? 'text-yellow-600 dark:text-yellow-400' :
                        'text-red-600 dark:text-red-400'
                      }`}>
                        {formData.profitability.hourlyRate} €/h
                      </p>
                    </div>
                    <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full mt-2">
                      <div 
                        className={`h-full rounded-full ${
                          formData.profitability.hourlyRate >= 100 ? 'bg-green-500 dark:bg-green-400' :
                          formData.profitability.hourlyRate >= 75 ? 'bg-yellow-500 dark:bg-yellow-400' :
                          'bg-red-500 dark:bg-red-400'
                        }`}
                        style={{ width: `${Math.min(100, (formData.profitability.hourlyRate / 150) * 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Statistiques</h2>
                
                <div className="space-y-4">
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <div className="text-sm text-gray-500 dark:text-gray-400">Tâches terminées</div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                      {(currentClient?.metrics?.tasksCompleted || 0).toString()}
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <div className="text-sm text-gray-500 dark:text-gray-400">Tâches en cours</div>
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
                      {(currentClient?.metrics?.tasksInProgress || 0).toString()}
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <div className="text-sm text-gray-500 dark:text-gray-400">Tâches à faire</div>
                    <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mt-1">
                      {(currentClient?.metrics?.tasksPending || 0).toString()}
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <div className="text-sm text-gray-500 dark:text-gray-400">Dernière activité</div>
                    <div className="text-lg font-medium text-gray-900 dark:text-white mt-1">
                      {currentClient?.metrics?.lastActivity 
                        ? new Date(currentClient.metrics.lastActivity).toLocaleDateString()
                        : 'Jamais'
                      }
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {!isEditing && (
              <div className="md:col-span-3 mt-6">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                    Tâches associées ({tasks?.length || 0})
                  </h2>
                  
                  {tasksLoading ? (
                    <div>Chargement des tâches...</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead>
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Titre
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Statut
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Échéance
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                          {tasks.map(task => (
                            <tr key={typeof task._id === 'object' ? (task._id as any)._id : task._id} 
                                className="hover:bg-gray-50 dark:hover:bg-gray-750">
                              <td className="px-4 py-3 whitespace-nowrap">
                                {task.title}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  task.status === 'terminée' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                                  task.status === 'en cours' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                                  'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                }`}>
                                  {task.status}
                                </span>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                {task.dueDate && !isNaN(new Date(task.dueDate).getTime()) 
                                  ? new Date(task.dueDate).toLocaleDateString() 
                                  : 'Non définie'}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                                <Link 
                                  to={`/tasks/${typeof task._id === 'object' ? (task._id as any)._id : task._id}`}
                                  className="text-primary-600 dark:text-primary-400 hover:text-primary-900 dark:hover:text-primary-300"
                                >
                                  Voir
                                </Link>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
};

// === Fin : Rendu du formulaire d'édition ===

  // === Début : Export du composant ===
  // Explication simple : On rend notre page disponible pour que l'application puisse l'afficher quand on clique sur un client, comme quand tu mets ton dessin dans un livre pour que d'autres puissent le voir.
  // Explication technique : Export par défaut du composant pour permettre son importation et son utilisation dans le système de routage de l'application.
export default ClientDetail;
  // === Fin : Export du composant ===
