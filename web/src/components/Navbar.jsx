import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getRoleBadge = (role) => {
    const badges = {
      admin: 'bg-purple-100 text-purple-800',
      chefe: 'bg-blue-100 text-blue-800',
      farmaceutico: 'bg-green-100 text-green-800'
    };
    return badges[role] || 'bg-gray-100 text-gray-800';
  };

  return (
    <nav className="bg-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link to="/" className="flex items-center">
              <span className="text-xl font-bold text-primary-600">
                💊 Controle de Medicamentos
              </span>
            </Link>
            
            <div className="hidden sm:ml-6 sm:flex sm:space-x-4">
              <Link
                to="/"
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-50 rounded-md"
              >
                Início
              </Link>
              {user && user.role !== 'assistente' && (
                <Link
                  to="/records"
                  className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-50 rounded-md"
                >
                  Registros
                </Link>
              )}
              {user && (user.role === 'chefe' || user.role === 'admin') && (
                <Link
                  to="/shifts"
                  className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-50 rounded-md"
                >
                  Plantões
                </Link>
              )}
              <Link
                to="/swaps"
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-50 rounded-md"
              >
                Trocas
              </Link>
              {user && (user.role === 'chefe' || user.role === 'admin') && (
                <Link
                  to="/timeline"
                  className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-50 rounded-md"
                >
                  Histórico
                </Link>
              )}
              {user && user.role === 'admin' && (
                <Link
                  to="/admin/users"
                  className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-50 rounded-md"
                >
                  Usuários
                </Link>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {user && (
              <>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{user.name || user.email}</p>
                  <span className={`text-xs px-2 py-1 rounded-full ${getRoleBadge(user.role)}`}>
                    {user.role}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="btn btn-secondary text-sm"
                >
                  Sair
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
