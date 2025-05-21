// === Ce fichier configure l'environnement pour tester l'application === /workspaces/TaskManagerLatestVersion/frontend/src/setupTests.ts
// Explication simple : Ce fichier est comme un préparateur qui installe tous les outils spéciaux dont les tests ont besoin avant de vérifier si l'application fonctionne bien - comme quand tu prépares tout ton matériel avant de commencer un bricolage.
// Explication technique : Fichier de configuration automatiquement exécuté par Jest avant chaque test, qui configure l'environnement de test avec les extensions et utilitaires nécessaires.
// Utilisé dans : Exécuté automatiquement par Jest avant l'exécution de chaque test unitaire ou d'intégration lors de la commande "npm test".
// Connecté à : Tous les fichiers de test (*.test.js/ts/tsx) du projet, la bibliothèque jest-dom qu'il importe, et le fichier de configuration Jest (jest.config.js ou section dans package.json).

// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom

// === Début : Importation des utilitaires de test DOM ===
// Explication simple : Cette ligne apporte des super-pouvoirs aux tests pour qu'ils puissent vérifier ce qui s'affiche à l'écran, comme une loupe magique qui permet de voir si les boutons et textes apparaissent correctement.
// Explication technique : Importation de la bibliothèque jest-dom qui étend Jest avec des assertions personnalisées pour tester le DOM, facilitant la vérification de l'état, du contenu et du comportement des éléments HTML rendus.
import '@testing-library/jest-dom';
// === Fin : Importation des utilitaires de test DOM ===
