// Créez un fichier TestTimer.tsx dans frontend/src/components/debug/
import React from 'react';
import { useAppDispatch, useAppSelector } from '../../hooks';
import { toggleTimerPopup } from '../../store/slices/timerSlice';

const TestTimer: React.FC = () => {
  const dispatch = useAppDispatch();
  const showTimerPopup = useAppSelector(state => state.timer?.showTimerPopup);
  
  return (
    <div style={{position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', 
                 backgroundColor: 'white', padding: '20px', border: '2px solid black', zIndex: 9999}}>
      <p>État actuel: {String(showTimerPopup)}</p>
      <button 
        onClick={() => dispatch(toggleTimerPopup(true))}
        style={{padding: '10px', backgroundColor: 'green', color: 'white', marginRight: '10px'}}
      >
        Activer Timer
      </button>
      <button 
        onClick={() => dispatch(toggleTimerPopup(false))}
        style={{padding: '10px', backgroundColor: 'red', color: 'white'}}
      >
        Désactiver Timer
      </button>
    </div>
  );
};

export default TestTimer;