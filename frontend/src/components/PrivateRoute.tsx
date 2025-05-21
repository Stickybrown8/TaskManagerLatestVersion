/*
 * GARDE D'AUTHENTIFICATION POUR LES ROUTES - frontend/src/components/PrivateRoute.tsx
 *
 * Explication simple:
 * Ce fichier crée un gardien qui vérifie si tu as le droit d'accéder à certaines pages
 * de l'application. C'est comme un videur à l'entrée d'une boîte de nuit qui vérifie ton
 * bracelet d'entrée. Si tu n'es pas connecté (pas de bracelet), il te renvoie automatiquement
 * vers la page de connexion. Si tu es connecté, il te laisse passer et voir la page demandée.
 *
 * Explication technique:
 * Composant React fonctionnel qui implémente un wrapper de protection pour les routes privées,
 * vérifiant l'état d'authentification dans le store Redux avant de permettre l'accès au contenu
 * protégé, avec redirection automatique vers la page de login si l'authentification échoue.
 *
 * Où ce fichier est utilisé:
 * Intégré dans la configuration du routeur principal (généralement dans App.tsx ou routes.tsx)
 * pour envelopper les routes qui nécessitent une authentification de l'utilisateur.
 *
 * Connexions avec d'autres fichiers:
 * - Utilise le hook useAppSelector depuis '../hooks' pour accéder à l'état d'authentification
 * - Interagit avec le store Redux, spécifiquement la branche auth
 * - Utilise les composants Navigate et Outlet de react-router-dom pour la navigation
 */

// === Début : Importation des dépendances ===
// Explication simple : On prend tous les outils dont on a besoin pour créer notre gardien de sécurité, comme un policier qui prend son insigne, son badge et sa radio avant de commencer sa journée.
// Explication technique : Importation des modules React core, des composants et hooks de React Router pour la navigation, et du hook personnalisé pour accéder au store Redux.
import React, { ReactNode } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAppSelector } from '../hooks';
// === Fin : Importation des dépendances ===

// === Début : Définition de l'interface des props ===
// Explication simple : On explique à l'ordinateur que notre gardien peut avoir des enfants à protéger, comme quand un adulte surveille des enfants au parc.
// Explication technique : Déclaration d'une interface TypeScript qui spécifie que le composant peut recevoir des éléments enfants (ReactNode) en tant que propriété optionnelle.
interface PrivateRouteProps {
  children?: ReactNode;
}
// === Fin : Définition de l'interface des props ===

// === Début : Composant PrivateRoute ===
// Explication simple : C'est notre gardien principal qui va vérifier si tu as le droit d'entrer ou non dans les pages protégées.
// Explication technique : Définition du composant fonctionnel avec typage explicite des props reçues, qui implémente la logique de protection des routes.
const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
// === Fin : Composant PrivateRoute ===

  // === Début : Récupération de la localisation et de l'état d'authentification ===
  // Explication simple : Notre gardien vérifie où tu veux aller (ta position) et s'il a un badge valide (si tu es connecté), comme un agent de sécurité qui vérifie ton identité.
  // Explication technique : Utilisation des hooks useLocation de React Router et useAppSelector pour obtenir respectivement l'URL courante et l'état d'authentification depuis le store Redux, avec destructuration et valeurs par défaut.
  const location = useLocation();
  const { isAuthenticated = false, loading = false, token, rehydrated = false } = useAppSelector(state => state.auth) || {};
  // === Fin : Récupération de la localisation et de l'état d'authentification ===

  // === Début : Logs de débogage ===
  // Explication simple : On écrit dans un journal ce qu'on a vérifié, pour pouvoir retrouver des indices si quelque chose ne fonctionne pas correctement.
  // Explication technique : Affichage des informations d'authentification dans la console pour faciliter le débogage, avec un message confirmant l'exécution du composant.
  // Debug temporaire
  // console.log({ isAuthenticated, token, rehydrated, loading });
  console.log({ isAuthenticated, token, rehydrated, loading });
  console.log("PrivateRoute.tsx rendu !");
  // === Fin : Logs de débogage ===

  // === Début : Vérification d'authentification et redirection ===
  // Explication simple : Si tu n'es pas connecté, notre gardien te renvoie à la page de connexion, comme quand un videur te refuse l'entrée et te dirige vers la billetterie.
  // Explication technique : Condition qui vérifie si l'utilisateur n'est pas authentifié ou n'a pas de token, auquel cas il le redirige vers la route /login avec l'emplacement actuel enregistré dans l'état pour un éventuel retour après connexion.
  if (!isAuthenticated || !token) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  // === Fin : Vérification d'authentification et redirection ===

  // === Début : Rendu du contenu protégé ===
  // Explication simple : Si tu es bien connecté, notre gardien te laisse passer et voir le contenu que tu demandais, comme un agent qui ouvre la porte après avoir vérifié ton badge.
  // Explication technique : Rendu conditionnel qui affiche soit les enfants explicites passés au composant, soit l'Outlet de React Router qui permet l'affichage des routes enfants imbriquées.
  return children ? <>{children}</> : <Outlet />;
  // === Fin : Rendu du contenu protégé ===
};

// === Début : Export du composant ===
// Explication simple : On rend notre gardien disponible pour être utilisé partout dans l'application, comme quand on distribue un plan de sécurité à toute l'équipe.
// Explication technique : Export par défaut du composant pour permettre son importation dans d'autres modules, notamment dans la configuration des routes.
export default PrivateRoute;
// === Fin : Export du composant ===
