import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import Navbar from '../components/Navbar';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export default function Timeline() {
  const { user, hasRole } = useAuth();
  const [activities, setActivities] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportDates, setExportDates] = useState({
    startDate: '',
    endDate: ''
  });
  const [exportFilter, setExportFilter] = useState('all');
  const [visibleItems, setVisibleItems] = useState(10);
  const [filterDates, setFilterDates] = useState({
    startDate: '',
    endDate: ''
  });

  const isChefOrAdmin = hasRole(['chefe', 'admin']);

  useEffect(() => {
    // Apenas admin e chefe podem ver o histórico
    if (!isChefOrAdmin) {
      window.location.href = '/dashboard';
      return;
    }
    setCurrentPage(1);
    setVisibleItems(10);
    loadData();
  }, [filter, filterDates, isChefOrAdmin]);

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

  const getFilteredActivities = () => {
    if (!filterDates.startDate && !filterDates.endDate) {
      return activities;
    }

    return activities.filter(activity => {
      const activityDate = new Date(activity.createdAt);
      const start = filterDates.startDate ? new Date(filterDates.startDate) : null;
      const end = filterDates.endDate ? new Date(filterDates.endDate + 'T23:59:59') : new Date(new Date().setHours(23, 59, 59, 999));

      if (start && end) {
        return activityDate >= start && activityDate <= end;
      } else if (start) {
        return activityDate >= start && activityDate <= end;
      } else if (end) {
        return activityDate <= end;
      }
      return true;
    });
  };

  const filteredActivities = getFilteredActivities();
  const displayedActivities = filteredActivities.slice(0, visibleItems);
  const hasMore = visibleItems < filteredActivities.length;

  const loadMore = () => {
    setVisibleItems(prev => prev + 10);
  };

  const clearFilters = () => {
    setFilterDates({ startDate: '', endDate: '' });
    setFilter('all');
    setVisibleItems(10);
  };

  // Paginação (removida - agora usa "Ver mais")
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = activities.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(activities.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const getFilteredActivitiesByDate = () => {
    let filtered = activities;
    
    // Aplicar filtro por tipo
    if (exportFilter !== 'all') {
      filtered = filtered.filter(activity => activity.type === exportFilter);
    }
    
    // Aplicar filtro por data
    if (!exportDates.startDate && !exportDates.endDate) {
      return filtered;
    }

    return filtered.filter(activity => {
      const activityDate = new Date(activity.createdAt);
      const start = exportDates.startDate ? new Date(exportDates.startDate) : null;
      // Se não tiver data final, usa a data de hoje
      const end = exportDates.endDate ? new Date(exportDates.endDate + 'T23:59:59') : new Date(new Date().setHours(23, 59, 59, 999));

      if (start && end) {
        return activityDate >= start && activityDate <= end;
      } else if (start) {
        return activityDate >= start && activityDate <= end;
      } else if (end) {
        return activityDate <= end;
      }
      return true;
    });
  };

  const getTypeName = (type) => {
    const types = {
      record_created: 'Entrega Criada',
      record_received: 'Recebimento',
      shift_created: 'Plantão Criado',
      swap_requested: 'Troca Solicitada',
      swap_accepted: 'Troca Aceita',
      swap_rejected: 'Troca Rejeitada',
      swap_approved: 'Troca Aprovada',
      swap_cancelled: 'Troca Cancelada',
      absence_created: 'Ausência Criada',
      absence_deleted: 'Ausência Deletada',
      user_created: 'Usuário Criado',
      user_updated: 'Usuário Atualizado'
    };
    return types[type] || type;
  };

  const translateEntityType = (entityType) => {
    const translations = {
      'record': 'Registro',
      'shift': 'Plantão',
      'swap': 'Troca',
      'absence': 'Ausência',
      'user': 'Usuário'
    };
    return translations[entityType] || entityType;
  };

  const exportToCSV = () => {
    const dataToExport = getFilteredActivitiesByDate();
    
    const csvData = dataToExport.map(activity => ({
      'Data/Hora': new Date(activity.createdAt).toLocaleString('pt-BR'),
      'Tipo': getTypeName(activity.type),
      'Usuário': activity.userName,
      'Descrição': activity.description,
      'Entidade': translateEntityType(activity.entityType) || '-'
    }));

    const ws = XLSX.utils.json_to_sheet(csvData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Histórico');
    
    const fileName = `historico_${exportDates.startDate || 'inicio'}_${exportDates.endDate || 'hoje'}.csv`;
    XLSX.writeFile(wb, fileName);
    setShowExportModal(false);
    setExportDates({ startDate: '', endDate: '' });
    setExportFilter('all');
  };

  const exportToExcel = () => {
    const dataToExport = getFilteredActivitiesByDate();
    
    const excelData = dataToExport.map(activity => ({
      'Data/Hora': new Date(activity.createdAt).toLocaleString('pt-BR'),
      'Tipo': getTypeName(activity.type),
      'Usuário': activity.userName,
      'Descrição': activity.description,
      'Entidade': translateEntityType(activity.entityType) || '-'
    }));

    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Histórico');
    
    const fileName = `historico_${exportDates.startDate || 'inicio'}_${exportDates.endDate || 'hoje'}.xlsx`;
    XLSX.writeFile(wb, fileName);
    setShowExportModal(false);
    setExportDates({ startDate: '', endDate: '' });
    setExportFilter('all');
  };

  const exportToPDF = () => {
    const dataToExport = getFilteredActivitiesByDate();
    
    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.text('Historico de Atividades', 14, 22);
    
    const endDateDisplay = exportDates.endDate || new Date().toISOString().split('T')[0];
    
    doc.setFontSize(11);
    doc.text('Periodo: ' + (exportDates.startDate || 'Inicio') + ' ate ' + (endDateDisplay === new Date().toISOString().split('T')[0] ? 'Hoje' : endDateDisplay), 14, 32);
    doc.text('Total de atividades: ' + dataToExport.length, 14, 38);
    doc.text('Gerado em: ' + new Date().toLocaleString('pt-BR'), 14, 44);

    const tableData = dataToExport.map(activity => [
      new Date(activity.createdAt).toLocaleString('pt-BR'),
      getTypeName(activity.type),
      activity.userName || '-',
      activity.description || '-'
    ]);

    doc.autoTable({
      startY: 50,
      head: [['Data/Hora', 'Tipo', 'Usuario', 'Descricao']],
      body: tableData,
      styles: { fontSize: 8, font: 'helvetica' },
      headStyles: { fillColor: [99, 102, 241], textColor: [255, 255, 255] },
      margin: { top: 50 }
    });

    const fileName = 'historico_' + (exportDates.startDate || 'inicio') + '_' + (exportDates.endDate || 'hoje') + '.pdf';
    doc.save(fileName);
    setShowExportModal(false);
    setExportDates({ startDate: '', endDate: '' });
    setExportFilter('all');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Histórico de Atividades</h1>
            <p className="mt-2 text-sm text-gray-600">
              Acompanhe tudo que está acontecendo no sistema em tempo real
            </p>
          </div>
          <button
            onClick={() => setShowExportModal(true)}
            className="btn btn-primary flex items-center gap-2"
          >
            📥 Exportar
          </button>
        </div>

        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-6 sm:mb-8">
            <div className="bg-white rounded-lg shadow p-4 sm:p-6">
              <div className="text-xl sm:text-2xl font-bold text-blue-600">{stats.todayActivities}</div>
              <div className="text-xs sm:text-sm text-gray-600 mt-1">Atividades Hoje</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4 sm:p-6">
              <div className="text-xl sm:text-2xl font-bold text-green-600">{stats.recordsCreatedToday}</div>
              <div className="text-xs sm:text-sm text-gray-600 mt-1">Registros Criados</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4 sm:p-6">
              <div className="text-xl sm:text-2xl font-bold text-teal-600">{stats.recordsReceivedToday}</div>
              <div className="text-xs sm:text-sm text-gray-600 mt-1">Registros Recebidos</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4 sm:p-6">
              <div className="text-xl sm:text-2xl font-bold text-yellow-600">{stats.pendingSwaps}</div>
              <div className="text-xs sm:text-sm text-gray-600 mt-1">Trocas Pendentes</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4 sm:p-6 col-span-2 sm:col-span-1">
              <div className="text-xl sm:text-2xl font-bold text-orange-600">{stats.absencesToday}</div>
              <div className="text-xs sm:text-sm text-gray-600 mt-1">Ausências Hoje</div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow mb-6 p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900">Filtros</h3>
            <button
              onClick={() => setFiltersExpanded(!filtersExpanded)}
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors min-h-[44px] px-3"
            >
              {filtersExpanded ? (
                <>
                  <span className="hidden sm:inline">Minimizar</span>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                </>
              ) : (
                <>
                  <span className="hidden sm:inline">Expandir</span>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </>
              )}
            </button>
          </div>
          {filtersExpanded && (
            <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="label text-sm">Data Inicial</label>
              <input
                type="date"
                value={filterDates.startDate}
                onChange={(e) => setFilterDates({ ...filterDates, startDate: e.target.value })}
                className="input w-full"
              />
            </div>
            <div>
              <label className="label text-sm">Data Final</label>
              <input
                type="date"
                value={filterDates.endDate}
                onChange={(e) => setFilterDates({ ...filterDates, endDate: e.target.value })}
                className="input w-full"
              />
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2 mb-3">
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
          
          {(filterDates.startDate || filterDates.endDate) && (
            <div className="flex items-center justify-between pt-3 border-t">
              <span className="text-sm text-gray-600">
                {filteredActivities.length} atividade(s) encontrada(s)
              </span>
              <button
                onClick={clearFilters}
                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                Limpar filtros
              </button>
            </div>
          )}
            </>
          )}
        </div>

        <div className="bg-white rounded-lg shadow">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Carregando...</div>
          ) : filteredActivities.length === 0 ? (
            <div className="p-8 text-center text-gray-500">Nenhuma atividade encontrada</div>
          ) : (
            <>
              <div className="divide-y divide-gray-200">
                {displayedActivities.map((activity) => (
                  <div key={activity.id} className="p-4 sm:p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start gap-3 sm:gap-4">
                      <div className={`text-2xl sm:text-3xl flex-shrink-0 ${getActivityColor(activity.type)}`}>
                        {getActivityIcon(activity.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm sm:text-base text-gray-900 font-medium break-words">
                          {activity.description}
                        </p>
                        <div className="mt-1 flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm text-gray-500">
                          <span className="font-medium truncate">{activity.userName}</span>
                          <span className="hidden sm:inline">•</span>
                          <span className="whitespace-nowrap">{formatDate(activity.createdAt)}</span>
                          {activity.entityType && (
                            <>
                              <span className="hidden sm:inline">•</span>
                              <span className="px-2 py-0.5 bg-gray-100 rounded text-xs whitespace-nowrap">
                                {translateEntityType(activity.entityType)}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {hasMore && (
                <div className="border-t border-gray-200 p-4 text-center">
                  <button
                    onClick={loadMore}
                    className="btn btn-secondary min-h-[44px] w-full sm:w-auto"
                  >
                    Ver mais ({filteredActivities.length - visibleItems} restantes)
                  </button>
                </div>
              )}
              
              <div className="border-t border-gray-200 px-4 sm:px-6 py-3 bg-gray-50 text-center text-xs sm:text-sm text-gray-600">
                Mostrando {displayedActivities.length} de {filteredActivities.length} atividades
              </div>
            </>
          )}
        </div>
      </div>

      {showExportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-lg w-full max-w-md p-4 sm:p-6 max-h-[95vh] overflow-y-auto">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">Exportar Histórico</h2>
            
            <div className="space-y-4">
              <div>
                <label className="label">Filtrar por Tipo</label>
                <select
                  value={exportFilter}
                  onChange={(e) => setExportFilter(e.target.value)}
                  className="input w-full"
                >
                  <option value="all">Todos os tipos</option>
                  <option value="record_created">📝 Entregas</option>
                  <option value="record_received">✅ Recebimentos</option>
                  <option value="shift_created">📅 Plantões</option>
                  <option value="swap_requested">🔄 Trocas Solicitadas</option>
                  <option value="swap_accepted">✔️ Trocas Aceitas</option>
                  <option value="swap_rejected">❌ Trocas Rejeitadas</option>
                  <option value="swap_approved">👍 Trocas Aprovadas</option>
                  <option value="swap_cancelled">🚫 Trocas Canceladas</option>
                  <option value="absence_created">🏖️ Ausências</option>
                  <option value="user_created">👤 Usuários Criados</option>
                </select>
              </div>
              
              <div>
                <label className="label">Data Inicial (opcional)</label>
                <input
                  type="date"
                  value={exportDates.startDate}
                  onChange={(e) => setExportDates({ ...exportDates, startDate: e.target.value })}
                  className="input w-full"
                />
              </div>

              <div>
                <label className="label">Data Final (opcional)</label>
                <input
                  type="date"
                  value={exportDates.endDate}
                  onChange={(e) => setExportDates({ ...exportDates, endDate: e.target.value })}
                  className="input w-full"
                />
              </div>

              <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded">
                {exportDates.startDate || exportDates.endDate ? (
                  <>
                    <strong>{getFilteredActivitiesByDate().length}</strong> atividade(s) serão exportadas
                    {exportDates.startDate && (
                      <> do período de <strong>{new Date(exportDates.startDate).toLocaleDateString('pt-BR')}</strong> até <strong>{exportDates.endDate ? new Date(exportDates.endDate).toLocaleDateString('pt-BR') : 'hoje'}</strong></>
                    )}
                  </>
                ) : (
                  `Todas as ${activities.length} atividades serão exportadas`
                )}
              </div>

              <div className="pt-4 space-y-2">
                <button
                  onClick={exportToExcel}
                  className="w-full btn btn-primary flex items-center justify-center gap-2 min-h-[44px]"
                >
                  📊 Exportar como Excel
                </button>
                <button
                  onClick={exportToCSV}
                  className="w-full btn btn-secondary flex items-center justify-center gap-2 min-h-[44px]"
                >
                  📋 Exportar como CSV
                </button>
              </div>

              <button
                onClick={() => {
                  setShowExportModal(false);
                  setExportDates({ startDate: '', endDate: '' });
                  setExportFilter('all');
                }}
                className="w-full btn btn-secondary mt-3 min-h-[44px]"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
