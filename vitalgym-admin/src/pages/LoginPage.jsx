import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { saveToken } from '../auth/auth';
import '../assets/loginpage.css'; // ¡Asegúrate de tener el CSS separado!

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const login = async () => {
    try {
      const res = await api.post('/auth/login', { email, password });
      saveToken(res.data.token);
      navigate('/dashboard');
    } catch {
      alert('🔥 Usuario o contraseña incorrectos, prueba con más fuerza 💥');
    }
  };

  return (
    <div className="login-container">
      <div className="overlay">
        <div className="login-box">
          <img src="/logo-vitalgym.png" alt="VITALGYM" className="logo" />
          <h1>💪 VITALGYM ADMIN</h1>
          <p>Tu portal para domar el hierro</p>

          <input
            type="email"
            placeholder="Email"
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            placeholder="Contraseña"
            onChange={(e) => setPassword(e.target.value)}
          />
          <button onClick={login}>ENTRAR</button>
        </div>
      </div>
    </div>
  );
}
