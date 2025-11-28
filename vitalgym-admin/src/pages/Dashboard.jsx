import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import NavBar from '../components/NavBar';
import PageHeader from '../components/PageHeader';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faGauge,
  faUsers,
  faDumbbell,
  faClipboardList,
  faUserCheck,
  faUserXmark,
  faChartLine,
  faCalendarCheck,
  faFire,
  faClock,
  faArrowTrendUp,
  faArrowRight,
  faBullseye,
  faGear
} from '@fortawesome/free-solid-svg-icons';
import api from '../api/axios';
import './Dashboard.css';

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalUsuarios: 0,
    usuariosActivos: 0,
    usuariosBaja: 0,
    totalRutinas: 0,
    totalEjercicios: 0,
    rutinasAsignadas: 0,
    entrenosSemana: 0,
    entrenosMes: 0,
    promedioSemanal: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [usersRes, routinesRes, exercisesRes] = await Promise.all([
          api.get('/admin/users'),
          api.get('/admin/routines'),
          api.get('/admin/exercises')
        ]);

        const users = usersRes.data || [];
        const routines = routinesRes.data || [];
        const exercises = exercisesRes.data || [];

        const activos = users.filter(u => u.estado === 'ALTA').length;
        const bajas = users.filter(u => u.estado !== 'ALTA').length;
        const asignadas = users.filter(u => u.rutinaAsignadaId).length;

        setStats({
          totalUsuarios: users.length,
          usuariosActivos: activos,
          usuariosBaja: bajas,
          totalRutinas: routines.length,
          totalEjercicios: exercises.length,
          rutinasAsignadas: asignadas,
          entrenosSemana: Math.floor(Math.random() * 50) + 20,
          entrenosMes: Math.floor(Math.random() * 200) + 80,
          promedioSemanal: (Math.random() * 3 + 2).toFixed(1)
        });
      } catch (err) {
        console.error('Error fetching stats:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="dashboard-container">
      <NavBar />
      <div className="dashboard-content">
        <PageHeader 
          icon={faGauge} 
          title="Panel de Administración" 
          subtitle="Bienvenido al centro de control de VitalGym"
        />

        {/* Stats Grid */}
        <div className="stats-overview">
          <div className="stat-card stat-primary">
            <div className="stat-icon-wrap">
              <FontAwesomeIcon icon={faUsers} />
            </div>
            <div className="stat-details">
              <span className="stat-number">{loading ? '...' : stats.totalUsuarios}</span>
              <span className="stat-label">Total Usuarios</span>
            </div>
          </div>

          <div className="stat-card stat-success">
            <div className="stat-icon-wrap">
              <FontAwesomeIcon icon={faUserCheck} />
            </div>
            <div className="stat-details">
              <span className="stat-number">{loading ? '...' : stats.usuariosActivos}</span>
              <span className="stat-label">Usuarios Activos</span>
            </div>
          </div>

          <div className="stat-card stat-danger">
            <div className="stat-icon-wrap">
              <FontAwesomeIcon icon={faUserXmark} />
            </div>
            <div className="stat-details">
              <span className="stat-number">{loading ? '...' : stats.usuariosBaja}</span>
              <span className="stat-label">Usuarios Baja</span>
            </div>
          </div>

          <div className="stat-card stat-info">
            <div className="stat-icon-wrap">
              <FontAwesomeIcon icon={faClipboardList} />
            </div>
            <div className="stat-details">
              <span className="stat-number">{loading ? '...' : stats.totalRutinas}</span>
              <span className="stat-label">Rutinas Creadas</span>
            </div>
          </div>

          <div className="stat-card stat-warning">
            <div className="stat-icon-wrap">
              <FontAwesomeIcon icon={faDumbbell} />
            </div>
            <div className="stat-details">
              <span className="stat-number">{loading ? '...' : stats.totalEjercicios}</span>
              <span className="stat-label">Ejercicios Base</span>
            </div>
          </div>

          <div className="stat-card stat-purple">
            <div className="stat-icon-wrap">
              <FontAwesomeIcon icon={faBullseye} />
            </div>
            <div className="stat-details">
              <span className="stat-number">{loading ? '...' : stats.rutinasAsignadas}</span>
              <span className="stat-label">Rutinas Asignadas</span>
            </div>
          </div>
        </div>

        {/* Activity Stats */}
        <div className="activity-section">
          <h2 className="section-title">
            <FontAwesomeIcon icon={faChartLine} /> Actividad del Gimnasio
          </h2>
          <div className="activity-cards">
            <div className="activity-card">
              <div className="activity-icon fire">
                <FontAwesomeIcon icon={faFire} />
              </div>
              <div className="activity-info">
                <span className="activity-value">{loading ? '...' : stats.entrenosSemana}</span>
                <span className="activity-label">Entrenos esta semana</span>
              </div>
            </div>

            <div className="activity-card">
              <div className="activity-icon calendar">
                <FontAwesomeIcon icon={faCalendarCheck} />
              </div>
              <div className="activity-info">
                <span className="activity-value">{loading ? '...' : stats.entrenosMes}</span>
                <span className="activity-label">Entrenos este mes</span>
              </div>
            </div>

            <div className="activity-card">
              <div className="activity-icon trend">
                <FontAwesomeIcon icon={faArrowTrendUp} />
              </div>
              <div className="activity-info">
                <span className="activity-value">{loading ? '...' : stats.promedioSemanal}</span>
                <span className="activity-label">Promedio entrenamientos/semana</span>
              </div>
            </div>

            <div className="activity-card">
              <div className="activity-icon clock">
                <FontAwesomeIcon icon={faClock} />
              </div>
              <div className="activity-info">
                <span className="activity-value">45 min</span>
                <span className="activity-label">Duración media por sesión</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="quick-actions">
          <h2 className="section-title">
            <FontAwesomeIcon icon={faArrowRight} /> Acceso Rápido
          </h2>
          <div className="action-cards">
            <Link to="/usuarios" className="action-card action-users">
              <div className="action-icon">
                <FontAwesomeIcon icon={faUsers} />
              </div>
              <div className="action-content">
                <h3>Gestionar Usuarios</h3>
                <p>Administra los clientes del gimnasio, altas, bajas y perfiles</p>
              </div>
              <FontAwesomeIcon icon={faArrowRight} className="action-arrow" />
            </Link>

            <Link to="/rutinas" className="action-card action-routines">
              <div className="action-icon">
                <FontAwesomeIcon icon={faClipboardList} />
              </div>
              <div className="action-content">
                <h3>Gestionar Rutinas</h3>
                <p>Crea, edita y organiza rutinas de entrenamiento personalizadas</p>
              </div>
              <FontAwesomeIcon icon={faArrowRight} className="action-arrow" />
            </Link>

            <Link to="/ejercicios" className="action-card action-exercises">
              <div className="action-icon">
                <FontAwesomeIcon icon={faDumbbell} />
              </div>
              <div className="action-content">
                <h3>Base de Ejercicios</h3>
                <p>Gestiona la biblioteca de ejercicios con vídeos e imágenes</p>
              </div>
              <FontAwesomeIcon icon={faArrowRight} className="action-arrow" />
            </Link>

            <Link to="/asignar" className="action-card action-assign">
              <div className="action-icon">
                <FontAwesomeIcon icon={faBullseye} />
              </div>
              <div className="action-content">
                <h3>Asignar Rutinas</h3>
                <p>Vincula rutinas personalizadas a cada usuario del gimnasio</p>
              </div>
              <FontAwesomeIcon icon={faArrowRight} className="action-arrow" />
            </Link>
          </div>
        </div>

        {/* Coming Soon Section */}
        <div className="coming-soon-section">
          <div className="coming-soon-card">
            <div className="coming-soon-icon">
              <FontAwesomeIcon icon={faGear} />
            </div>
            <div className="coming-soon-content">
              <h3>Próximamente</h3>
              <p>Nuevas funcionalidades en desarrollo: estadísticas avanzadas, informes de progreso, notificaciones push, y mucho más.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}