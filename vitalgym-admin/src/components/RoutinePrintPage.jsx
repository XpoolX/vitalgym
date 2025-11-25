import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/axios';
import './RoutinePrintPage.css';

export default function RoutinePrintPage() {
  const { id } = useParams();
  const [rutina, setRutina] = useState(null);

  useEffect(() => {
    const fetch = async () => {
      const res = await api.get(`/admin/routines/${id}`);
      setRutina(res.data);
    };
    fetch();
  }, [id]);

  if (!rutina) return <p>Cargando rutina...</p>;

  return (
    <div className="routine-print">
      <h1>💪 {rutina.nombre}</h1>
      <p className="descripcion">{rutina.descripcion}</p>

      <table className="tabla-ejercicios">
        <thead>
          <tr>
            <th>Ejercicio</th>
            <th>Repeticiones</th>
            <th>Descanso</th>
          </tr>
        </thead>
        <tbody>
          {rutina.RoutineExercises.map((e) => (
            <tr key={e.id}>
              <td>{e.nombre}</td>
              <td>{e.repeticiones}</td>
              <td>{e.descansoSegundos} seg</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="notas">
        <p>🕒 Descansa 60-90 segundos entre series, 2 minutos entre ejercicios distintos y 4 minutos entre grupos musculares.</p>
        <p className="firma">VitalGym · www.vitalgym.fit</p>
      </div>
    </div>
  );
}
