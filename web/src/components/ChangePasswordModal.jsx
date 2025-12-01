import { useState } from 'react';
import api from '../services/api';
import { useToast } from './Toast';

export default function ChangePasswordModal({ isFirstLogin, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const toast = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.newPassword !== formData.confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }

    if (formData.newPassword.length < 6) {
      setError('A nova senha deve ter no mínimo 6 caracteres');
      return;
    }

    try {
      setLoading(true);
      await api.post('/auth/change-password', {
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword
      });
      
      toast.success('Senha alterada com sucesso!');
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao alterar senha');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
        <div className="mb-6">
          {isFirstLogin ? (
            <>
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">
                Bem-vindo(a)! 🎉
              </h2>
              <p className="text-gray-600 text-center">
                Por segurança, é necessário trocar sua senha no primeiro acesso.
              </p>
            </>
          ) : (
            <>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Alterar Senha
              </h2>
              <p className="text-gray-600">
                Digite sua senha atual e escolha uma nova senha.
              </p>
            </>
          )}
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Senha Atual
            </label>
            <input
              type="password"
              value={formData.currentPassword}
              onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nova Senha
            </label>
            <input
              type="password"
              value={formData.newPassword}
              onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
              minLength={6}
              disabled={loading}
            />
            <p className="text-xs text-gray-500 mt-1">Mínimo de 6 caracteres</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirmar Nova Senha
            </label>
            <input
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
              minLength={6}
              disabled={loading}
            />
          </div>

          <div className="flex gap-3 pt-4">
            {!isFirstLogin && (
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
            )}
            <button
              type="submit"
              disabled={loading}
              className={`${isFirstLogin ? 'w-full' : 'flex-1'} px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {loading ? 'Alterando...' : 'Alterar Senha'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
