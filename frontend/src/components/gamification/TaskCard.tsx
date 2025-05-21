/*
 * CARTE DE TÂCHE GAMIFIÉE - frontend/src/components/gamification/TaskCard.tsx
 *
 * Explication simple:
 * Ce fichier crée une jolie carte qui affiche une tâche avec des couleurs et des animations
 * spéciales. Elle montre les informations importantes de la tâche et propose un bouton pour
 * la marquer comme terminée rapidement. Quand tu termines une tâche, des confettis tombent
 * et tu gagnes des points, comme dans un jeu vidéo !
 *
 * Explication technique:
 * Composant React fonctionnel qui affiche une tâche dans une carte interactive avec des
 * éléments de gamification (points d'action, animations, effets visuels) et qui permet
 * une complétion rapide avec récompense, utilisant Framer Motion pour les animations.
 *
 * Où ce fichier est utilisé:
 * Intégré dans les listes de tâches sur le tableau de bord, dans la page des tâches et
 * dans la vue Kanban pour afficher chaque tâche individuelle de manière interactive.
 *
 * Connexions avec d'autres fichiers:
 * - Utilise les hooks Redux personnalisés depuis '../../hooks'
 * - Importe et utilise le composant ConfettiEffect
 * - Interagit avec les services API (gamificationService, tasksService, soundService)
 * - Dispatch des actions aux slices uiSlice et gamificationSlice
 * - Consomme les états clients et ui du store Redux
 */

// === Début : Importation des dépendances ===
// Explication simple : On prend tous les outils dont on a besoin pour faire fonctionner notre carte de tâche, comme quand tu prépares tous tes jouets avant de commencer à jouer.
// Explication technique : Importation des bibliothèques et services React, Redux, Framer Motion et des services API locaux nécessaires à la création du composant.
import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../hooks';
import { motion } from 'framer-motion';
import { addNotification } from '../../store/slices/uiSlice';
import { addActionPointsSuccess } from '../../store/slices/gamificationSlice';
import { gamificationService, tasksService } from '../../services/api';
import ConfettiEffect from '../gamification/ConfettiEffect';
import { soundService } from '../../services/soundService';
// === Fin : Importation des dépendances ===

// === Début : Définition de l'interface Client ===
// Explication simple : On définit à quoi ressemble un client dans notre application, comme si on dessinait un modèle de personnage pour un jeu.
// Explication technique : Interface TypeScript déclarant la structure minimale requise des objets client utilisés dans ce composant, avec un identifiant unique et un nom.
interface Client {
  _id: string;
  name: string;
  // autres propriétés si besoin
}
// === Fin : Définition de l'interface Client ===

