/*
 * SERVICE DE SYNCHRONISATION MULTI-ONGLETS - frontend/src/services/timerSync.ts
 *
 * Explication simple:
 * Ce fichier permet à plusieurs onglets de ton application de communiquer entre eux
 * pour synchroniser le timer. Si tu démarres un timer dans un onglet, tous les autres
 * onglets le sauront et afficheront le même timer.
 *
 * Explication technique:
 * Service utilisant l'API BroadcastChannel pour synchroniser l'état du timer entre
 * plusieurs onglets/fenêtres de la même origine. Inclut un fallback pour les navigateurs
 * qui ne supportent pas BroadcastChannel.
 */

import { store } from '../store';
import { setRunningTimer } from '../store/slices/timerSlice';
import { addNotification } from '../store/slices/uiSlice';

// Types pour les messages de synchronisation
interface TimerSyncMessage {
  type: 'TIMER_START' | 'TIMER_STOP' | 'TIMER_UPDATE' | 'REQUEST_STATE' | 'STATE_RESPONSE';
  timer?: any;
  timestamp: number;
  tabId: string;
}

class TimerSyncService {
  private channel: BroadcastChannel | null = null;
  private tabId: string;
  private isSupported: boolean;
  private listeners: Set<(message: TimerSyncMessage) => void> = new Set();

  constructor() {
    // Générer un ID unique pour cet onglet
    this.tabId = `tab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Vérifier si BroadcastChannel est supporté
    this.isSupported = typeof BroadcastChannel !== 'undefined';
    
    if (this.isSupported) {
      this.initChannel();
    } else {
      console.warn('BroadcastChannel n\'est pas supporté. Utilisation du localStorage comme fallback.');
      this.initLocalStorageFallback();
    }
  }

  private initChannel() {
    try {
      this.channel = new BroadcastChannel('timer_sync_channel');
      
      this.channel.onmessage = (event: MessageEvent<TimerSyncMessage>) => {
        // Ignorer nos propres messages
        if (event.data.tabId === this.tabId) return;
        
        this.handleMessage(event.data);
      };
      
      // Demander l'état actuel aux autres onglets
      this.requestCurrentState();
      
    } catch (error) {
      console.error('Erreur lors de l\'initialisation de BroadcastChannel:', error);
      this.isSupported = false;
      this.initLocalStorageFallback();
    }
  }

  private initLocalStorageFallback() {
    // Fallback avec localStorage pour les navigateurs qui ne supportent pas BroadcastChannel
    window.addEventListener('storage', (event) => {
      if (event.key === 'timer_sync_message' && event.newValue) {
        try {
          const message: TimerSyncMessage = JSON.parse(event.newValue);
          if (message.tabId !== this.tabId) {
            this.handleMessage(message);
          }
        } catch (error) {
          console.error('Erreur lors du parsing du message de synchronisation:', error);
        }
      }
    });
    
    // Demander l'état actuel
    this.requestCurrentState();
  }

  private handleMessage(message: TimerSyncMessage) {
    console.log('[TimerSync] Message reçu:', message);
    
    switch (message.type) {
      case 'TIMER_START':
      case 'TIMER_UPDATE':
        if (message.timer) {
          store.dispatch(setRunningTimer(message.timer));
          store.dispatch(addNotification({
            message: 'Timer synchronisé depuis un autre onglet',
            type: 'info',
            duration: 3000
          }));
        }
        break;
        
      case 'TIMER_STOP':
        store.dispatch(setRunningTimer(null));
        store.dispatch(addNotification({
          message: 'Timer arrêté dans un autre onglet',
          type: 'info',
          duration: 3000
        }));
        break;
        
      case 'REQUEST_STATE':
        // Un nouvel onglet demande l'état actuel
        const currentTimer = store.getState().timer.runningTimer;
        if (currentTimer) {
          this.broadcastStateResponse(currentTimer);
        }
        break;
        
      case 'STATE_RESPONSE':
        // Recevoir l'état d'un autre onglet
        if (message.timer && !store.getState().timer.runningTimer) {
          store.dispatch(setRunningTimer(message.timer));
        }
        break;
    }
    
    // Notifier les listeners locaux
    this.listeners.forEach(listener => listener(message));
  }

  private broadcast(message: Omit<TimerSyncMessage, 'tabId' | 'timestamp'>) {
    const fullMessage: TimerSyncMessage = {
      ...message,
      timestamp: Date.now(),
      tabId: this.tabId
    };
    
    if (this.isSupported && this.channel) {
      try {
        this.channel.postMessage(fullMessage);
      } catch (error) {
        console.error('Erreur lors de l\'envoi du message:', error);
      }
    } else {
      // Fallback localStorage
      try {
        localStorage.setItem('timer_sync_message', JSON.stringify(fullMessage));
        // Nettoyer après un court délai
        setTimeout(() => {
          localStorage.removeItem('timer_sync_message');
        }, 100);
      } catch (error) {
        console.error('Erreur lors de l\'utilisation du fallback localStorage:', error);
      }
    }
  }

  // Méthodes publiques
  public broadcastTimerStart(timer: any) {
    this.broadcast({
      type: 'TIMER_START',
      timer
    });
  }

  public broadcastTimerStop() {
    this.broadcast({
      type: 'TIMER_STOP'
    });
  }

  public broadcastTimerUpdate(timer: any) {
    this.broadcast({
      type: 'TIMER_UPDATE',
      timer
    });
  }

  private requestCurrentState() {
    this.broadcast({
      type: 'REQUEST_STATE'
    });
  }

  private broadcastStateResponse(timer: any) {
    this.broadcast({
      type: 'STATE_RESPONSE',
      timer
    });
  }

  public onMessage(callback: (message: TimerSyncMessage) => void) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  public destroy() {
    if (this.channel) {
      this.channel.close();
    }
    this.listeners.clear();
  }
}

// Singleton pour être utilisé dans toute l'application
export const timerSyncService = new TimerSyncService();

// Fonction utilitaire pour vérifier le support
export const isSyncSupported = () => typeof BroadcastChannel !== 'undefined';