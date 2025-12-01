import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import ChangePasswordModal from '../components/ChangePasswordModal';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const { login, updateUser } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(username, password);

    if (result.success) {
      // Verificar se é primeiro login
      if (result.user.firstLogin) {
        setShowPasswordModal(true);
      } else {
        // Se for farmacêutico, marcar para mostrar modal no dashboard
        if (result.user.role === 'farmaceutico') {
          sessionStorage.setItem('showHandoverModal', 'true');
        }
        navigate('/');
      }
    } else {
      setError(result.error);
    }

    setLoading(false);
  };

  const handlePasswordChanged = () => {
    // Atualizar o estado do usuário para firstLogin = false
    const userData = JSON.parse(localStorage.getItem('user'));
    userData.firstLogin = false;
    updateUser(userData);
    setShowPasswordModal(false);
    
    // Se for farmacêutico, marcar para mostrar modal no dashboard
    if (userData.role === 'farmaceutico') {
      sessionStorage.setItem('showHandoverModal', 'true');
    }
    
    navigate('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="card">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-primary-600 mb-2">💊</h1>
            <h2 className="text-3xl font-bold text-gray-900">
              Controle de Medicamentos
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Sistema de controle de medicamentos controlados
            </p>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="username" className="label">
                Usuário
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="input"
                placeholder="seu.usuario"
              />
            </div>

            <div>
              <label htmlFor="password" className="label">
                Senha
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="input"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn btn-primary"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        </div>
      </div>

      {showPasswordModal && (
        <ChangePasswordModal
          isFirstLogin={true}
          onClose={() => {}} // Não permite fechar no primeiro login
          onSuccess={handlePasswordChanged}
        />
      )}
    </div>
  );
}
