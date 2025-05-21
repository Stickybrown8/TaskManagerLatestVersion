/*
 * PAGE DÉTAIL DE TÂCHE - src/pages/TaskDetail.tsx
 * 
 * Explication simple:
 * Ce fichier crée la page qui affiche tous les détails d'une tâche spécifique.
 * Il permet de voir, modifier ou supprimer une tâche, et aussi de la marquer comme terminée.
 * C'est comme une fiche d'identité complète pour chaque tâche avec toutes ses informations.
 * 
 * Explication technique:
 * Composant React fonctionnel qui affiche et gère les opérations CRUD pour une tâche individuelle.
 * Utilise React Router pour la navigation et les paramètres d'URL, Redux pour la gestion d'état,
 * et s'intègre avec les services API pour les opérations sur la tâche.
 * 
 * Où ce fichier est utilisé:
 * Dans les routes de l'application, accessible lorsqu'un utilisateur clique sur une tâche
 * spécifique depuis la liste des tâches, généralement via l'URL "/tasks/:id".
 * 
 * Connexions avec d'autres fichiers:
 * - Utilise les hooks Redux (useAppDispatch, useAppSelector)
 * - Importe et dispatche des actions depuis tasksSlice et taskActions
 * - Appelle le service API tasksService pour les opérations CRUD
 * - Utilise la bibliothèque Framer Motion pour les animations
 * - Interagit avec le store pour les notifications via uiSlice
 */

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../hooks';
import { fetchTasksStart, fetchTasksSuccess, fetchTasksFailure } from '../store/slices/tasksSlice';
import { updateTask, deleteTask } from '../store/actions/taskActions';
import { tasksService } from '../services/api';
import { motion } from 'framer-motion';
import { addNotification } from '../store/slices/uiSlice';

// === Début : Interface Client ===
// Explication simple : Cette "boîte" définit à quoi ressemble un client dans notre application.
// Explication technique : Interface TypeScript définissant la structure d'un objet Client avec des propriétés typées.
interface Client {
  _id: string;
  name: string;
  // ...autres propriétés si besoin
}
// === Fin : Interface Client ===

// === Début : Fonction de calcul du temps restant ===
// Explication simple : Cette fonction calcule combien de temps il reste avant l'échéance d'une tâche et le présente de façon compréhensible.
// Explication technique : Fonction utilitaire qui convertit une date d'échéance en chaîne lisible indiquant le temps restant, avec gestion des cas particuliers (retard, aujourd'hui, etc.).
function formatRemainingDays(dueDate: string) {
  if (!dueDate) return "Pas d'échéance";
  const now = new Date();
  const end = new Date(dueDate);
  const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diff < 0) return "En retard";
  if (diff === 0) return "Aujourd'hui";
  if (diff === 1) return "Demain";
  if (diff < 30) return `${diff} jour${diff > 1 ? 's' : ''} restant${diff > 1 ? 's' : ''}`;
  const months = Math.floor(diff / 30);
  const days = diff % 30;
  return `${months} mois${months > 1 ? 's' : ''}${days > 0 ? ` et ${days} jour${days > 1 ? 's' : ''}` : ''} restants`;
}
// === Fin : Fonction de calcul du temps restant ===

