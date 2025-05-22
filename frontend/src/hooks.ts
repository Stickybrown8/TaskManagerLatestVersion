// === Ce fichier crée des raccourcis spéciaux pour communiquer avec le cerveau central de l'application === /workspaces/TaskManagerLatestVersion/frontend/src/hooks.ts
// Explication simple : Ce fichier contient deux mini-outils qui permettent à n'importe quelle partie de l'application de récupérer ou de changer des informations dans la grande mémoire partagée, comme un talkie-walkie pour parler au centre de contrôle.
// Explication technique : Module utilitaire TypeScript qui définit des hooks React personnalisés typés pour interagir avec le store Redux, fournissant un typage fort pour useSelector et useDispatch.
// Utilisé dans : Tous les composants React qui ont besoin d'accéder ou de modifier l'état global via Redux, comme les pages, les composants réutilisables et les conteneurs.
// Connecté à : Store Redux principal (store.ts) via les types importés et les hooks React-Redux de base (useSelector, useDispatch).

import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from './store/index';

// === Début : Définition des hooks personnalisés pour Redux ===
// Explication simple : Ces deux lignes créent des super-pouvoirs pour les composants : un pour envoyer des messages au centre de contrôle et l'autre pour lire des informations stockées là-bas.
// Explication technique : Définition de deux hooks personnalisés qui enveloppent les hooks natifs de React-Redux avec les types TypeScript appropriés, garantissant la sécurité de type lors de l'accès au store et de l'envoi d'actions.
// Utilise partout ces hooks dans l'app :
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
// === Fin : Définition des hooks personnalisés pour Redux ===
