import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFire, faClock, faCheck, faPlay, faPause, faRotateRight } from '@fortawesome/free-solid-svg-icons';

export default function PublicQuickRoutineView() {
  const { token } = useParams();
  const [rutina, setRutina] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [completedSets, setCompletedSets] = useState({});
  const [timerActive, setTimerActive] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerTarget, setTimerTarget] = useState(0);

  useEffect(() => {
    const fetchRoutine = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const res = await axios.get(`${apiUrl}/api/routines/shared/${token}`);
        setRutina(res.data);
        
        // Load saved progress from localStorage
        const saved = localStorage.getItem(`routine-progress-${token}`);
        if (saved) {
          setCompletedSets(JSON.parse(saved));
        }
      } catch (err) {
        console.error('Error loading routine:', err);
        setError('No se pudo cargar la rutina. Verifica el enlace.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchRoutine();
  }, [token]);

  // Timer effect
  useEffect(() => {
    let interval;
    if (timerActive && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds(prev => {
          if (prev <= 1) {
            setTimerActive(false);
            // Play a sound or notification when timer completes
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerActive, timerSeconds]);

  const toggleSetCompletion = (diaIndex, ejercicioIndex, serieIndex, descansoSegundos) => {
    const key = `${diaIndex}-${ejercicioIndex}-${serieIndex}`;
    const newCompletedSets = { ...completedSets };
    
    if (newCompletedSets[key]) {
      delete newCompletedSets[key];
    } else {
      newCompletedSets[key] = true;
      
      // Start rest timer
      if (descansoSegundos && descansoSegundos > 0) {
        setTimerTarget(descansoSegundos);
        setTimerSeconds(descansoSegundos);
        setTimerActive(true);
      }
    }
    
    setCompletedSets(newCompletedSets);
    localStorage.setItem(`routine-progress-${token}`, JSON.stringify(newCompletedSets));
  };

  const resetProgress = () => {
    if (window.confirm('¿Seguro que quieres reiniciar todo el progreso?')) {
      setCompletedSets({});
      localStorage.removeItem(`routine-progress-${token}`);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#000', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="text-center">
          <div className="spinner-border text-warning" role="status">
            <span className="visually-hidden">Cargando...</span>
          </div>
          <p className="mt-3">Cargando rutina...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight: '100vh', background: '#000', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="text-center">
          <h3 className="text-danger">Error</h3>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#000', color: '#fff', padding: '20px' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        {/* Header */}
        <div className="text-center mb-4">
          <h1 className="text-warning" style={{ fontSize: '2rem', fontWeight: 'bold' }}>
            {rutina.nombre}
          </h1>
          {rutina.descripcion && (
            <p className="text-muted">{rutina.descripcion}</p>
          )}
          <button 
            className="btn btn-outline-warning btn-sm mt-2"
            onClick={resetProgress}
          >
            <FontAwesomeIcon icon={faRotateRight} /> Reiniciar Progreso
          </button>
        </div>

        {/* Rest Timer */}
        {timerActive && (
          <div 
            className="alert alert-info text-center mb-4"
            style={{ 
              position: 'sticky', 
              top: '10px', 
              zIndex: 1000,
              background: '#0d6efd',
              color: '#fff',
              border: 'none',
              fontSize: '1.5rem',
              fontWeight: 'bold'
            }}
          >
            <FontAwesomeIcon icon={faClock} /> Descanso: {formatTime(timerSeconds)}
            <div className="mt-2">
              <button 
                className="btn btn-sm btn-light me-2"
                onClick={() => setTimerActive(false)}
              >
                <FontAwesomeIcon icon={faPause} /> Pausar
              </button>
              <button 
                className="btn btn-sm btn-light"
                onClick={() => {
                  setTimerSeconds(0);
                  setTimerActive(false);
                }}
              >
                Saltar
              </button>
            </div>
          </div>
        )}

        {/* Routine Days */}
        {rutina.dias && rutina.dias.map((dia, diaIndex) => (
          <div key={diaIndex} className="mb-4">
            <h3 className="text-warning mb-3" style={{ borderBottom: '2px solid #ffc107', paddingBottom: '8px' }}>
              <FontAwesomeIcon icon={faFire} /> Día {dia.dia}
            </h3>
            
            <div style={{ background: '#111', padding: '15px', borderRadius: '8px' }}>
              {dia.ejercicios && dia.ejercicios.map((ejercicio, ejercicioIndex) => (
                <div 
                  key={ejercicioIndex} 
                  className="mb-3 pb-3"
                  style={{ borderBottom: ejercicioIndex < dia.ejercicios.length - 1 ? '1px solid #333' : 'none' }}
                >
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <div>
                      <h6 className="mb-1" style={{ color: '#ffc107' }}>
                        {ejercicio.nombre}
                      </h6>
                      {ejercicio.grupoMuscular && (
                        <small className="text-muted">{ejercicio.grupoMuscular}</small>
                      )}
                    </div>
                    <div className="text-end">
                      <small className="text-muted">
                        <FontAwesomeIcon icon={faClock} /> {ejercicio.descansoSegundos}s
                      </small>
                    </div>
                  </div>

                  {/* Series with checkboxes */}
                  <div className="d-flex flex-wrap gap-2 align-items-center">
                    {ejercicio.series && ejercicio.series.map((reps, serieIndex) => {
                      const setKey = `${diaIndex}-${ejercicioIndex}-${serieIndex}`;
                      const isCompleted = completedSets[setKey];
                      
                      return (
                        <div key={serieIndex} className="d-flex align-items-center">
                          <button
                            className={`btn btn-sm ${isCompleted ? 'btn-success' : 'btn-outline-secondary'}`}
                            style={{ 
                              minWidth: '60px',
                              fontWeight: 'bold',
                              fontSize: '1rem'
                            }}
                            onClick={() => toggleSetCompletion(diaIndex, ejercicioIndex, serieIndex, ejercicio.descansoSegundos)}
                          >
                            {isCompleted && <FontAwesomeIcon icon={faCheck} className="me-1" />}
                            {reps}
                          </button>
                        </div>
                      );
                    })}
                    <span className="text-muted small">
                      ({ejercicio.descansoSegundos}s descanso)
                    </span>
                  </div>

                  {ejercicio.notas && (
                    <div className="mt-2">
                      <small className="text-info">📝 {ejercicio.notas}</small>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Footer */}
        <div className="text-center mt-5 text-muted small">
          <p>VitalGym - Rutina Compartida</p>
          <p>Tu progreso se guarda automáticamente en este dispositivo</p>
        </div>
      </div>
    </div>
  );
}
