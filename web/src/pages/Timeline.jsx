import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import Navbar from '../components/Navbar';

export default function Timeline() {
  const { user, hasRole } = useAuth();
  const [activities, setActivities] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const isChefOrAdmin = hasRole(['chefe', 'admin']);

  useEffect(() => {
    // Apenas admin e chefe podem ver o histórico
    if (!isChefOrAdmin) {
      window.location.href = '/dashboard';
      return;
    }
    setCurrentPage(1);
    loadData();
  }, [filter, isChefOrAdmin]);

  const loadData = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filter !== 'all') params.type = filter;

      const [activitiesRes, statsRes] = await Promise.all([
        api.get('/activity', { params }),
        api.get('/activity/stats')
      ]);

      setActivities(activitiesRes.data);
      setStats(statsRes.data);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type) => {
    const icons = {
      record_created: '📝',
      record_received: '✅',
      shift_created: '📅',
      swap_requested: '🔄',
      swap_accepted: '✔️',
      swap_rejected: '❌',
      swap_approved: '👍',
      swap_cancelled: '🚫',
      absence_created: '🏖️',
      absence_deleted: '🗑️',
      user_created: '👤',
      user_updated: '✏️'
    };
    return icons[type] || '📌';
  };

  const getActivityColor = (type) => {
    if (type.includes('created')) return 'text-blue-600';
    if (type.includes('received') || type.includes('accepted') || type.includes('approved')) return 'text-green-600';
    if (type.includes('rejected') || type.includes('deleted') || type.includes('cancelled')) return 'text-red-600';
    if (type.includes('requested')) return 'text-yellow-600';
    return 'text-gray-600';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) return 'agora mesmo';
    if (minutes < 60) return `há ${minutes} min`;
    if (hours < 24) return `há ${hours}h`;
    if (days < 7) return `há ${days}d`;
    
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  // Paginação
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = activities.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(activities.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Histórico de Atividades</h1>
          <p className="mt-2 text-sm text-gray-600">
            Acompanhe tudo que está acontecendo no sistema em tempo real
          </p>
        </div>

        {/* Cards de Estatísticas */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-2xl font-bold text-blue-600">{stats.todayActivities}</div>
              <div className="text-sm text-gray-600 mt-1">Atividades Hoje</div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-2xl font-bold text-green-600">{stats.recordsCreatedToday}</div>
              <div className="text-sm text-gray-600 mt-1">Registros Criados</div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-2xl font-bold text-teal-600">{stats.recordsReceivedToday}</div>
              <div className="text-sm text-gray-600 mt-1">Registros Recebidos</div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-2xl font-bold text-yellow-600">{stats.pendingSwaps}</div>
              <div className="text-sm text-gray-600 mt-1">Trocas Pendentes</div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-2xl font-bold text-orange-600">{stats.absencesToday}</div>
              <div className="text-sm text-gray-600 mt-1">Ausências Hoje</div>
            </div>
          </div>
        )}

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow mb-6 p-4">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Todas
            </button>
            <button
              onClick={() => setFilter('record_created')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'record_created'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              📝 Entregas
            </button>
            <button
              onClick={() => setFilter('record_received')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'record_received'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              ✅ Recebimentos
            </button>
            <button
              onClick={() => setFilter('shift_created')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'shift_created'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              📅 Plantões
            </button>
            <button
              onClick={() => setFilter('swap_requested')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'swap_requested'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              🔄 Trocas
            </button>
            <button
              onClick={() => setFilter('absence_created')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'absence_created'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              🏖️ Ausências
            </button>
            <button
              onClick={() => setFilter('user_created')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'user_created'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              👤 Usuários
            </button>
          </div>
        </div>

        {/* Timeline */}
        <div className="bg-white rounded-lg shadow">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Carregando...</div>
          ) : activities.length === 0 ? (
            <div className="p-8 text-center text-gray-500">Nenhuma atividade encontrada</div>
          ) : (
            <>
              <div className="divide-y divide-gray-200">
                {currentItems.map((activity) => (
                  <div key={activity.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start gap-4">
                      <div className={`text-3xl ${getActivityColor(activity.type)}`}>
                        {getActivityIcon(activity.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-gray-900 font-medium">
                          {activity.description}
                        </p>
                        <div className="mt-1 flex items-center gap-3 text-sm text-gray-500">
                          <span className="font-medium">{activity.userName}</span>
                          <span>•</span>
                          <span>{formatDate(activity.createdAt)}</span>
                          {activity.entityType && (
                            <>
                              <span>•</span>
                              <span className="px-2 py-0.5 bg-gray-100 rounded text-xs">
                                {activity.entityType}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Paginação */}
              {totalPages > 1 && (
                <div className="border-t border-gray-200 px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-700">
                      Mostrando <span className="font-medium">{indexOfFirstItem + 1}</span> a{' '}
                      <span className="font-medium">{Math.min(indexOfLastItem, activities.length)}</span> de{' '}
                      <span className="font-medium">{activities.length}</span> atividades
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => paginate(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Anterior
                      </button>
                      {[...Array(totalPages)].map((_, index) => {
                        const pageNumber = index + 1;
                        // Mostrar apenas algumas páginas
                        if (
                          pageNumber === 1 ||
                          pageNumber === totalPages ||
                          (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)
                        ) {
                          return (
                            <button
                              key={pageNumber}
                              onClick={() => paginate(pageNumber)}
                              className={`px-3 py-1 border rounded-md text-sm font-medium ${
                                currentPage === pageNumber
                                  ? 'bg-primary-600 text-white border-primary-600'
                                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                              }`}
                            >
                              {pageNumber}
                            </button>
                          );
                        } else if (pageNumber === currentPage - 2 || pageNumber === currentPage + 2) {
                          return <span key={pageNumber} className="px-2">...</span>;
                        }
                        return null;
                      })}
                      <button
                        onClick={() => paginate(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Próxima
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
