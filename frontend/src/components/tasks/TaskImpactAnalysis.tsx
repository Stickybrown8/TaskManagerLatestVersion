/*
 * ANALYSE D'IMPACT DES TÂCHES - frontend/src/components/tasks/TaskImpactAnalysis.tsx
 *
 * Explication simple:
 * Ce fichier crée un outil qui analyse toutes tes tâches et te dit lesquelles 
 * sont les plus importantes pour atteindre tes objectifs. Il utilise le principe 80/20,
 * qui dit que 20% de tes tâches produisent 80% des résultats. Il te montre ces tâches
 * cruciales dans un joli tableau, te permet de les sélectionner et de les marquer comme
 * "tâches à fort impact" pour mieux organiser ton travail.
 *
 * Explication technique:
 * Composant React fonctionnel qui visualise et permet d'interagir avec les analyses
 * d'impact des tâches calculées via l'algorithme de Pareto. Il permet de consulter,
 * sélectionner et appliquer des recommandations basées sur les scores d'impact
 * calculés pour optimiser la productivité de l'utilisateur.
 *
 * Où ce fichier est utilisé:
 * Intégré dans la page de productivité ou le tableau de bord analytique de l'application,
 * accessible via la section d'analyse de performance et d'optimisation des tâches.
 *
 * Connexions avec d'autres fichiers:
 * - Utilise les actions du slice taskImpactSlice pour récupérer et modifier les données
 * - Interagit avec le store Redux via useSelector et useAppDispatch
 * - Utilise la bibliothèque Framer Motion pour les animations
 * - Consomme l'état global des tâches analysées et le modifie via les actions Redux
 */

// === Début : Importation des dépendances ===
// Explication simple : On prend tous les outils dont on a besoin pour faire fonctionner notre analyse de tâches, comme quand tu rassembles tes crayons et règles avant de commencer un devoir.
// Explication technique : Importation des hooks React, des fonctions Redux, des actions du slice d'impact des tâches, et de la bibliothèque d'animation Framer Motion.
import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/index';
import { useAppDispatch } from '../../hooks';
import { analyzeTasksImpact, applyImpactAnalysis, resetAnalysisApplied } from '../../store/slices/taskImpactSlice';
import { motion } from 'framer-motion';
// === Fin : Importation des dépendances ===

// === Début : Définition des interfaces TypeScript ===
// Explication simple : On explique à l'ordinateur à quoi ressemble une tâche et une analyse d'impact, comme quand tu décrirais les règles d'un jeu à un ami.
// Explication technique : Déclaration des interfaces TypeScript qui définissent la structure des objets tâche et analyse d'impact, avec typage de toutes les propriétés pour assurer la sécurité et l'auto-complétion.
// Définition d'une interface pour le type Task
interface Task {
  _id: string;
  title: string;
  description?: string;
  priority?: string;
  status?: string;
  dueDate?: string;
  clientId?: string | { _id: string; name: string };
  impactScore?: number;
  isHighImpact?: boolean;
  calculatedImpactScore?: number;
  isCurrentlyHighImpact?: boolean;
}

// Définition d'une interface pour l'analyse d'impact
interface ImpactAnalysis {
  allTasksWithScores?: Array<{
    _id: string;
    title: string;
    isCurrentlyHighImpact?: boolean;
    currentImpactScore?: number;
    recommendedImpactScore?: number;
    shouldBeHighImpact?: boolean;
    clientId?: string | { _id: string; name: string };
    priority?: string;
    status?: string;
    description?: string;
  }>;
  recommendedHighImpactTasks: Array<{
    _id: string;
    title: string;
    recommendedImpactScore?: number;
    clientId?: string | { _id: string; name: string };
    priority?: string;
    status?: string;
    description?: string;
    isCurrentlyHighImpact?: boolean;
  }>;
  totalTasks?: number;
  topTasksCount?: number;
  otherTasks?: Array<any>;
}
// === Fin : Définition des interfaces TypeScript ===

