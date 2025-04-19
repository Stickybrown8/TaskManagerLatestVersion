import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { useAppDispatch } from '../../hooks';
import { analyzeTasksImpact, applyImpactAnalysis, resetAnalysisApplied } from '../../store/slices/taskImpactSlice';
import { motion } from 'framer-motion';

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

const TaskImpactAnalysis: React.FC = () => {
  const dispatch = useAppDispatch();
  const { impactAnalysis, loading, applyingAnalysis, analysisApplied, error } = useSelector(
    (state: RootState) => state.taskImpact
  );

  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  useEffect(() => {
    dispatch(analyzeTasksImpact());
  }, [dispatch]);

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

  // Conversion sécurisée pour le reste du composant
  const typedImpactAnalysis = impactAnalysis as ImpactAnalysis;
  const allTasksWithScores = typedImpactAnalysis.allTasksWithScores || [];

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
};

export default TaskImpactAnalysis;
