import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../hooks';
import { fetchTasksStart, fetchTasksSuccess, fetchTasksFailure } from '../store/slices/tasksSlice';
import { updateTask, deleteTask } from '../store/actions/taskActions';
import { tasksService } from '../services/api';
import { motion } from 'framer-motion';

interface Client {
  _id: string;
  name: string;
  // ...autres propriétés si besoin
}

const TaskDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { tasks, loading, error } = useAppSelector(state => state.tasks);
  const [task, setTask] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: '',
    priority: '',
    dueDate: '',
    clientId: ''
  });

  const clients: Client[] = useAppSelector(state => state.clients.clients);

  useEffect(() => {
    const loadTask = async () => {
      if (id) {
        try {
          dispatch(fetchTasksStart());
          const taskData = await tasksService.getTaskById(id);
          setTask(taskData);
          setFormData({
            title: taskData.title,
            description: taskData.description,
            status: taskData.status,
            priority: taskData.priority,
            dueDate: taskData.dueDate ? new Date(taskData.dueDate).toISOString().split('T')[0] : '',
            clientId: typeof taskData.clientId === 'object' && taskData.clientId !== null
              ? taskData.clientId._id
              : taskData.clientId
          });
          dispatch(fetchTasksSuccess(tasks));
        } catch (error: any) {
          dispatch(fetchTasksFailure(error.message));
        }
      }
    };

    loadTask();
  }, [id, dispatch, tasks]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (id) {
      try {
        await dispatch(updateTask({ id, taskData: formData }));
        setIsEditing(false);
      } catch (error: any) {
        console.error('Error updating task:', error);
      }
    }
  };

  const handleDelete = async () => {
    if (id && window.confirm('Êtes-vous sûr de vouloir supprimer cette tâche ?')) {
      try {
        await dispatch(deleteTask(id));
        navigate('/tasks');
      } catch (error: any) {
        console.error('Error deleting task:', error);
      }
    }
  };

  if (loading) return <div className="p-4">Chargement...</div>;
  if (error) return <div className="p-4 text-red-500">Erreur: {error}</div>;
  if (!task) return <div className="p-4">Tâche non trouvée</div>;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="p-4"
    >
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{isEditing ? 'Modifier la tâche' : task.title}</h1>
        <div className="space-x-2">
          {!isEditing ? (
            <>
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Modifier
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Supprimer
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Annuler
            </button>
          )}
        </div>
      </div>

      {isEditing ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-1">Titre</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          <div>
            <label className="block mb-1">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="w-full p-2 border rounded"
              rows={4}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block mb-1">Statut</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full p-2 border rounded"
              >
                <option value="à faire">À faire</option>
                <option value="en cours">En cours</option>
                <option value="terminée">Terminée</option>
              </select>
            </div>
            <div>
              <label className="block mb-1">Priorité</label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className="w-full p-2 border rounded"
              >
                <option value="basse">Basse</option>
                <option value="moyenne">Moyenne</option>
                <option value="haute">Haute</option>
                <option value="urgente">Urgente</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block mb-1">Date d'échéance</label>
              <input
                type="date"
                name="dueDate"
                value={formData.dueDate}
                onChange={handleChange}
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block mb-1">Client</label>
              <select
                name="clientId"
                value={formData.clientId || ''}
                onChange={handleChange}
              >
                <option value="">Sélectionner un client</option>
                {clients.map((client: Client) => (
                  <option key={client._id} value={client._id}>{client.name}</option>
                ))}
              </select>
            </div>
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Enregistrer
          </button>
        </form>
      ) : (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded shadow">
            <h2 className="text-lg font-semibold mb-2">Description</h2>
            <p>{task.description || 'Aucune description'}</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded shadow">
              <h2 className="text-lg font-semibold mb-2">Détails</h2>
              <div className="space-y-2">
                <p><span className="font-medium">Statut:</span> {task.status}</p>
                <p><span className="font-medium">Priorité:</span> {task.priority}</p>
                <p><span className="font-medium">Date d'échéance:</span> {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'Non définie'}</p>
                <p><span className="font-medium">Client:</span> {task.clientId || 'Non assigné'}</p>
              </div>
            </div>
            <div className="bg-white p-4 rounded shadow">
              <h2 className="text-lg font-semibold mb-2">Activité</h2>
              <div className="space-y-2">
                <p><span className="font-medium">Créée le:</span> {new Date(task.createdAt).toLocaleDateString()}</p>
                <p><span className="font-medium">Dernière mise à jour:</span> {new Date(task.updatedAt).toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default TaskDetail;