// === Début : Déclaration du composant principal ===
// Explication simple : On crée le programme principal qui va montrer notre analyse de tâches, comme quand on commence à construire une maison en posant les fondations.
// Explication technique : Définition du composant fonctionnel React avec typage TypeScript, qui servira à afficher et interagir avec l'analyse d'impact des tâches.
const TaskImpactAnalysis: React.FC = () => {
// === Fin : Déclaration du composant principal ===

  // === Début : Initialisation des hooks Redux et états locaux ===
  // Explication simple : On prépare des boîtes spéciales pour stocker les informations et les tâches que l'on veut montrer, comme quand tu prépares des tiroirs pour ranger tes affaires.
  // Explication technique : Configuration du dispatcher Redux, extraction des données de l'état global via useSelector, et initialisation des états locaux pour la sélection des tâches et l'affichage des messages.
  const dispatch = useAppDispatch();
  const { impactAnalysis, loading, applyingAnalysis, analysisApplied, error } = useSelector(
    (state: RootState) => state.taskImpact
  );

  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  // === Fin : Initialisation des hooks Redux et états locaux ===

  // === Début : Effet pour charger l'analyse initiale ===
  // Explication simple : Quand notre page s'ouvre pour la première fois, on va automatiquement demander à l'ordinateur de faire l'analyse des tâches importantes, comme quand le prof distribue les exercices au début du cours.
  // Explication technique : Hook useEffect qui déclenche l'action d'analyse des tâches au montage du composant, initialisé avec une dépendance sur dispatch pour éviter les appels multiples.
  useEffect(() => {
    dispatch(analyzeTasksImpact());
  }, [dispatch]);
  // === Fin : Effet pour charger l'analyse initiale ===

  // === Début : Effet pour gérer l'affichage des messages de succès ===
  // Explication simple : Cette partie s'occupe de montrer un message quand tu as réussi à enregistrer tes tâches importantes, puis de le faire disparaître après quelques secondes, comme quand une notification apparaît puis disparaît sur ton téléphone.
  // Explication technique : Hook useEffect qui gère l'affichage temporisé du message de succès après application de l'analyse, avec nettoyage des tâches sélectionnées et réinitialisation du statut via un timer.
  useEffect(() => {
    if (analysisApplied) {
      setShowSuccessMessage(true);
      setSelectedTasks([]);

      const timer = setTimeout(() => {
        setShowSuccessMessage(false);
        dispatch(resetAnalysisApplied());
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [analysisApplied, dispatch]);
  // === Fin : Effet pour gérer l'affichage des messages de succès ===

  // === Début : Fonctions de gestion des tâches sélectionnées ===
  // Explication simple : Ces fonctions permettent de cocher ou décocher des tâches dans la liste, de toutes les sélectionner d'un coup, ou de tout effacer, comme quand tu fais une liste de courses et que tu coches ce que tu as déjà mis dans ton panier.
  // Explication technique : Ensemble de gestionnaires d'événements qui manipulent l'état local des tâches sélectionnées, implémentant les fonctionnalités de sélection individuelle, sélection groupée et effacement de la sélection.
  const handleTaskSelection = (taskId: string) => {
    setSelectedTasks(prev =>
      prev.includes(taskId)
        ? prev.filter(id => id !== taskId)
        : [...prev, taskId]
    );
  };

  const handleSelectRecommendedTasks = () => {
    if (!impactAnalysis) return;

    // Conversion sécurisée pour le reste du composant
    const typedImpactAnalysis = impactAnalysis as ImpactAnalysis;
    const recommendedTaskIds = typedImpactAnalysis.recommendedHighImpactTasks.map(task => task._id);
    setSelectedTasks(recommendedTaskIds);
  };

  const handleClearSelection = () => {
    setSelectedTasks([]);
  };
  // === Fin : Fonctions de gestion des tâches sélectionnées ===

  // === Début : Fonction d'application de l'analyse ===
  // Explication simple : Cette fonction enregistre les tâches que tu as choisies comme étant très importantes, pour que l'application s'en souvienne et te les montre en priorité, comme quand tu marques tes pages préférées dans un livre.
  // Explication technique : Gestionnaire d'événement qui prépare et dispatch l'action Redux pour appliquer l'analyse aux tâches sélectionnées, en transformant les IDs en objets de mise à jour avec les scores d'impact recommandés.
  const handleApplyAnalysis = () => {
    if (selectedTasks.length === 0 || !impactAnalysis) return;

    // Conversion sécurisée pour le reste du composant
    const typedImpactAnalysis = impactAnalysis as ImpactAnalysis;
    const allTasksWithScores = typedImpactAnalysis.allTasksWithScores || [];

    const taskUpdates = selectedTasks.map(taskId => {
      const task = allTasksWithScores.find(t => t._id === taskId);
      return {
        taskId,
        isHighImpact: true,
        impactScore: task?.recommendedImpactScore || task?.currentImpactScore || 0
      };
    });

    dispatch(applyImpactAnalysis(taskUpdates));
  };
  // === Fin : Fonction d'application de l'analyse ===

  // === Début : Rendus conditionnels pour les états spéciaux ===
  // Explication simple : Cette partie vérifie s'il y a des problèmes, comme si l'analyse est en train de charger ou s'il y a une erreur, et montre un message adapté, comme quand un jeu vidéo affiche "Chargement..." ou "Erreur de connexion".
  // Explication technique : Série de conditions de rendu qui gèrent les états spéciaux comme le chargement, les erreurs ou l'absence de données, retournant des composants UI appropriés pour chaque cas avant d'atteindre le rendu principal.
  if (loading && !impactAnalysis) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
        <strong className="font-bold">Erreur!</strong>
        <span className="block sm:inline"> {error}</span>
      </div>
    );
  }

  if (!impactAnalysis) {
    return (
      <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative" role="alert">
        <span className="block sm:inline">Aucune donnée d'analyse disponible.</span>
      </div>
    );
  }
  // === Fin : Rendus conditionnels pour les états spéciaux ===

  // === Début : Préparation des données pour l'affichage ===
  // Explication simple : On prépare les informations de notre analyse pour pouvoir les afficher correctement, comme quand tu tries tes images avant de faire un album photo.
  // Explication technique : Conversion sécurisée des données d'analyse avec typage explicite et initialisation des variables locales utilisées dans le rendu, pour éviter les erreurs TypeScript et faciliter l'accès aux propriétés.
  // Conversion sécurisée pour le reste du composant
  const typedImpactAnalysis = impactAnalysis as ImpactAnalysis;
  const allTasksWithScores = typedImpactAnalysis.allTasksWithScores || [];
  // === Fin : Préparation des données pour l'affichage ===

  // === Début : Rendu simplifié pour l'affichage limité ===
  // Explication simple : Si on n'a pas beaucoup de détails mais qu'on a quand même des tâches recommandées, on montre une version plus simple de l'analyse, comme quand tu fais un résumé au lieu de raconter toute l'histoire.
  // Explication technique : Condition de rendu qui affiche une version simplifiée de l'interface si les données détaillées ne sont pas disponibles mais que les recommandations existent, avec UI optimisée centrée sur les tâches recommandées.
  // Si la version simplifiée est utilisée
  if (!allTasksWithScores.length && typedImpactAnalysis.recommendedHighImpactTasks) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Analyse d'impact des tâches</h2>

        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-700">Tâches recommandées à fort impact</h3>
            <button
              onClick={handleSelectRecommendedTasks}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
            >
              Sélectionner toutes
            </button>
          </div>

          <div className="space-y-4">
            {typedImpactAnalysis.recommendedHighImpactTasks.map((task, index) => (
              <motion.div
                key={task._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`border rounded-lg p-4 ${selectedTasks.includes(task._id)
                  ? 'bg-blue-50 border-blue-200'
                  : 'bg-gray-50 border-gray-200'
                  }`}
                onClick={() => handleTaskSelection(task._id)}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className={`font-medium ${selectedTasks.includes(task._id) ? 'text-blue-800' : 'text-gray-800'
                      }`}>
                      {task.title}
                    </h3>
                    {task.description && (
                      <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                    )}
                  </div>
                  <div className={`text-xs font-bold px-2 py-1 rounded ${selectedTasks.includes(task._id)
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-600 text-white'
                    }`}>
                    Score: {task.recommendedImpactScore}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {selectedTasks.length > 0 && (
          <div className="mt-6 flex justify-end">
            <button
              onClick={handleApplyAnalysis}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              disabled={applyingAnalysis}
            >
              {applyingAnalysis ? 'Application en cours...' : `Planifier ${selectedTasks.length} tâche${selectedTasks.length > 1 ? 's' : ''}`}
            </button>
          </div>
        )}
      </div>
    );
  }
  // === Fin : Rendu simplifié pour l'affichage limité ===

  // === Début : Rendu complet avec tableaux détaillés ===
  // Explication simple : Voici la grande version de notre analyse qui montre tous les détails : un grand tableau avec toutes les tâches recommandées, leurs scores, et un autre tableau avec les autres tâches moins importantes, comme quand on fait un grand poster avec toutes les informations dessus.
  // Explication technique : Rendu principal du composant qui affiche l'interface complète avec en-tête informatif, métriques résumées, tableaux détaillés des tâches recommandées et secondaires, et contrôles d'action, utilisant Tailwind CSS pour le styling et Framer Motion pour les animations.
  // Version complète avec tableaux
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Analyse d'impact des tâches (Principe 80/20)</h2>
        <div className="flex space-x-2">
          <button
            onClick={() => dispatch(analyzeTasksImpact())}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
            disabled={loading}
          >
            {loading ? 'Analyse en cours...' : 'Rafraîchir l\'analyse'}
          </button>
        </div>
      </div>

      {showSuccessMessage && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4"
        >
          Les tâches sélectionnées ont été mises à jour avec succès!
        </motion.div>
      )}

      <div className="mb-6">
        <div className="bg-blue-50 p-4 rounded-lg mb-4">
          <h3 className="font-semibold text-blue-800 mb-2">À propos de l'analyse d'impact</h3>
          <p className="text-blue-700">
            Cette analyse identifie les tâches à fort impact selon le principe de Pareto (80/20),
            qui suggère que 80% des résultats proviennent de 20% des efforts.
            Concentrez-vous sur ces tâches prioritaires pour maximiser votre efficacité.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="bg-gray-50 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-gray-700">{typedImpactAnalysis.totalTasks || allTasksWithScores.length}</div>
            <div className="text-sm text-gray-500">Tâches totales</div>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-indigo-600">{typedImpactAnalysis.topTasksCount || typedImpactAnalysis.recommendedHighImpactTasks.length}</div>
            <div className="text-sm text-gray-500">Tâches à fort impact (20%)</div>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-green-600">{selectedTasks.length}</div>
            <div className="text-sm text-gray-500">Tâches sélectionnées</div>
          </div>
        </div>
      </div>

      <div className="mb-4 flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-700">Tâches recommandées à fort impact</h3>
        <div className="flex space-x-2">
          <button
            onClick={handleSelectRecommendedTasks}
            className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200 transition text-sm"
          >
            Sélectionner toutes
          </button>
          <button
            onClick={handleClearSelection}
            className="px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition text-sm"
          >
            Effacer la sélection
          </button>
        </div>
      </div>

      <div className="overflow-x-auto mb-8">
        <table className="min-w-full bg-white">
          <thead>
            <tr className="bg-gray-100 text-gray-600 uppercase text-sm leading-normal">
              <th className="py-3 px-6 text-left">Sélection</th>
              <th className="py-3 px-6 text-left">Tâche</th>
              <th className="py-3 px-6 text-center">Client</th>
              <th className="py-3 px-6 text-center">Priorité</th>
              <th className="py-3 px-6 text-center">Statut</th>
              <th className="py-3 px-6 text-center">Score d'impact</th>
              <th className="py-3 px-6 text-center">Statut actuel</th>
            </tr>
          </thead>
          <tbody className="text-gray-600 text-sm">
            {typedImpactAnalysis.recommendedHighImpactTasks.map(task => (
              <tr key={task._id} className="border-b border-gray-200 hover:bg-gray-50">
                <td className="py-3 px-6 text-left">
                  <input
                    type="checkbox"
                    checked={selectedTasks.includes(task._id)}
                    onChange={() => handleTaskSelection(task._id)}
                    className="form-checkbox h-5 w-5 text-indigo-600"
                  />
                </td>
                <td className="py-3 px-6 text-left">
                  <div className="font-medium">{task.title}</div>
                </td>
                <td className="py-3 px-6 text-center">
                  {typeof task.clientId === 'object' && task.clientId?.name ? task.clientId.name : 'N/A'}
                </td>
                <td className="py-3 px-6 text-center">
                  <span className={`px-2 py-1 rounded-full text-xs ${task.priority === 'haute' ? 'bg-red-100 text-red-800' :
                      task.priority === 'moyenne' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                    }`}>
                    {task.priority || 'normale'}
                  </span>
                </td>
                <td className="py-3 px-6 text-center">
                  <span className={`px-2 py-1 rounded-full text-xs ${task.status === 'terminée' ? 'bg-green-100 text-green-800' :
                      task.status === 'en cours' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                    }`}>
                    {task.status || 'à faire'}
                  </span>
                </td>
                <td className="py-3 px-6 text-center">
                  <div className="flex items-center justify-center">
                    <div className="mr-2 font-semibold">{task.recommendedImpactScore}</div>
                    <div className="w-16 bg-gray-200 rounded-full h-2.5">
                      <div
                        className="bg-blue-600 h-2.5 rounded-full"
                        style={{ width: `${task.recommendedImpactScore}%` }}
                      ></div>
                    </div>
                  </div>
                </td>
                <td className="py-3 px-6 text-center">
                  {task.isCurrentlyHighImpact ? (
                    <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                      Fort impact
                    </span>
                  ) : (
                    <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">
                      Impact normal
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {typedImpactAnalysis.otherTasks && typedImpactAnalysis.otherTasks.length > 0 && (
        <>
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Autres tâches</h3>
          <div className="overflow-x-auto mb-6">
            <table className="min-w-full bg-white">
              <thead>
                <tr className="bg-gray-100 text-gray-600 uppercase text-sm leading-normal">
                  <th className="py-3 px-6 text-left">Sélection</th>
                  <th className="py-3 px-6 text-left">Tâche</th>
                  <th className="py-3 px-6 text-center">Client</th>
                  <th className="py-3 px-6 text-center">Score d'impact</th>
                  <th className="py-3 px-6 text-center">Statut actuel</th>
                </tr>
              </thead>
              <tbody className="text-gray-600 text-sm">
                {typedImpactAnalysis.otherTasks.map((task: any) => (
                  <tr key={task._id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="py-3 px-6 text-left">
                      <input
                        type="checkbox"
                        checked={selectedTasks.includes(task._id)}
                        onChange={() => handleTaskSelection(task._id)}
                        className="form-checkbox h-5 w-5 text-indigo-600"
                      />
                    </td>
                    <td className="py-3 px-6 text-left">
                      <div className="font-medium">{task.title}</div>
                    </td>
                    <td className="py-3 px-6 text-center">
                      {typeof task.clientId === 'object' && task.clientId?.name ? task.clientId.name : 'N/A'}
                    </td>
                    <td className="py-3 px-6 text-center">
                      <div className="flex items-center justify-center">
                        <div className="mr-2">{task.calculatedImpactScore || task.currentImpactScore}</div>
                        <div className="w-16 bg-gray-200 rounded-full h-2.5">
                          <div
                            className="bg-gray-400 h-2.5 rounded-full"
                            style={{ width: `${task.calculatedImpactScore || task.currentImpactScore}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-6 text-center">
                      {task.isCurrentlyHighImpact ? (
                        <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                          Fort impact
                        </span>
                      ) : (
                        <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">
                          Impact normal
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <div className="flex justify-end">
        <button
          onClick={handleApplyAnalysis}
          className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={selectedTasks.length === 0 || applyingAnalysis}
        >
          {applyingAnalysis ? 'Application en cours...' : 'Appliquer aux tâches sélectionnées'}
        </button>
      </div>
    </div>
  );
  // === Fin : Rendu complet avec tableaux détaillés ===
};

// === Début : Export du composant ===
// Explication simple : On rend notre outil d'analyse disponible pour que d'autres parties de l'application puissent l'utiliser, comme quand tu partages ton jouet avec tes amis.
// Explication technique : Export par défaut du composant pour permettre son importation dans d'autres modules de l'application.
export default TaskImpactAnalysis;
// === Fin : Export du composant ===
