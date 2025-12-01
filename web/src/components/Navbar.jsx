import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import ChangePasswordModal from './ChangePasswordModal';
import MyShiftsModal from './MyShiftsModal';

export default function Navbar() {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showShiftsModal, setShowShiftsModal] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handlePasswordChanged = () => {
    const userData = JSON.parse(localStorage.getItem('user'));
    userData.firstLogin = false;
    updateUser(userData);
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
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <span className="text-lg sm:text-xl font-bold text-primary-600">
                💊 <span className="hidden sm:inline">Controle de Medicamentos</span>
                <span className="sm:hidden">Farmácia</span>
              </span>
            </Link>
          </div>

          <div className="hidden md:flex md:items-center md:space-x-4">
            <div className="flex space-x-4">
              <Link
                to="/"
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-50 rounded-md"
              >
                Início
              </Link>
              {user && user.role !== 'atendente' && (
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

            {user && (
              <>
                <button
                  onClick={() => setShowShiftsModal(true)}
                  className="inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-md gap-2 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Meus Plantões
                </button>

                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center space-x-2 text-sm focus:outline-none"
                  >
                    <div className="text-right">
                      <p className="font-medium text-gray-900">{user.name || user.email}</p>
                      <span className={`text-xs px-2 py-1 rounded-full ${getRoleBadge(user.role)}`}>
                        {user.role}
                      </span>
                    </div>
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {showUserMenu && (
                    <>
                      <div 
                        className="fixed inset-0 z-10" 
                        onClick={() => setShowUserMenu(false)}
                      />
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-1 z-20 border border-gray-200">
                        <button
                          onClick={() => {
                            setShowUserMenu(false);
                            setShowPasswordModal(true);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                          Alterar Senha
                        </button>
                        <hr className="my-1" />
                        <button
                          onClick={() => {
                            setShowUserMenu(false);
                            handleLogout();
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                          </svg>
                          Sair
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </>
            )}
          </div>

          <div className="md:hidden flex items-center space-x-2">
            {user && (
              <button
                onClick={() => setShowShiftsModal(true)}
                className="p-2 rounded-md text-white bg-primary-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </button>
            )}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="p-2 rounded-md text-gray-700 hover:text-primary-600 hover:bg-gray-50"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {showMobileMenu ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {showMobileMenu && (
          <div className="md:hidden border-t border-gray-200 pb-3">
            <div className="pt-4 pb-3 border-b border-gray-200">
              {user && (
                <div className="px-4">
                  <p className="font-medium text-gray-900">{user.name || user.email}</p>
                  <span className={`inline-block text-xs px-2 py-1 rounded-full mt-1 ${getRoleBadge(user.role)}`}>
                    {user.role}
                  </span>
                </div>
              )}
            </div>
            <div className="pt-2 space-y-1">
              <Link
                to="/"
                onClick={() => setShowMobileMenu(false)}
                className="block px-4 py-2 text-base font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-50"
              >
                Início
              </Link>
              {user && user.role !== 'atendente' && (
                <Link
                  to="/records"
                  onClick={() => setShowMobileMenu(false)}
                  className="block px-4 py-2 text-base font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-50"
                >
                  Registros
                </Link>
              )}
              {user && (user.role === 'chefe' || user.role === 'admin') && (
                <Link
                  to="/shifts"
                  onClick={() => setShowMobileMenu(false)}
                  className="block px-4 py-2 text-base font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-50"
                >
                  Plantões
                </Link>
              )}
              <Link
                to="/swaps"
                onClick={() => setShowMobileMenu(false)}
                className="block px-4 py-2 text-base font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-50"
              >
                Trocas
              </Link>
              {user && (user.role === 'chefe' || user.role === 'admin') && (
                <Link
                  to="/timeline"
                  onClick={() => setShowMobileMenu(false)}
                  className="block px-4 py-2 text-base font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-50"
                >
                  Histórico
                </Link>
              )}
              {user && user.role === 'admin' && (
                <Link
                  to="/admin/users"
                  onClick={() => setShowMobileMenu(false)}
                  className="block px-4 py-2 text-base font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-50"
                >
                  Usuários
                </Link>
              )}
              <button
                onClick={() => {
                  setShowMobileMenu(false);
                  setShowPasswordModal(true);
                }}
                className="w-full text-left px-4 py-2 text-base font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-50"
              >
                Alterar Senha
              </button>
              <button
                onClick={() => {
                  setShowMobileMenu(false);
                  handleLogout();
                }}
                className="w-full text-left px-4 py-2 text-base font-medium text-red-600 hover:bg-red-50"
              >
                Sair
              </button>
            </div>
          </div>
        )}
      </div>

      {showPasswordModal && (
        <ChangePasswordModal
          isFirstLogin={false}
          onClose={() => setShowPasswordModal(false)}
          onSuccess={handlePasswordChanged}
        />
      )}

      {showShiftsModal && (
        <MyShiftsModal
          onClose={() => setShowShiftsModal(false)}
        />
      )}
    </nav>
  );
}
