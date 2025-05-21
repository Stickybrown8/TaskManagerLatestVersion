// === Ce fichier est un pont qui redirige vers le vrai cerveau de l'application === /workspaces/TaskManagerLatestVersion/frontend/src/store.js
// Explication simple : Ce fichier est comme un panneau indicateur qui dit "le vrai magasin de données est par là" - il ne fait rien lui-même mais aide les autres parties de l'application à trouver facilement le store principal.
// Explication technique : Fichier JavaScript intermédiaire qui sert de façade pour réexporter les éléments du store Redux principal, permettant une transition en douceur lors de la migration vers TypeScript.
// Utilisé dans : Composants et modules qui ont besoin d'accéder au store Redux mais qui importent encore depuis ce chemin historique au lieu du nouveau chemin.
// Connecté à : Directement au store principal (/store/index.ts) et indirectement à tous les composants qui l'importent via l'ancien chemin.

// Ce fichier ne doit pas contenir de syntaxe TypeScript mais servir de pont vers le vrai store

// === Début : Importation et réexportation du store ===
// Explication simple : Ces lignes vont chercher le cerveau de l'application et le bouton "recommencer" depuis leur vraie maison, puis les rendent disponibles à l'ancien endroit où tout le monde les cherchait avant.
// Explication technique : Importation puis réexportation des objets nécessaires depuis le module store TypeScript principal, servant d'adaptateur pour les anciens imports sans briser la compatibilité.
import { store } from './store/index';
import { resetStore } from './store/index';

// Réexporter ce qui est nécessaire
export { store, resetStore };
// === Fin : Importation et réexportation du store ===
