import { Link } from 'react-router-dom';
import './NavBar.css';

export default function NavBar() {
  return (
    <nav className="navbar">
      <div className="navbar-content">
        <img src="/logo-vitalgym.png" alt="VITALGYM" className="navbar-logo" />
        <ul className="navbar-links">
          <li><Link to="/dashboard">🏠 Inicio</Link></li>
          <li><Link to="/usuarios">👥 Usuarios</Link></li>
          <li><Link to="/rutinas">📋 Rutinas</Link></li>
          <li><Link to="/asignar">🎯 Asignar</Link></li>
          <li><Link to="/ejercicios">🏋️‍♂️ Ejercicios</Link></li>
          <li><Link to="/logout">🚪 Salir</Link></li>
        </ul>
      </div>
    </nav>
  );
}
