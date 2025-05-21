// === Ce fichier centralise toutes les actions Redux de l'application === /workspaces/TaskManagerLatestVersion/frontend/src/store/actions/index.ts
// Explication simple : Ce fichier est comme une table des matières qui liste toutes les actions que l'application peut faire, pour qu'on puisse les trouver facilement au même endroit.
// Explication technique : Fichier barrel (index) de TypeScript qui agrège et ré-exporte toutes les actions Redux définies dans d'autres fichiers, facilitant leur importation depuis un point d'entrée unique.
// Utilisé dans : Les composants React qui déclenchent des actions Redux, comme les formulaires de tâches, la liste des tâches, et tous les composants qui modifient l'état global.
// Connecté à : Fichiers d'actions spécifiques (taskActions.ts, etc.), composants connectés via useDispatch ou connect(), et indirectement aux reducers qui traitent ces actions.

// === Début : Exportation des actions de tâches ===
// Explication simple : Cette ligne rend disponibles toutes les actions liées aux tâches, comme créer, modifier ou supprimer une tâche.
// Explication technique : Instruction d'exportation qui utilise la syntaxe d'exportation étoile (re-export) pour exposer toutes les fonctions créatrices d'actions définies dans le module taskActions.
// Exporter toutes les actions pour une importation simplifi�e
export * from './taskActions';
// === Fin : Exportation des actions de tâches ===

// === Début : Commentaire pour futures exportations ===
// Explication simple : Cette ligne est un rappel pour ajouter plus tard d'autres groupes d'actions, comme celles pour les clients ou les utilisateurs.
// Explication technique : Commentaire servant de placeholder et de documentation pour indiquer que des exports additionnels peuvent être ajoutés pour d'autres catégories d'actions Redux.
// Ajouter d'autres exports si n�cessaire
// === Fin : Commentaire pour futures exportations ===