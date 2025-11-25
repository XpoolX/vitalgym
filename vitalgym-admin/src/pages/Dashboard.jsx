import NavBar from '../components/NavBar';

export default function Dashboard() {
  return (
    <div className="container-xl mt-5 pt-5">
      <NavBar />
      <div className="mt-1 pt-1">

        <div className="row">
          <div className="col-md-12 mb-4">
            <div className="card bg-primary text-white">
              <div className="card-body">
                <h4 className="card-title">Bienvenido al panel de administración de VitalGym</h4>
                <p className="card-text">Gestiona usuarios, rutinas y entrenamientos de forma sencilla y rápida.</p>
              </div>
            </div>
          </div>

          <div className="col-md-4">
            <div className="card text-center border-success">
              <div className="card-body">
                <h5 className="card-title">👥 Usuarios</h5>
                <p className="card-text">Administra los clientes del gimnasio.</p>
                <a href="/usuarios" className="btn btn-success">Ver usuarios</a>
              </div>
            </div>
          </div>

          <div className="col-md-4">
            <div className="card text-center border-info">
              <div className="card-body">
                <h5 className="card-title">💪 Rutinas</h5>
                <p className="card-text">Crea, edita y asigna rutinas personalizadas.</p>
                <a href="/rutinas" className="btn btn-info">Ver rutinas</a>
              </div>
            </div>
          </div>

          <div className="col-md-4">
            <div className="card text-center border-warning">
              <div className="card-body">
                <h5 className="card-title">📋 Ejercicios</h5>
                <p className="card-text">Gestiona la base de datos de ejercicios con vídeos e imágenes.</p>
                <a href="/ejercicios" className="btn btn-warning text-white">Ver ejercicios</a>
              </div>
            </div>
          </div>
        </div>

        <div className="row mt-4">
          <div className="col-md-6">
            <div className="card border-dark">
              <div className="card-body">
                <h5 className="card-title">📈 Estadísticas</h5>
                <p className="card-text">(Próximamente) Resumen de actividad, entrenamientos y progreso.</p>
              </div>
            </div>
          </div>

          <div className="col-md-6">
            <div className="card border-secondary">
              <div className="card-body">
                <h5 className="card-title">🔧 Configuración</h5>
                <p className="card-text">(Próximamente) Ajustes del sistema y gestión avanzada.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}