import React from 'react';
import { useAppDispatch, useAppSelector } from '../../hooks';
import { toggleTimerPopup } from '../../store/slices/timerSlice';

const TimerDebug: React.FC = () => {
  const dispatch = useAppDispatch();
  const timerState = useAppSelector(state => state.timer);
  
  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      left: '10px',
      backgroundColor: 'white',
      border: '1px solid black',
      padding: '10px',
      zIndex: 9999,
      boxShadow: '0 0 10px rgba(0,0,0,0.5)'
    }}>
      <h3>Timer Debug</h3>
      <div>showTimerPopup: {String(timerState?.showTimerPopup)}</div>
      <div>timerPopupSize: {String(timerState?.timerPopupSize)}</div>
      <button 
        onClick={() => dispatch(toggleTimerPopup(true))}
        style={{marginRight: '10px', padding: '5px', backgroundColor: 'green', color: 'white'}}
      >
        Show Timer
      </button>
      <button 
        onClick={() => dispatch(toggleTimerPopup(false))}
        style={{padding: '5px', backgroundColor: 'red', color: 'white'}}
      >
        Hide Timer
      </button>
    </div>
  );
};

export default TimerDebug;