import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppDispatch } from '../hooks';
import { addNotification } from '../store/slices/uiSlice';
import { motion } from 'framer-motion';
import { tasksService } from '../services/api';

interface Task {
  _id: string;
  title: string;
  description: string;
  clientId: { _id: string; name: string } | string;
  status: 'à faire' | 'en cours' | 'terminée';
  priority: 'basse' | 'moyenne' | 'haute' | 'urgente';
  dueDate: string;
  category: string;
  actionPoints?: number;
  actualTime?: number;
  estimatedTime?: number;
  isHighImpact?: boolean;
  createdAt?: string;
  updatedAt?: string;
  completedAt?: string;
}

interface Client {
  _id: string;
  name: string;
  logo?: string;
  description?: string;
}

const TaskDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  
  const [task, setTask] = useState<Task | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedTask, setEditedTask] = useState<Partial<Task>>({});

  useEffect(() => {
    if (id) {
      fetchTaskDetails();
    }
  }, [id]);

  const fetchTaskDetails = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token || !id) return;

      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/tasks/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const taskData = await response.json();
        setTask(taskData);
        setEditedTask(taskData);
        
        // Charger les détails du client
        if (taskData.clientId) {
          const clientId = typeof taskData.clientId === 'object' ? taskData.clientId._id : taskData.clientId;
          fetchClientDetails(clientId);
        }
      }
    } catch (error) {
      console.error('Erreur chargement tâche:', error);
      dispatch(addNotification({
        message: '❌ Erreur lors du chargement de la tâche',
        type: 'error'
      }));
    } finally {
      setLoading(false);
    }
  };

  const fetchClientDetails = async (clientId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/clients/${clientId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const clientData = await response.json();
        setClient(clientData);
      }
    } catch (error) {
      console.error('Erreur chargement client:', error);
    }
  };

  const handleUpdate = async () => {
    if (!id) return;

    try {
      await tasksService.updateTask(id, editedTask);
      dispatch(addNotification({
        message: '✅ Tâche mise à jour',
        type: 'success'
      }));
      setIsEditing(false);
      fetchTaskDetails();
    } catch (error) {
      dispatch(addNotification({
        message: '❌ Erreur lors de la mise à jour',
        type: 'error'
      }));
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!id) return;

    try {
      if (newStatus === 'terminée') {
        const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/tasks/${id}/complete`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.rewards) {
            dispatch(addNotification({
              message: `🎉 Tâche terminée! +${data.rewards.points} points, +${data.rewards.experience} XP`,
              type: 'success'
            }));
          }
        }
      } else {
        await tasksService.updateTask(id, { status: newStatus });
      }
      
      fetchTaskDetails();
    } catch (error) {
      dispatch(addNotification({
        message: '❌ Erreur lors de la mise à jour du statut',
        type: 'error'
      }));
    }
  };

  const handleDelete = async () => {
    if (!id || !window.confirm('Êtes-vous sûr de vouloir supprimer cette tâche ?')) return;

    try {
      await tasksService.deleteTask(id);
      dispatch(addNotification({
        message: '🗑️ Tâche supprimée',
        type: 'success'
      }));
      navigate('/tasks');
    } catch (error) {
      dispatch(addNotification({
        message: '❌ Erreur lors de la suppression',
        type: 'error'
      }));
    }
  };

  // Formatage
  const formatTime = (minutes?: number) => {
    if (!minutes) return '0h';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h${mins}min` : `${hours}h`;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgente': return 'bg-red-100 text-red-700 border-red-200';
      case 'haute': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'moyenne': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'basse': return 'bg-green-100 text-green-700 border-green-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'terminée': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'en cours': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'à faire': return 'bg-gray-100 text-gray-700 border-gray-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const ClientLogo = ({ client }: { client: Client }) => {
    if (client.logo) {
      return (
        <img 
          src={client.logo} 
          alt={client.name}
          className="w-16 h-16 rounded-xl object-cover"
        />
      );
    }
    
    return (
      <div className="w-16 h-16 bg-[#04699f] rounded-xl flex items-center justify-center text-white font-bold text-2xl">
        {client.name.charAt(0).toUpperCase()}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#04699f]"></div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 dark:text-gray-400 mb-4">Tâche introuvable</p>
          <button
            onClick={() => navigate('/tasks')}
            className="text-[#04699f] hover:underline"
          >
            Retour aux tâches
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/tasks')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Retour aux tâches
            </button>
            
            <div className="flex items-center gap-2">
              {!isEditing ? (
                <>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 text-[#04699f] hover:bg-[#04699f]/10 rounded-lg transition-colors font-medium"
                  >
                    Modifier
                  </button>
                  <button
                    onClick={handleDelete}
                    className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium"
                  >
                    Supprimer
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setEditedTask(task);
                    }}
                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors font-medium"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleUpdate}
                    className="px-4 py-2 bg-[#04699f] hover:bg-[#045882] text-white rounded-lg transition-colors font-medium"
                  >
                    Enregistrer
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden"
        >
          {/* En-tête avec client */}
          {client && (
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-4">
                <ClientLogo client={client} />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Client</p>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{client.name}</h2>
                  {client.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{client.description}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Contenu de la tâche */}
          <div className="p-6">
            {/* Titre et badges */}
            <div className="mb-6">
              {isEditing ? (
                <input
                  type="text"
                  value={editedTask.title || ''}
                  onChange={(e) => setEditedTask({ ...editedTask, title: e.target.value })}
                  className="text-2xl font-bold text-gray-900 dark:text-white bg-transparent border-b-2 border-[#04699f] focus:outline-none w-full mb-3"
                />
              ) : (
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">{task.title}</h1>
              )}
              
              <div className="flex flex-wrap items-center gap-3">
                <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(task.status)}`}>
                  {task.status === 'terminée' && '✅'} 
                  {task.status === 'en cours' && '🏃'} 
                  {task.status === 'à faire' && '📋'} 
                  {task.status}
                </span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getPriorityColor(task.priority)}`}>
                  {task.priority === 'urgente' && '🔴'}
                  {task.priority === 'haute' && '🟠'}
                  {task.priority === 'moyenne' && '🟡'}
                  {task.priority === 'basse' && '🟢'}
                  {task.priority}
                </span>
                {task.isHighImpact && (
                  <span className="px-3 py-1 bg-gradient-to-r from-amber-100 to-orange-100 text-orange-700 rounded-full text-sm font-medium">
                    🚀 Tâche 80/20
                  </span>
                )}
                {task.actionPoints && (
                  <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                    🏆 {task.actionPoints} points
                  </span>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description</h3>
              {isEditing ? (
                <textarea
                  value={editedTask.description || ''}
                  onChange={(e) => setEditedTask({ ...editedTask, description: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#04699f] focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white resize-none"
                  rows={4}
                />
              ) : (
                <p className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                  {task.description || 'Aucune description'}
                </p>
              )}
            </div>

            {/* Informations détaillées */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Dates */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Dates</h3>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Date d'échéance</span>
                    {isEditing ? (
                      <input
                        type="date"
                        value={editedTask.dueDate?.split('T')[0] || ''}
                        onChange={(e) => setEditedTask({ ...editedTask, dueDate: e.target.value })}
                        className="px-3 py-1 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#04699f] dark:bg-gray-700 dark:border-gray-600"
                      />
                    ) : (
                      <span className="font-medium">{formatDate(task.dueDate)}</span>
                    )}
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Créée le</span>
                    <span className="font-medium">{formatDateTime(task.createdAt)}</span>
                  </div>
                  
                  {task.completedAt && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Terminée le</span>
                      <span className="font-medium text-green-600">{formatDateTime(task.completedAt)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Temps */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Temps</h3>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Temps estimé</span>
                    {isEditing ? (
                      <input
                        type="number"
                        value={editedTask.estimatedTime || 0}
                        onChange={(e) => setEditedTask({ ...editedTask, estimatedTime: parseInt(e.target.value) || 0 })}
                        className="px-3 py-1 border border-gray-200 rounded-lg text-sm w-20 focus:ring-2 focus:ring-[#04699f] dark:bg-gray-700 dark:border-gray-600"
                        min="0"
                        step="15"
                      />
                    ) : (
                      <span className="font-medium">{formatTime(task.estimatedTime)}</span>
                    )}
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Temps passé</span>
                    <span className="font-medium text-[#04699f]">{formatTime(task.actualTime)}</span>
                  </div>
                  
                  {task.estimatedTime && task.actualTime && (
                    <div className="mt-2">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs text-gray-500">Progression</span>
                        <span className="text-xs font-medium">
                          {Math.round((task.actualTime / task.estimatedTime) * 100)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-[#04699f] h-2 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min((task.actualTime / task.estimatedTime) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Actions sur le statut */}
            {task.status !== 'terminée' && !isEditing && (
              <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Changer le statut</h3>
                <div className="flex flex-wrap gap-3">
                  {task.status !== 'à faire' && (
                    <button
                      onClick={() => handleStatusChange('à faire')}
                      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors font-medium"
                    >
                      📋 Remettre à faire
                    </button>
                  )}
                  {task.status !== 'en cours' && (
                    <button
                      onClick={() => handleStatusChange('en cours')}
                      className="px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors font-medium"
                    >
                      🏃 Commencer
                    </button>
                  )}
                  <button
                    onClick={() => handleStatusChange('terminée')}
                    className="px-4 py-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 rounded-lg transition-colors font-medium"
                  >
                    ✅ Marquer comme terminée
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default TaskDetail;