import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import './PageHeader.css';

export default function PageHeader({ icon, title, subtitle }) {
  return (
    <div className="page-header">
      <div className="page-header-content">
        <div className="page-header-icon">
          <FontAwesomeIcon icon={icon} />
        </div>
        <div className="page-header-text">
          <h1 className="page-header-title">{title}</h1>
          {subtitle && <p className="page-header-subtitle">{subtitle}</p>}
        </div>
      </div>
      <div className="page-header-decoration"></div>
    </div>
  );
}