// === Début : Déclaration du composant TaskCard ===
// Explication simple : On crée notre carte de tâche spéciale qui va afficher les informations et réagir quand on clique dessus ou qu'on passe la souris dessus.
// Explication technique : Définition du composant fonctionnel React avec ses props typées, incluant la tâche à afficher et le callback à exécuter lors du clic sur la carte.
// Composant pour afficher une tâche avec des éléments ludiques
const TaskCard: React.FC<{
  task: any;
  onClick: () => void;
}> = ({ task, onClick }) => {
// === Fin : Déclaration du composant TaskCard ===

  // === Début : Initialisation des hooks ===
  // Explication simple : On prépare tous les outils dont notre carte a besoin pour fonctionner et se souvenir des choses importantes.
  // Explication technique : Configuration des hooks Redux pour dispatcher des actions et accéder au store, et des hooks d'état locaux pour gérer les états d'animation et d'interface utilisateur.
  const dispatch = useAppDispatch();
  const { soundEnabled } = useAppSelector(state => state.ui);
  const clients = useAppSelector(state => state.clients.clients) as Client[];
  const [isHovered, setIsHovered] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  // === Fin : Initialisation des hooks ===

  // === Début : Fonction de couleur de priorité ===
  // Explication simple : Cette fonction décide quelle couleur utiliser pour montrer si une tâche est très urgente ou pas du tout, comme un code couleur dans un jeu.
  // Explication technique : Fonction utilitaire qui retourne les classes CSS appropriées en fonction du niveau de priorité de la tâche, avec support du mode sombre.
  // Obtenir la couleur en fonction de la priorité
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgente':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'haute':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'moyenne':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'basse':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };
  // === Fin : Fonction de couleur de priorité ===

  // === Début : Fonction de couleur de statut ===
  // Explication simple : Cette fonction choisit la couleur qui montre où en est la tâche : pas encore commencée, en train d'être faite, ou terminée.
  // Explication technique : Fonction utilitaire qui attribue des classes CSS de couleur en fonction du statut de la tâche, adaptées au thème clair ou sombre.
  // Obtenir la couleur en fonction du statut
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'à faire':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
      case 'en cours':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'terminée':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };
  // === Fin : Fonction de couleur de statut ===

  // === Début : Fonction de gestion des sons ===
  // Explication simple : Cette fonction joue un son différent selon ce qui se passe, comme quand ton jeu fait "ding!" quand tu gagnes des points.
  // Explication technique : Utilitaire qui gère la lecture des effets sonores via le soundService, avec vérification préalable des préférences utilisateur.
  // Jouer un son
  const playSound = (type: string) => {
    if (!soundEnabled) return;

    console.log(`Playing sound: ${type}`);
    
    // Utiliser notre service audio pour jouer les sons
    switch (type) {
      case 'task_complete':
        soundService.play('task_complete');
        break;
      case 'success':
        soundService.play('success');
        break;
      default:
        soundService.play('notification');
        break;
    }
  };
  // === Fin : Fonction de gestion des sons ===

  // === Début : Fonction de complétion rapide ===
  // Explication simple : Cette fonction s'occupe de tout ce qui se passe quand tu cliques sur le bouton pour terminer une tâche : elle change son statut, te donne des points, fait tomber des confettis et joue un son joyeux.
  // Explication technique : Gestionnaire d'événement asynchrone qui traite la complétion rapide de la tâche, incluant la mise à jour du statut via l'API, l'attribution de points, la notification utilisateur et le déclenchement d'effets visuels/sonores.
  // Gérer le clic sur le bouton de complétion rapide
  const handleQuickComplete = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Empêcher la propagation du clic à la carte

    if (task.status === 'terminée') {
      return;
    }

    setIsAnimating(true);

    try {
      // Ajouter les points d'action à l'utilisateur
      const pointsResponse = await gamificationService.addActionPoints(
        task.actionPoints,
        'task_completion',
        `Tâche terminée rapidement: ${task.title}`
      );

      dispatch(addActionPointsSuccess({
        newActionPoints: pointsResponse.newActionPoints,
        totalPointsEarned: pointsResponse.totalPointsEarned
      }));

      dispatch(addNotification({
        message: `Tâche terminée ! Vous avez gagné ${task.actionPoints} points d'action.`,
        type: 'success'
      }));

      // Déclencher l'effet de confettis
      setShowConfetti(true);
      
      // Jouer le son de complétion
      playSound('task_complete');

      // Mettre à jour le statut de la tâche
      const taskId = typeof task._id === 'object' ? task._id._id : task._id;
      await tasksService.updateTask(taskId, { status: 'terminée' });

      // Attendre la fin de l'animation avant de continuer
      setTimeout(() => {
        setIsAnimating(false);
        // Ici, on pourrait mettre à jour le statut de la tâche dans Redux
      }, 1000);
    } catch (error: any) {
      setIsAnimating(false);
      dispatch(addNotification({
        message: 'Erreur lors de la complétion de la tâche',
        type: 'error'
      }));
    }
  };
  // === Fin : Fonction de complétion rapide ===

  // === Début : Fonction de récupération du nom du client ===
  // Explication simple : Cette fonction trouve le nom du client associé à la tâche, comme quand tu cherches qui a commandé un jouet dans un magasin.
  // Explication technique : Utilitaire qui résout le nom du client à partir de son ID ou de l'objet client directement, avec gestion des cas particuliers et valeur par défaut.
  const getClientName = (clientId: string | { _id: string; name: string }) => {
    if (typeof clientId === 'object' && clientId !== null) return clientId.name;
    const client = clients.find((c: Client) => c._id === clientId);
    return client ? client.name : 'Client inconnu';
  };
  // === Fin : Fonction de récupération du nom du client ===

  // === Début : Rendu du composant ===
  // Explication simple : C'est la partie qui dessine vraiment notre carte sur l'écran, avec toutes ses couleurs, ses animations et ses boutons.
  // Explication technique : Retour du JSX du composant, incluant l'effet de confettis conditionnel et la carte de tâche avec animations Framer Motion, rendu conditionnel des badges et boutons, et gestion des événements de souris.
  return (
    <>
      {/* Effet de confettis */}
      <ConfettiEffect 
        show={showConfetti} 
        duration={3000} 
        particleCount={100} 
        onComplete={() => setShowConfetti(false)}
      />
      
      <motion.div
        whileHover={{ y: -5, transition: { duration: 0.2 } }}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden cursor-pointer hover:shadow-lg transition-shadow relative"
        onClick={onClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="p-4 md:p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{task.title}</h2>
              <p className="text-gray-600 dark:text-gray-300 mb-3 line-clamp-2">{task.description}</p>
              <div className="flex flex-wrap gap-2 mb-2">
                <span className={`px-3 py-1 text-xs rounded-full ${getPriorityColor(task.priority)}`}>
                  {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                </span>
                <span className={`px-3 py-1 text-xs rounded-full ${getStatusColor(task.status)}`}>
                  {task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                </span>
                <span>{getClientName(task.clientId)}</span>
              </div>
            </div>

            <div className="mt-3 md:mt-0 flex items-center">
              <div className="bg-primary-50 dark:bg-primary-900 p-2 rounded-full flex items-center">
                <svg className="w-5 h-5 text-primary-600 dark:text-primary-400 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                </svg>
                <span className="font-bold text-primary-600 dark:text-primary-400">{task.actionPoints}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bouton de complétion rapide (visible au survol) */}
        {isHovered && task.status !== 'terminée' && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute top-2 right-2 bg-success-500 text-white rounded-full p-1 hover:bg-success-600 transition-colors"
            onClick={handleQuickComplete}
            disabled={isAnimating}
          >
            {isAnimating ? (
              <svg className="animate-spin h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </motion.button>
        )}

        {/* Indicateur de points (animation au survol) */}
        {isHovered && task.status !== 'terminée' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute bottom-2 right-2 text-xs font-medium text-primary-600 dark:text-primary-400"
          >
            Terminer pour gagner {task.actionPoints} points
          </motion.div>
        )}
      </motion.div>
    </>
  );
  // === Fin : Rendu du composant ===
};

// === Début : Export du composant ===
// Explication simple : On rend notre carte disponible pour que d'autres parties de l'application puissent l'utiliser.
// Explication technique : Export par défaut du composant pour permettre son importation dans d'autres modules React.
export default TaskCard;
// === Fin : Export du composant ===
