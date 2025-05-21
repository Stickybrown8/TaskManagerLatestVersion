/*
 * GESTIONNAIRE D'ERREURS GLOBAL - frontend/src/components/ErrorBoundary.tsx
 *
 * Explication simple:
 * Ce fichier crée une sorte de "filet de sécurité" qui attrape les erreurs dans l'application
 * avant qu'elles ne fassent planter tout le programme. Quand une erreur se produit quelque part,
 * ce composant l'intercepte et affiche un joli message d'erreur à l'utilisateur au lieu d'un 
 * écran blanc ou d'un message technique incompréhensible. C'est comme un pompier qui intervient 
 * quand il y a un problème pour te proposer des solutions (retourner à l'accueil ou recharger la page).
 *
 * Explication technique:
 * Composant React de type classe qui implémente l'API ErrorBoundary de React, permettant 
 * de capturer les erreurs JavaScript dans l'arbre de composants enfants, de les logger, 
 * et d'afficher une UI de fallback au lieu de faire crasher l'application entière.
 *
 * Où ce fichier est utilisé:
 * Généralement placé haut dans l'arborescence des composants, souvent autour de l'application 
 * entière dans le fichier App.tsx ou index.tsx, pour capturer les erreurs de rendu partout.
 *
 * Connexions avec d'autres fichiers:
 * - Importe uniquement des éléments de la bibliothèque React
 * - N'est pas directement connecté à d'autres parties de l'application comme les stores ou les API
 * - Enveloppe d'autres composants en tant que parent (via la prop children)
 */

// === Début : Importation des dépendances ===
// Explication simple : On prend les outils de React dont on a besoin pour créer notre filet de sécurité, comme quand tu prends ton kit de premiers soins avant de faire une activité.
// Explication technique : Importation des types et classes nécessaires depuis React pour créer un composant de classe avec la gestion des erreurs et le typage TypeScript.
import React, { Component, ErrorInfo, ReactNode } from 'react';
// === Fin : Importation des dépendances ===

// === Début : Définition des interfaces TypeScript ===
// Explication simple : On explique à l'ordinateur comment vont être organisées les informations dans notre filet de sécurité, comme quand tu dessines un plan avant de construire quelque chose.
// Explication technique : Déclaration des interfaces TypeScript qui définissent les types de props attendues et la structure de l'état local pour le composant ErrorBoundary.
interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}
// === Fin : Définition des interfaces TypeScript ===

// === Début : Classe ErrorBoundary ===
// Explication simple : C'est notre filet de sécurité principal qui va attraper les erreurs et les gérer.
// Explication technique : Définition d'un composant de classe React qui étend Component avec les types génériques définis, implémentant le pattern ErrorBoundary de React.
class ErrorBoundary extends Component<Props, State> {
// === Fin : Classe ErrorBoundary ===

  // === Début : Initialisation de l'état ===
  // Explication simple : Au début, on dit qu'il n'y a pas d'erreur, comme quand tu commences une journée en disant "tout va bien pour l'instant".
  // Explication technique : Initialisation de l'état local du composant avec les valeurs par défaut, indiquant l'absence d'erreur au démarrage.
  state: State = {
    hasError: false,
    error: null
  };
  // === Fin : Initialisation de l'état ===

  // === Début : Méthode statique de capture d'erreur ===
  // Explication simple : Cette fonction spéciale est appelée dès qu'une erreur se produit quelque part. Elle dit "il y a un problème" et garde l'erreur pour pouvoir l'afficher.
  // Explication technique : Méthode statique du cycle de vie qui intercepte toute erreur dans l'arbre de composants et retourne un nouvel état pour mettre à jour le composant.
  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }
  // === Fin : Méthode statique de capture d'erreur ===

  // === Début : Méthode de journalisation d'erreur ===
  // Explication simple : Cette fonction note l'erreur dans un journal pour que les développeurs puissent comprendre ce qui s'est passé, comme quand un détective prend des notes sur un incident.
  // Explication technique : Méthode du cycle de vie qui est invoquée après qu'une erreur a été levée, permettant d'effectuer des opérations secondaires comme la journalisation.
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Erreur capturée par ErrorBoundary:", error, errorInfo);
  }
  // === Fin : Méthode de journalisation d'erreur ===

  // === Début : Fonction de réinitialisation ===
  // Explication simple : Cette fonction te permet de revenir à la page d'accueil et de réinitialiser l'erreur, comme quand tu appuies sur "recommencer" dans un jeu après avoir perdu.
  // Explication technique : Méthode de classe qui réinitialise l'état d'erreur et redirige l'utilisateur vers la racine de l'application, offrant une façon de récupérer après une erreur.
  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };
  // === Fin : Fonction de réinitialisation ===

  // === Début : Méthode de rendu ===
  // Explication simple : Cette fonction décide ce qui doit être affiché : soit le message d'erreur si quelque chose a mal tourné, soit l'application normale si tout va bien.
  // Explication technique : Méthode render qui implémente un rendu conditionnel basé sur l'état d'erreur, affichant soit l'UI de fallback personnalisée, soit le contenu normal via props.children.
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
          <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg max-w-md w-full">
            <div className="flex items-center justify-center mb-6">
              <div className="bg-red-100 dark:bg-red-900 p-3 rounded-full">
                <svg className="w-8 h-8 text-red-500 dark:text-red-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
            </div>
            
            <h2 className="text-xl font-bold text-center text-gray-800 dark:text-white mb-4">
              Une erreur est survenue
            </h2>
            
            <div className="bg-red-50 dark:bg-red-900/30 p-4 rounded-lg mb-6">
              <p className="text-red-700 dark:text-red-300 text-sm">
                {this.state.error?.message || "Erreur inconnue"}
              </p>
            </div>
            
            <div className="flex flex-col space-y-3">
              <button
                onClick={this.handleReset}
                className="w-full py-2 px-4 bg-red-600 hover:bg-red-700 text-white font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 transition-colors"
              >
                Retourner à l'accueil
              </button>
              
              <button
                onClick={() => window.location.reload()}
                className="w-full py-2 px-4 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-50 transition-colors"
              >
                Recharger la page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
  // === Fin : Méthode de rendu ===
}

// === Début : Export du composant ===
// Explication simple : On rend notre filet de sécurité disponible pour que d'autres parties de l'application puissent l'utiliser, comme quand tu partages ton kit de premiers soins avec toute ton équipe.
// Explication technique : Export par défaut du composant pour permettre son importation dans d'autres modules de l'application.
export default ErrorBoundary;
// === Fin : Export du composant ===
