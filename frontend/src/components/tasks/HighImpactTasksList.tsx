/*
 * LISTE DE TÂCHES À FORT IMPACT - frontend/src/components/tasks/HighImpactTasksList.tsx
 *
 * Explication simple:
 * Ce fichier crée une liste spéciale qui montre les tâches les plus importantes pour toi.
 * Ces tâches sont celles qui auront le plus grand effet positif sur ton travail si tu les fais.
 * C'est comme si on te disait "si tu dois faire seulement quelques choses aujourd'hui,
 * concentre-toi sur ces tâches-là, elles t'aideront beaucoup!"
 *
 * Explication technique:
 * Composant React fonctionnel qui affiche les tâches sélectionnées automatiquement par 
 * l'algorithme d'impact, récupérées depuis le store Redux. Ces tâches sont classées selon 
 * leur score d'impact calculé à partir de divers facteurs (priorité, date d'échéance, 
 * importance du client, etc.).
 *
 * Où ce fichier est utilisé:
 * Intégré dans le tableau de bord principal et potentiellement dans la page de productivité
 * pour guider l'utilisateur vers les tâches qui auront le plus grand impact sur ses objectifs.
 *
 * Connexions avec d'autres fichiers:
 * - Utilise le store Redux via useSelector pour accéder à l'état taskImpact
 * - Se connecte au slice taskImpactSlice qui contient la logique de calcul des scores d'impact
 * - Utilise la bibliothèque Framer Motion pour les animations d'entrée des tâches
 */

// === Début : Importation des dépendances ===
// Explication simple : On prend tous les outils dont on a besoin pour créer notre liste de tâches spéciales, comme quand tu sors tes crayons et ton papier avant de dessiner.
// Explication technique : Importation des bibliothèques React core, du hook useSelector de Redux pour accéder au store, du type RootState pour assurer le typage du store, et de Framer Motion pour les animations.
import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/index';
import { motion } from 'framer-motion';
// === Fin : Importation des dépendances ===

// === Début : Définition de l'interface Task ===
// Explication simple : On explique à l'ordinateur à quoi ressemble une tâche, comme quand tu décris à quelqu'un les règles d'un jeu avant de commencer.
// Explication technique : Déclaration d'une interface TypeScript qui définit la structure des objets tâche, spécifiant les propriétés requises et optionnelles avec leurs types respectifs.
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
// === Fin : Définition de l'interface Task ===

// === Début : Déclaration du composant principal ===
// Explication simple : On commence à créer notre liste spéciale qui va montrer les tâches les plus importantes.
// Explication technique : Définition du composant fonctionnel React avec typage explicite, qui servira à afficher la liste des tâches à fort impact.
const HighImpactTasksList: React.FC = () => {
// === Fin : Déclaration du composant principal ===

  // === Début : Sélection des données du store ===
  // Explication simple : On va chercher dans la "grande boîte à informations" de l'application la liste des tâches spéciales qui sont très importantes.
  // Explication technique : Utilisation du hook useSelector avec casting de type explicite pour extraire le tableau des tâches à fort impact depuis le slice taskImpact du store Redux.
  // Utilisation d'un cast explicite pour définir le type
  const highImpactTasks = useSelector((state: RootState) => state.taskImpact.highImpactTasks) as Task[];
  // === Fin : Sélection des données du store ===

  // === Début : Rendu conditionnel si aucune tâche ===
  // Explication simple : Si on n'a pas trouvé de tâches très importantes, on montre un message qui dit qu'il n'y en a pas encore, et qu'il faut faire plus de choses pour en avoir.
  // Explication technique : Bloc conditionnel qui retourne une UI alternative lorsque le tableau de tâches est vide ou null, affichant un message informatif dans un conteneur stylisé.
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
  // === Fin : Rendu conditionnel si aucune tâche ===

  // === Début : Rendu principal de la liste ===
  // Explication simple : On dessine notre jolie liste de tâches importantes, chacune avec son titre, sa description et son "score" qui montre à quel point elle est importante. Les tâches apparaissent une par une avec une animation, comme si elles glissaient sur l'écran.
  // Explication technique : Rendu du JSX principal qui map sur le tableau des tâches pour générer des éléments animés avec Framer Motion, chacun affichant les détails de la tâche et son score d'impact dans une mise en page responsive avec Tailwind CSS.
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
  // === Fin : Rendu principal de la liste ===
};

// === Début : Export du composant ===
// Explication simple : On rend notre liste disponible pour que d'autres parties de l'application puissent l'utiliser, comme quand tu partages ton jouet avec tes amis.
// Explication technique : Export par défaut du composant pour permettre son importation dans d'autres modules de l'application.
export default HighImpactTasksList;
// === Fin : Export du composant ===
