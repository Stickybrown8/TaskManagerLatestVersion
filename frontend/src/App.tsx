// === Ce fichier est le point d'entrée principal qui organise toute la navigation de l'application === /workspaces/TaskManagerLatestVersion/frontend/src/App.tsx
// Explication simple : Ce fichier est comme le sommaire d'un grand livre - il liste toutes les pages disponibles et décide quelles pages montrer selon où tu cliques, tout en gardant les éléments communs comme les menus.
// Explication technique : Composant React fonctionnel racine qui définit l'arborescence des routes de l'application en utilisant React Router, conditionnant l'accès à certaines pages via des routes protégées.
// Utilisé dans : index.tsx comme composant racine, rendu à l'intérieur du Provider Redux et BrowserRouter pour former l'application complète.
// Connecté à : Tous les composants de page importés, le routeur React Router (Routes, Route), le composant Layout qui fournit la structure commune, et indirectement au store Redux via les composants enfants.

import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import PrivateRoute from './components/PrivateRoute';
import TimerPopupFix from './components/timer/TimerPopupFix';
import TimerDebug from './components/debug/TimerDebug';
import TestTimer from './components/debug/TestTimer';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Tasks from './pages/Tasks';
import TaskDetail from './pages/TaskDetail';
import TaskForm from './pages/TaskForm';
import Clients from './pages/Clients';
import ClientForm from './pages/ClientForm';
import ClientDetail from './pages/ClientDetail';
import ClientProfitability from './pages/ClientProfitability';
import ClientDashboard from './pages/ClientDashboard';
import Gamification from './pages/Gamification';
import Profile from './pages/Profile';
import TestApi from './pages/TestApi';
import TestLogin from './TestLogin';
import AdminSetup from './AdminSetup';
import ClientStatistics from './pages/ClientStatistics';
import ConfettiEffect from './components/gamification/ConfettiEffect';

// === Début : Définition du composant principal App ===
// Explication simple : Cette partie crée la grande boîte magique qui contient toute l'application - elle décide quelles pages montrer et comment elles sont organisées.
// Explication technique : Composant fonctionnel React (FC) déclaré avec TypeScript qui constitue le point d'entrée principal de l'application, orchestrant la navigation et les composants partagés.
const App: React.FC = () => {
  console.log("App.tsx rendu !");
  
  // === Début : État pour l'animation de confetti ===
  // Explication simple : Cette ligne crée un interrupteur pour les confettis - quand il est activé, des confettis colorés apparaissent à l'écran comme lors d'une fête.
  // Explication technique : Hook useState qui initialise un état booléen à false pour contrôler l'affichage du composant ConfettiEffect, avec une fonction setter pour modifier cet état.
  const [showConfetti, setShowConfetti] = useState(false);
  // === Fin : État pour l'animation de confetti ===

  // === Début : Configuration de l'écouteur d'événements pour les confettis ===
  // Explication simple : Ce bloc surveille si quelqu'un demande des confettis dans l'application - si oui, il les affiche pendant 3 secondes puis les fait disparaître.
  // Explication technique : Hook useEffect qui enregistre un écouteur d'événement personnalisé 'trigger-confetti' sur l'objet window, activant et désactivant l'animation via setTimeout, avec nettoyage approprié lors du démontage du composant.
  useEffect(() => {
    const handleTriggerConfetti = () => {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
    };
    
    window.addEventListener('trigger-confetti', handleTriggerConfetti);
    return () => window.removeEventListener('trigger-confetti', handleTriggerConfetti);
  }, []);
  // === Fin : Configuration de l'écouteur d'événements pour les confettis ===

  // === Début : Rendu de l'interface avec définition des routes ===
  // Explication simple : Cette partie est comme une carte routière qui indique où aller selon le chemin que tu choisis - elle dit quelles pages afficher quand tu cliques sur différents liens.
  // Explication technique : Fonction de rendu JSX qui retourne l'arborescence complète des routes de l'application utilisant React Router v6, avec imbrication de routes pour les sections protégées et publiques.
  return (
    <>
      <TimerPopupFix />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/test-api" element={<TestApi />} />
        <Route path="/test-login" element={<TestLogin />} />
        <Route path="/admin-setup" element={<AdminSetup />} />
        <Route element={<PrivateRoute />}>
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/clients" element={<Clients />} />
            <Route path="/clients/new" element={<ClientForm />} />
            <Route path="/clients/:id" element={<ClientDetail />} />
            <Route path="/clients/:id/profitability" element={<ClientProfitability />} />
            <Route path="/tasks" element={<Tasks />} />
            <Route path="/tasks/new" element={<TaskForm />} />
            <Route path="/tasks/:id" element={<TaskDetail />} />
            <Route path="/dashboard/clients" element={<ClientDashboard />} />
            <Route path="/gamification" element={<Gamification />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/client-statistics" element={<ClientStatistics />} />
            <Route path="*" element={<div>Page non trouvée</div>} />
          </Route>
        </Route>
      </Routes>
      
      {/* === Début : Affichage conditionnel des outils de débogage ===
       * Explication simple : Ces lignes montrent des outils spéciaux pour aider les développeurs, mais seulement quand l'application est en mode développement - comme des lunettes magiques qui ne fonctionnent que pour les réparateurs.
       * Explication technique : Rendu conditionnel basé sur la variable d'environnement NODE_ENV qui n'affiche les composants de débogage du timer que lorsque l'application n'est pas en mode production.
       */}
      {process.env.NODE_ENV !== 'production' && <TimerDebug />}
      {process.env.NODE_ENV !== 'production' && <TestTimer />}
      {/* === Fin : Affichage conditionnel des outils de débogage === */}
      
      {/* === Début : Composant d'effet de confetti ===
       * Explication simple : Cette partie gère les confettis colorés qui tombent à l'écran quand quelque chose d'important est accompli - comme les confettis lors d'une fête.
       * Explication technique : Rendu du composant ConfettiEffect avec des props pour contrôler son affichage, sa durée et son comportement en fonction de l'état showConfetti.
       */}
      <ConfettiEffect 
        show={showConfetti} 
        duration={3000}
        particleCount={100}
        onComplete={() => setShowConfetti(false)}
      />
      {/* === Fin : Composant d'effet de confetti === */}
    </>
  );
  // === Fin : Rendu de l'interface avec définition des routes ===
};
// === Fin : Définition du composant principal App ===

export default App;