// === Début : Composant principal TaskDetail ===
// Explication simple : Ce composant est le "cerveau" de la page qui affiche et gère une tâche unique.
// Explication technique : Composant fonctionnel React qui encapsule toute la logique et l'interface utilisateur pour la visualisation et l'édition d'une tâche.
const TaskDetail: React.FC = () => {
  // === Début : Hooks et états ===
  // Explication simple : On récupère l'identifiant de la tâche depuis l'URL et on prépare des "boîtes" pour stocker les informations.
  // Explication technique : Initialisation des hooks React et Redux pour la navigation, l'extraction des paramètres, et la gestion d'état locale et globale.
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
  // === Fin : Hooks et états ===

  // === Début : Chargement initial des données ===
  // Explication simple : Quand la page s'ouvre, on va chercher les informations de la tâche sur le serveur.
  // Explication technique : Effect hook qui s'exécute au montage du composant et lorsque l'ID change, récupérant les données de la tâche et initialisant le formulaire.
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
  // === Fin : Chargement initial des données ===

  // === Début : Gestionnaires d'événements du formulaire ===
  // Explication simple : Ces fonctions s'occupent de ce qui se passe quand l'utilisateur remplit ou soumet le formulaire.
  // Explication technique : Gestionnaires d'événements pour les modifications de champs de formulaire et la soumission du formulaire de mise à jour.
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
  // === Fin : Gestionnaires d'événements du formulaire ===

  // === Début : Rendus conditionnels ===
  // Explication simple : Ces blocs affichent différents messages selon l'état de chargement ou les erreurs.
  // Explication technique : Rendus conditionnels pour gérer les états de chargement, d'erreur et d'absence de données avant d'afficher le contenu principal.
  if (loading) return <div className="p-4">Chargement...</div>;
  if (error) return <div className="p-4 text-red-500">Erreur: {error}</div>;
  if (!task) return <div className="p-4">Tâche non trouvée</div>;
  // === Fin : Rendus conditionnels ===

  // === Début : Rendu principal du composant ===
  // Explication simple : C'est l'apparence finale de la page avec tous ses éléments, boutons et informations.
  // Explication technique : Structure JSX complète du composant avec animation d'entrée, en-tête avec actions, et interface conditionnelle basée sur l'état d'édition.
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
              {!isEditing && task.status !== 'terminée' && (
                <button
                  onClick={async () => {
                    try {
                      await tasksService.updateTask(
                        typeof task._id === 'object' ? (task._id as any)._id : task._id,
                        { status: 'terminée' }
                      );
                      
                      // Mettre à jour l'interface
                      setTask({ ...task, status: 'terminée' });
                      
                      // Notification de succès
                      dispatch(addNotification({ 
                        message: 'Tâche marquée comme terminée', 
                        type: 'success' 
                      }));
                      
                      // Recharger les tâches dans Redux
                      dispatch(fetchTasksStart());
                      const tasksData = await tasksService.getTasks();
                      dispatch(fetchTasksSuccess(tasksData));
                    } catch (error) {
                      alert("Erreur lors de la complétion de la tâche");
                    }
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Marquer comme terminée
                </button>
              )}
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
        // === Début : Formulaire d'édition ===
        // Explication simple : C'est le formulaire qui permet de modifier les informations de la tâche.
        // Explication technique : Formulaire contrôlé avec des champs pour chaque propriété de la tâche, utilisant les gestionnaires d'événements pour les modifications et la soumission.
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
        // === Fin : Formulaire d'édition ===
      ) : (
        // === Début : Affichage des détails ===
        // Explication simple : C'est la vue qui montre toutes les informations de la tâche de façon organisée et lisible.
        // Explication technique : Présentation en lecture seule des informations de la tâche dans une mise en page structurée avec des sections distinctes pour différentes catégories d'informations.
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
                <p>
                  <span className="font-medium">Date d'échéance:</span>
                  <span className="ml-2">
                    {task.dueDate 
                      ? new Date(task.dueDate).toLocaleDateString() 
                      : 'Non définie'}
                    {task.dueDate && (
                      <span className="ml-2 text-sm text-gray-500">
                        ({formatRemainingDays(task.dueDate)})
                      </span>
                    )}
                  </span>
                </p>
                <p>
                  <span className="font-medium">Client:</span>
                  <span className="ml-2 text-lg font-bold text-primary-700">
                    {typeof task.clientId === 'object' ? task.clientId.name : task.clientId || 'Non assigné'}
                  </span>
                </p>
              </div>
            </div>
            <div className="bg-white p-4 rounded shadow">
              <h2 className="text-lg font-semibold mb-2">Activité</h2>
              <div className="space-y-2">
                <p><span className="font-medium">Créée le:</span> {new Date(task.createdAt).toLocaleDateString()}</p>
                <p>
                  <span className="font-medium">Dernière mise à jour:</span>
                  <span className="ml-2">
                    {task.updatedAt && !isNaN(new Date(task.updatedAt).getTime())
                      ? new Date(task.updatedAt).toLocaleDateString()
                      : 'Non disponible'}
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>
        // === Fin : Affichage des détails ===
      )}
    </motion.div>
  );
  // === Fin : Rendu principal du composant ===
};
// === Fin : Composant principal TaskDetail ===

export default TaskDetail;