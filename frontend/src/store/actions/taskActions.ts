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

// Action thunk pour mettre à jour une tâche
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

// Action thunk pour supprimer une tâche
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