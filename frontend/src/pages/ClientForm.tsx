import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '../hooks';
import { createClientStart, createClientSuccess, createClientFailure } from '../store/slices/clientsSlice';
import { clientsService } from '../services/api';
import { addNotification } from '../store/slices/uiSlice';
import { motion } from 'framer-motion';

const ClientForm: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'actif',
    contacts: [],
    notes: '',
    tags: []
  });
  const [loading, setLoading] = useState(false);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      dispatch(createClientStart());
      
      const response = await clientsService.createClient(formData);
      dispatch(createClientSuccess(response.client));
      
      dispatch(addNotification({
        message: 'Client créé avec succès!',
        type: 'success'
      }));
      
      navigate('/clients');
    } catch (error: any) {
      dispatch(createClientFailure(error.message));
      dispatch(addNotification({
        message: error.response?.data?.message || 'Erreur lors de la création du client',
        type: 'error'
      }));
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="container mx-auto">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Nouveau Client</h1>
          <button
            onClick={() => navigate('/clients')}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
          >
            Annuler
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="mb-4">
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
          
          <div className="mb-4">
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
          
          <div className="mb-4">
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
          
          <div className="flex justify-end mt-6">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Création en cours...' : 'Créer le client'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default ClientForm;
