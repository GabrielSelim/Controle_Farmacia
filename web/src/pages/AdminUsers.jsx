import { useState, useEffect } from 'react';
import api from '../services/api';
import Navbar from '../components/Navbar';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    password: '',
    role: 'farmaceutico',
    telefone: '',
    telefone_whatsapp: '',
    callmebot_key: ''
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/users');
      setUsers(res.data.users || []);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (user = null) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        email: user.email,
        name: user.name || '',
        password: '',
        role: user.role,
        telefone: user.telefone || '',
        telefone_whatsapp: user.telefone_whatsapp || '',
        callmebot_key: ''
      });
    } else {
      setEditingUser(null);
      setFormData({
        email: '',
        name: '',
        password: '',
        role: 'farmaceutico',
        telefone: '',
        telefone_whatsapp: '',
        callmebot_key: ''
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingUser(null);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (editingUser) {
        const updateData = { ...formData };
        if (!updateData.password) delete updateData.password;
        if (!updateData.callmebot_key) delete updateData.callmebot_key;
        
        await api.put(`/users/${editingUser.id}`, updateData);
        alert('✅ Usuário atualizado com sucesso!');
      } else {
        await api.post('/auth/register', formData);
        alert('✅ Usuário criado com sucesso!');
      }
      handleCloseModal();
      loadUsers();
    } catch (error) {
      alert(error.response?.data?.error || 'Erro ao salvar usuário');
    }
  };

  const handleToggleActive = async (userId, currentStatus) => {
    try {
      await api.put(`/users/${userId}`, {
        active: !currentStatus
      });
      alert('✅ Status atualizado com sucesso!');
      loadUsers();
    } catch (error) {
      alert(error.response?.data?.error || 'Erro ao atualizar status');
    }
  };

  const getRoleBadge = (role) => {
    const badges = {
      admin: 'bg-purple-100 text-purple-800',
      chefe: 'bg-blue-100 text-blue-800',
      farmaceutico: 'bg-green-100 text-green-800',
      assistente: 'bg-yellow-100 text-yellow-800'
    };
    return badges[role] || 'bg-gray-100 text-gray-800';
  };

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = users.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(users.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gestão de Usuários</h1>
            <p className="text-gray-600 mt-1">Administração de contas e permissões</p>
          </div>
          <button onClick={() => handleOpenModal()} className="btn btn-primary">
            ➕ Novo Usuário
          </button>
        </div>

        <div className="card overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Nome / Email</th>
                <th>Role</th>
                <th>Telefone</th>
                <th>Status</th>
                <th>Criado em</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentItems.map((user) => (
                <tr key={user.id}>
                  <td>
                    <div className="font-medium">{user.name || '-'}</div>
                    <div className="text-xs text-gray-500">{user.email}</div>
                  </td>
                  <td>
                    <span className={`text-xs px-2 py-1 rounded-full ${getRoleBadge(user.role)}`}>
                      {user.role}
                    </span>
                  </td>
                  <td>
                    <div className="text-sm">
                      {user.telefone || '-'}
                      {user.telefone_whatsapp && user.telefone_whatsapp !== user.telefone && (
                        <div className="text-xs text-gray-500">
                          WhatsApp: {user.telefone_whatsapp}
                        </div>
                      )}
                    </div>
                  </td>
                  <td>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      user.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {user.active ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="text-sm text-gray-600">
                    {new Date(user.createdAt).toLocaleDateString('pt-BR')}
                  </td>
                  <td>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleOpenModal(user)}
                        className="text-primary-600 hover:text-primary-700 text-sm"
                      >
                        ✏️ Editar
                      </button>
                      <button
                        onClick={() => handleToggleActive(user.id, user.active)}
                        className="text-gray-600 hover:text-gray-700 text-sm"
                      >
                        {user.active ? '🔒 Desativar' : '🔓 Ativar'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Paginação */}
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between border-t border-gray-200 pt-4">
              <div className="text-sm text-gray-700">
                Mostrando {indexOfFirstItem + 1} a {Math.min(indexOfLastItem, users.length)} de {users.length} usuários
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => paginate(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Anterior
                </button>
                
                {/* Primeira página */}
                {currentPage > 2 && (
                  <>
                    <button
                      onClick={() => paginate(1)}
                      className="px-3 py-1 border border-gray-300 rounded-md text-sm hover:bg-gray-50"
                    >
                      1
                    </button>
                    {currentPage > 3 && <span className="px-2 py-1">...</span>}
                  </>
                )}

                {/* Páginas ao redor da atual */}
                {[...Array(totalPages)].map((_, i) => {
                  const page = i + 1;
                  if (page >= currentPage - 1 && page <= currentPage + 1) {
                    return (
                      <button
                        key={page}
                        onClick={() => paginate(page)}
                        className={`px-3 py-1 border rounded-md text-sm ${
                          currentPage === page
                            ? 'bg-primary-600 text-white border-primary-600'
                            : 'border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  }
                  return null;
                })}

                {/* Última página */}
                {currentPage < totalPages - 1 && (
                  <>
                    {currentPage < totalPages - 2 && <span className="px-2 py-1">...</span>}
                    <button
                      onClick={() => paginate(totalPages)}
                      className="px-3 py-1 border border-gray-300 rounded-md text-sm hover:bg-gray-50"
                    >
                      {totalPages}
                    </button>
                  </>
                )}

                <button
                  onClick={() => paginate(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Próxima
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                {editingUser ? 'Editar Usuário' : 'Novo Usuário'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="label">Email *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    disabled={!!editingUser}
                    className="input"
                    placeholder="usuario@exemplo.com"
                  />
                </div>

                <div>
                  <label className="label">Nome</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="input"
                    placeholder="Nome completo"
                  />
                </div>

                <div>
                  <label className="label">
                    Senha {editingUser ? '(deixe em branco para manter)' : '*'}
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required={!editingUser}
                    className="input"
                    placeholder="••••••••"
                  />
                </div>

                <div>
                  <label className="label">Role *</label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    required
                    className="input"
                  >
                    <option value="farmaceutico">Farmacêutico</option>
                    <option value="chefe">Chefe</option>
                    <option value="assistente">Assistente</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <div>
                  <label className="label">Telefone (formato: 5516999999999)</label>
                  <input
                    type="text"
                    name="telefone"
                    value={formData.telefone}
                    onChange={handleChange}
                    className="input"
                    placeholder="5516999999999"
                  />
                </div>

                <div>
                  <label className="label">WhatsApp (se diferente do telefone)</label>
                  <input
                    type="text"
                    name="telefone_whatsapp"
                    value={formData.telefone_whatsapp}
                    onChange={handleChange}
                    className="input"
                    placeholder="5516999999999"
                  />
                </div>

                <div>
                  <label className="label">CallMeBot API Key</label>
                  <input
                    type="text"
                    name="callmebot_key"
                    value={formData.callmebot_key}
                    onChange={handleChange}
                    className="input"
                    placeholder="Chave da API CallMeBot"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Obtenha em: <a href="https://www.callmebot.com/blog/free-api-whatsapp-messages/" target="_blank" rel="noopener noreferrer" className="text-primary-600">callmebot.com</a>
                  </p>
                </div>

                <div className="flex gap-3 pt-4">
                  <button type="submit" className="btn btn-primary flex-1">
                    {editingUser ? 'Atualizar' : 'Criar'} Usuário
                  </button>
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="btn btn-secondary"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
