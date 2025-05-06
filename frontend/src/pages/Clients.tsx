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

const Clients: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { clients, loading, error } = useAppSelector(state => state.clients);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('tous');

  // AJOUTE CE BLOC ICI, juste après les déclarations ci-dessus
  // @ts-ignore
  console.log('window.dispatch avant assignation :', window.dispatch);
  // @ts-ignore
  window.dispatch = dispatch;
  // @ts-ignore
  window.fetchClientsSuccess = fetchClientsSuccess;
  // @ts-ignore
  console.log('window.dispatch après assignation :', window.dispatch);

  // Charger les clients au chargement de la page
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

  // Filtrer les clients en fonction de la recherche et du statut
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

  // Debug logs pour vérifier les données du store et du filtre
  console.log('clients du store :', clients);
  console.log('filteredClients :', filteredClients);
  console.log("filteredClients à afficher :", filteredClients);
  if (filteredClients.length > 0) {
    console.log("Premier client :", filteredClients[0]);
  }

  // Naviguer vers la page de détail du client
  const handleClientClick = (clientId: string) => {
    navigate(`/clients/${clientId}`);
  };

  // Naviguer vers la page de création de client
  const handleCreateClient = () => {
    navigate('/clients/new');
  };

  console.log("Clients.tsx monté !");

  return (
    <div className="container mx-auto">
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
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
      )}
    </div>
  );
};

export default Clients;
