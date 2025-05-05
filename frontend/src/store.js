// Ce fichier ne doit pas contenir de syntaxe TypeScript mais servir de pont vers le vrai store

import { store } from './store/index';
import { resetStore } from './store/index';

// Réexporter ce qui est nécessaire
export { store, resetStore };
