// === Ce fichier affiche une liste de clients avec possibilité de filtrage, recherche et navigation === /workspaces/TaskManagerLatestVersion/frontend/src/pages/Clients.tsx
// Explication simple : C'est comme une page d'annuaire qui montre tous les clients de l'entreprise. Tu peux chercher un client, voir son statut et cliquer dessus pour avoir plus d'informations.
// Explication technique : Composant React fonctionnel qui utilise Redux pour la gestion d'état, React Router pour la navigation, et affiche une liste filtrée de clients avec des animations via Framer Motion.
// Utilisé dans : Probablement dans un Router principal comme composant de page
// Connecté à : clientsSlice.ts (Redux), uiSlice.ts (notifications), clientsService.ts (API), et le composant ClientLogo

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../hooks';
import { fetchClientsStart, fetchClientsSuccess, fetchClientsFailure } from '../store/slices/clientsSlice';
import { clientsService } from '../services/api';
import { addNotification } from '../store/slices/uiSlice';
import { motion } from 'framer-motion';
import ClientLogo from '../components/Clients/ClientLogo';

// Les logs ou tout autre code doivent venir APRÈS les imports
console.log('fetchClientsSuccess importé de', import.meta.url || "pas d'info require");

// === Début : Composant principal Clients ===
// Explication simple : C'est le gros container qui contient toute la page des clients, comme une boîte qui contient tout.
// Explication technique : Composant React fonctionnel principal qui encapsule toute la logique et l'interface utilisateur pour la gestion des clients.
const Clients: React.FC = () => {
  // === Début : Hooks et état du composant ===
  // Explication simple : Ce sont les outils dont la page a besoin pour fonctionner, comme une boîte à outils.
  // Explication technique : Initialisation des hooks Redux (dispatch, selector) et des états locaux (useState) pour gérer la recherche et le filtrage.
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { clients, loading, error } = useAppSelector(state => state.clients);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('tous');
  // === Fin : Hooks et état du composant ===

  // === Début : Exposition Redux pour débogage ===
  // Explication simple : On met des outils dans la fenêtre pour pouvoir regarder ce qui se passe quand il y a un problème.
  // Explication technique : Exposition des fonctions Redux sur l'objet window global pour faciliter le débogage via la console du navigateur.
  // @ts-ignore
  console.log('window.dispatch avant assignation :', window.dispatch);
  // @ts-ignore
  window.dispatch = dispatch;
  // @ts-ignore
  window.fetchClientsSuccess = fetchClientsSuccess;
  // @ts-ignore
  console.log('window.dispatch après assignation :', window.dispatch);
  // === Fin : Exposition Redux pour débogage ===

  // === Début : Chargement des clients au montage ===
  // Explication simple : Quand la page s'ouvre, on va chercher tous les clients pour les afficher.
  // Explication technique : Hook useEffect qui déclenche une requête API asynchrone au montage du composant, avec gestion des états de chargement et d'erreur via Redux.
  useEffect(() => {
    const loadClients = async () => {
      try {
        console.log('→ fetch clients ...');
        dispatch(fetchClientsStart());
        const data = await clientsService.getClients();
        console.log('→ données reçues de l’API :', data);
        dispatch(fetchClientsSuccess(data));
        // Ajoute CES DEUX LIGNES juste ici :
        // @ts-ignore
        window.dispatch = dispatch;
        // @ts-ignore
        window.fetchClientsSuccess = fetchClientsSuccess;
      } catch (error: any) {
        console.error('→ Erreur lors du fetch clients :', error);
        dispatch(fetchClientsFailure(error.message));
        dispatch(addNotification({
          message: 'Erreur lors du chargement des clients',
          type: 'error'
        }));
      }
    };

    loadClients();
  }, [dispatch]);
  // === Fin : Chargement des clients au montage ===

  // === Début : Filtrage des clients ===
  // Explication simple : On trie les clients selon ce que tu as tapé dans la recherche ou le statut que tu as choisi.
  // Explication technique : Fonction qui filtre la liste des clients en fonction des critères de recherche textuelle et du filtre de statut sélectionné.
  const filteredClients = clients.filter(client => {
    const search = searchTerm.trim().toLowerCase();
    const clientName = (client.name || '').trim().toLowerCase();
    const clientDescription = (client.description || '').trim().toLowerCase();
    const matchesSearch = clientName.includes(search) || clientDescription.includes(search);

    const matchesStatus =
      statusFilter === 'tous' ||
      (client.status || '').trim().toLowerCase() === statusFilter.trim().toLowerCase();

    return matchesSearch && matchesStatus;
  });
  // === Fin : Filtrage des clients ===

  // === Début : Logs de débogage ===
  // Explication simple : On regarde dans la console pour vérifier que nos clients sont bien là.
  // Explication technique : Affichage dans la console des clients récupérés et filtrés pour faciliter le débogage pendant le développement.
  console.log('clients du store :', clients);
  console.log('filteredClients :', filteredClients);
  console.log("filteredClients à afficher :", filteredClients);
  if (filteredClients.length > 0) {
    console.log("Premier client :", filteredClients[0]);
  }
  // === Fin : Logs de débogage ===

  // === Début : Fonctions de navigation ===
  // Explication simple : Ces boutons te permettent d'aller voir un client en détail ou d'en créer un nouveau.
  // Explication technique : Fonctions de gestion des événements qui déclenchent la navigation vers d'autres routes via React Router.
  const handleClientClick = (clientId: string) => {
    navigate(`/clients/${clientId}`);
  };

  const handleCreateClient = () => {
    navigate('/clients/new');
  };
  // === Fin : Fonctions de navigation ===

  console.log("Clients.tsx monté !");

  // === Début : Rendu de l'interface ===
  // Explication simple : C'est tout ce qu'on va voir à l'écran - l'apparence de la page.
  // Explication technique : Fonction de rendu JSX qui affiche l'interface utilisateur avec gestion conditionnelle des états (chargement, erreur, résultats vides) et utilisation de Tailwind CSS pour le style.
  return (
    <div className="container mx-auto">
      // === Début : En-tête et bouton d'ajout ===
      // Explication simple : Le titre de la page avec un bouton pour ajouter un nouveau client.
      // Explication technique : Section d'en-tête responsive avec titre et bouton d'action principal.
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Clients</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">Gérez vos clients et leurs projets</p>
        </div>
        <button
          onClick={handleCreateClient}
          className="mt-4 md:mt-0 px-6 py-3 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors flex items-center shadow-md hover:shadow-lg"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Nouveau client
        </button>
      </div>
      // === Fin : En-tête et bouton d'ajout ===

      // === Début : Filtres de recherche ===
      // Explication simple : Des champs pour chercher un client par son nom ou filtrer par statut.
      // Explication technique : Formulaire de recherche et de filtrage avec inputs contrôlés reliés aux états locaux du composant.
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Rechercher
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                id="search"
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                placeholder="Rechercher un client..."
              />
            </div>
          </div>
          <div className="md:w-48">
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Statut
            </label>
            <select
              id="status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white appearance-none bg-no-repeat bg-right"
              style={{ 
                backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236B7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E\")",
                backgroundSize: "1.25rem",
                paddingRight: "2.5rem"
              }}
            >
              <option value="tous">Tous</option>
              <option value="actif">Actif</option>
              <option value="inactif">Inactif</option>
              <option value="archivé">Archivé</option>
            </select>
          </div>
        </div>
      </div>
      // === Fin : Filtres de recherche ===

      // === Début : Affichage conditionnel des clients ===
      // Explication simple : On montre soit un chargement, soit une erreur, soit "aucun client", soit la liste des clients selon la situation.
      // Explication technique : Rendu conditionnel basé sur les états de chargement, d'erreur et la présence de résultats filtrés.
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
        </div>
      ) : error ? (
        <div className="bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 p-4 rounded-md">
          {error}
        </div>
      ) : filteredClients.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-12 text-center"
        >
          <div className="bg-gray-100 dark:bg-gray-700 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 018 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Aucun client trouvé</h3>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            {searchTerm || statusFilter !== 'tous' 
              ? "Aucun client ne correspond à vos critères de recherche." 
              : "Vous n'avez pas encore ajouté de clients."}
          </p>
          <button
            onClick={handleCreateClient}
            className="px-6 py-3 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors inline-flex items-center shadow-md"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Ajouter un client
          </button>
        </motion.div>
      ) : (
        // === Début : Grille des cartes clients ===
        // Explication simple : Une grille avec une carte pour chaque client qui montre ses informations.
        // Explication technique : Grid responsive de cartes clients avec animations Framer Motion et gestion robuste des erreurs de rendu.
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClients.map((client, index) => {
            try {
              return (
                <motion.div
                  key={client._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  whileHover={{ y: -5, transition: { duration: 0.2 } }}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => handleClientClick(client._id)}
                >
                  <div className="p-6">
                    <div className="flex items-start mb-4">
                      {/* Ajouter cette div pour le logo */}
                      <div className="mr-4">
                        <ClientLogo client={client} size="large" shape="rounded" />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <h2 className="text-xl font-semibold text-gray-900 dark:text-white truncate">{client.name}</h2>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            client.status === 'actif' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                            client.status === 'inactif' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                            'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                          }`}>
                            {client.status.charAt(0).toUpperCase() + client.status.slice(1)}
                          </span>
                        </div>
                        <p className="text-gray-600 dark:text-gray-300 mt-2 mb-4 line-clamp-2">{client.description}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-4">
                      <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span>
                        Dernière activité:{" "}
                        {client.metrics && client.metrics.lastActivity
                          ? new Date(client.metrics.lastActivity).toLocaleDateString()
                          : "N/A"}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="bg-primary-50 dark:bg-primary-900 p-2 rounded-md">
                        <div className="text-lg font-bold text-primary-600 dark:text-primary-400">
                          {client.metrics?.tasksCompleted ?? 0}
                        </div>
                        <div className="text-xs text-primary-800 dark:text-primary-200">Terminées</div>
                      </div>
                      <div className="bg-yellow-50 dark:bg-yellow-900 p-2 rounded-md">
                        <div className="text-lg font-bold text-yellow-600 dark:text-yellow-400">
                          {client.metrics?.tasksInProgress ?? 0}
                        </div>
                        <div className="text-xs text-yellow-800 dark:text-yellow-200">En cours</div>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-700 p-2 rounded-md">
                        <div className="text-lg font-bold text-gray-600 dark:text-gray-300">
                          {client.metrics?.tasksPending ?? 0}
                        </div>
                        <div className="text-xs text-gray-800 dark:text-gray-200">À faire</div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            } catch (e) {
              console.error("Erreur lors du rendu d'un client :", client, e, JSON.stringify(client));
              if (e instanceof Error) {
                alert("Erreur JS : " + e.message);
              }
              return <div key={client._id} style={{ color: 'red' }}>Erreur de rendu client</div>;
            }
          })}
        </div>
        // === Fin : Grille des cartes clients ===
      )}
      // === Fin : Affichage conditionnel des clients ===
    </div>
  );
  // === Fin : Rendu de l'interface ===
};
// === Fin : Composant principal Clients ===

export default Clients;
