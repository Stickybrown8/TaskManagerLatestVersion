// frontend/src/store/index.ts
// This file now re-exports the necessary store configuration and types
// from frontend/src/store.ts, which is the new single source of truth.

export { store, resetStore, type RootState, type AppDispatch } from './store';

// Note: The typed hooks (useAppDispatch, useAppSelector) are typically defined
// in a separate hooks.ts file, which would import RootState and AppDispatch from here.
// Example state interfaces (AuthState, GamificationState, UIState) that were previously
// in this file have been moved to store.ts and marked as potentially redundant.
// Consumers should use RootState or specific state types exported by individual slices.
