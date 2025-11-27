import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import './PageHeader.css';

export default function PageHeader({ icon, title, subtitle }) {
  return (
    <div className="page-header-simple">
      <div className="page-header-simple-content">
        <FontAwesomeIcon icon={icon} className="page-header-simple-icon" />
        <h1 className="page-header-simple-title">{title}</h1>
        {subtitle && <span className="page-header-simple-subtitle">— {subtitle}</span>}
      </div>
    </div>
  );
}
