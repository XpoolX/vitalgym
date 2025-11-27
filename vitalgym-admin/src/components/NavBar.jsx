import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faHouse, 
  faUsers, 
  faClipboardList, 
  faBullseye, 
  faDumbbell, 
  faRightFromBracket 
} from '@fortawesome/free-solid-svg-icons';
import './NavBar.css';

export default function NavBar() {
  return (
    <nav className="navbar">
      <div className="navbar-content">
        <img src="/logo-vitalgym.png" alt="VITALGYM" className="navbar-logo" />
        <ul className="navbar-links">
          <li><Link to="/dashboard"><FontAwesomeIcon icon={faHouse} /> Inicio</Link></li>
          <li><Link to="/usuarios"><FontAwesomeIcon icon={faUsers} /> Usuarios</Link></li>
          <li><Link to="/rutinas"><FontAwesomeIcon icon={faClipboardList} /> Rutinas</Link></li>
          <li><Link to="/asignar"><FontAwesomeIcon icon={faBullseye} /> Asignar</Link></li>
          <li><Link to="/ejercicios"><FontAwesomeIcon icon={faDumbbell} /> Ejercicios</Link></li>
          <li><Link to="/logout"><FontAwesomeIcon icon={faRightFromBracket} /> Salir</Link></li>
        </ul>
      </div>
    </nav>
  );
}
