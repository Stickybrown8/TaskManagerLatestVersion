import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { motion } from 'framer-motion';

// Définition d'une interface pour le type Task
interface Task {
  _id: string;
  title: string;
  description?: string;
  priority?: string;
  status?: string;
  dueDate?: string;
  clientId?: string;
  impactScore?: number;
  // Ajoutez d'autres propriétés selon les besoins de votre application
}

const HighImpactTasksList: React.FC = () => {
  // Utilisation d'un cast explicite pour définir le type
  const highImpactTasks = useSelector((state: RootState) => state.taskImpact.highImpactTasks) as Task[];

  if (!highImpactTasks || highImpactTasks.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Tâches à fort impact</h2>
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded">
          Aucune tâche à fort impact identifiée. Complétez plus de tâches pour obtenir des recommandations.
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Tâches à fort impact</h2>
      <div className="space-y-4">
        {highImpactTasks.map((task, index) => (
          <motion.div
            key={task._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-blue-50 border border-blue-200 rounded-lg p-4"
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-medium text-blue-800">{task.title}</h3>
                {task.description && (
                  <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                )}
              </div>
              <div className="bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded">
                Score: {task.impactScore}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default HighImpactTasksList;
