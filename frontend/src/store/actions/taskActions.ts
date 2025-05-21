// === Ce fichier définit les actions qui modifient les tâches dans l'application === /workspaces/TaskManagerLatestVersion/frontend/src/store/actions/taskActions.ts
// Explication simple : Ce fichier contient les instructions qui permettent de modifier, supprimer ou faire d'autres opérations sur les tâches, comme un ensemble de commandes pour agir sur ta liste de choses à faire.
// Explication technique : Module TypeScript contenant des créateurs d'actions asynchrones (thunks) pour Redux Toolkit, gérant les opérations CRUD sur les tâches avec gestion des états de chargement et des erreurs.
// Utilisé dans : Les composants qui manipulent des tâches comme TaskForm, TaskList, TaskDetail, et tout composant qui modifie l'état des tâches via Redux.
// Connecté à : Service API (tasksService), store Redux via les slices (tasksSlice), et indirectement aux composants React qui dispatchen ces actions.

import { createAsyncThunk } from '@reduxjs/toolkit';
import { tasksService } from '../../services/api';
import {
    updateTaskStart,
    updateTaskSuccess,
    updateTaskFailure,
    deleteTaskStart,
    deleteTaskSuccess,
    deleteTaskFailure
} from '../slices/tasksSlice';

// === Début : Action de mise à jour d'une tâche ===
// Explication simple : Cette fonction permet de modifier une tâche existante - comme quand tu changes le contenu ou la date d'un devoir dans ton agenda.
// Explication technique : Thunk asynchrone créé avec createAsyncThunk qui gère le cycle complet de mise à jour d'une tâche, avec dispatching d'actions intermédiaires pour suivre l'état de la requête.
// Action thunk pour mettre � jour une t�che
export const updateTask = createAsyncThunk(
    'tasks/update',
    async (
        { id, taskData }: { id: string; taskData: any },
        { dispatch, rejectWithValue }
    ) => {
        try {
            dispatch(updateTaskStart());
            const updatedTask = await tasksService.updateTask(id, taskData);
            dispatch(updateTaskSuccess(updatedTask));
            return updatedTask;
        } catch (error: any) {
            dispatch(updateTaskFailure(error.message || 'Une erreur est survenue'));
            return rejectWithValue(error.message || 'Une erreur est survenue');
        }
    }
);
// === Fin : Action de mise à jour d'une tâche ===

// === Début : Action de suppression d'une tâche ===
// Explication simple : Cette fonction permet de supprimer complètement une tâche de ta liste - comme quand tu effaces un rendez-vous de ton agenda.
// Explication technique : Thunk asynchrone qui encapsule le processus de suppression d'une tâche, gérant l'état de chargement et les erreurs possibles via des actions dispatchers au store.
// Action thunk pour supprimer une t�che
export const deleteTask = createAsyncThunk(
    'tasks/delete',
    async (id: string, { dispatch, rejectWithValue }) => {
        try {
            dispatch(deleteTaskStart());
            await tasksService.deleteTask(id);
            dispatch(deleteTaskSuccess(id));
            return id;
        } catch (error: any) {
            dispatch(deleteTaskFailure(error.message || 'Une erreur est survenue'));
            return rejectWithValue(error.message || 'Une erreur est survenue');
        }
    }
);
// === Fin : Action de suppression d'une tâche ===