import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import UserListPage from './pages/UserListPage';
import RoutineFormPage from './pages/RoutineFormPage';
import RoutineListPage from './pages/RoutineListPage';
import ExerciseListPage from './pages/ExerciseListPage';
import ExerciseFormPage from './pages/ExerciseFormPage';
import AssignRoutinePage from './pages/AssignRoutinePage';
import RoutineEditPage from './pages/RoutineEditPage';
import ExerciseEditPage from './pages/ExerciseEditPage';
import PreviewPDFPage from './pages/PreviewPDFPage';



function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/usuarios" element={<UserListPage />} />
        <Route path="/rutinas" element={<RoutineListPage />} />
        <Route path="/rutinas/crear" element={<RoutineFormPage />} />
        <Route path="/ejercicios" element={<ExerciseListPage />} />
        <Route path="/ejercicios/crear" element={<ExerciseFormPage />} />
        <Route path="/asignar" element={<AssignRoutinePage />} />
        <Route path="/rutinas/:id/editar" element={<RoutineEditPage />} />
        <Route path="/ejercicios/:id/editar" element={<ExerciseEditPage />} />
        <Route path="/rutinas/preview-pdf" element={<PreviewPDFPage />} />
        <Route path="/rutinas/:id/preview-pdf" element={<PreviewPDFPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
