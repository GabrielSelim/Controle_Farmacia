import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import Navbar from '../components/Navbar';

export default function Records() {
  const { user, hasRole } = useAuth();
  const [records, setRecords] = useState([]);
  const [meds, setMeds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;
  const [filtersExpanded, setFiltersExpanded] = useState(true);
  const [filters, setFilters] = useState({
    medId: '',
    status: '',
    startDate: '',
    endDate: ''
  });

  useEffect(() => {
    loadMeds();
    loadRecords();
  }, []);

  const loadMeds = async () => {
    try {
      const res = await api.get('/meds');
      setMeds(res.data.meds || []);
    } catch (error) {
    }
  };

  const loadRecords = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filters.medId) params.medId = filters.medId;
      if (filters.status) params.status = filters.status;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;

      const res = await api.get('/records', { params });
      setRecords(res.data.records || []);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value
    });
  };

  const applyFilters = () => {
    setCurrentPage(1);
    loadRecords();
  };

  const clearFilters = () => {
    setFilters({
      medId: '',
      status: '',
      startDate: '',
      endDate: ''
    });
    setCurrentPage(1);
    setTimeout(loadRecords, 0);
  };

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = records.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(records.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const getStatusBadge = (status) => {
    const badges = {
      pendente: 'bg-yellow-100 text-yellow-800',
      finalizado: 'bg-green-100 text-green-800',
      discrepancia: 'bg-red-100 text-red-800'
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <>
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Registros de Contagem</h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">Histórico de entregas e recebimentos</p>
          </div>
          <Link to="/records/new" className="btn btn-primary min-h-[44px] whitespace-nowrap">
            ➕ Novo Registro
          </Link>
        </div>

        <div className="card mb-6">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="label">Medicamento</label>
              <select
                name="medId"
                value={filters.medId}
                onChange={handleFilterChange}
                className="input"
              >
                <option value="">Todos</option>
                {meds.map((med) => (
                  <option key={med.id} value={med.id}>
                    {med.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Status</label>
              <select
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
                className="input"
              >
                <option value="">Todos</option>
                <option value="pendente">Pendente</option>
                <option value="finalizado">Finalizado</option>
                <option value="discrepancia">Discrepância</option>
              </select>
            </div>

            <div>
              <label className="label">Data Início</label>
              <input
                type="date"
                name="startDate"
                value={filters.startDate}
                onChange={handleFilterChange}
                className="input"
              />
            </div>

            <div>
              <label className="label">Data Fim</label>
              <input
                type="date"
                name="endDate"
                value={filters.endDate}
                onChange={handleFilterChange}
                className="input"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 mt-4">
            <button onClick={applyFilters} className="btn btn-primary min-h-[44px]">
              Aplicar Filtros
            </button>
            <button onClick={clearFilters} className="btn btn-secondary min-h-[44px]">
              Limpar
            </button>
          </div>
            </>
          )}
        </div>

        <div className="card">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            </div>
          ) : records.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Nenhum registro encontrado</p>
            </div>
          ) : (
            <>
              <div className="hidden md:block overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Data</th>
                      <th>Medicamento</th>
                      <th>Entregue por</th>
                      <th>Recebido por</th>
                      <th>Quantidade</th>
                      <th>Status</th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {currentItems.map((record) => (
                      <tr key={record.id}>
                        <td>
                          {new Date(record.date).toLocaleDateString('pt-BR')}
                          <br />
                          <span className="text-xs text-gray-500">
                            {new Date(record.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </td>
                        <td>
                          <div className="font-medium">{record.med?.name}</div>
                          <div className="text-xs text-gray-500">{record.med?.code}</div>
                        </td>
                        <td>
                          {record.deliveredBy?.name || record.deliveredBy?.email || '-'}
                          <br />
                          {record.deliveredAt && (
                            <span className="text-xs text-gray-500">
                              {new Date(record.deliveredAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          )}
                        </td>
                        <td>
                          {record.receivedBy?.name || record.receivedBy?.email || '-'}
                          <br />
                          {record.receivedAt && (
                            <span className="text-xs text-gray-500">
                              {new Date(record.receivedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          )}
                        </td>
                        <td>
                          <div>📦 {record.qtyDelivered} {record.med?.unit}</div>
                          {record.qtyReceived !== null && record.qtyReceived !== undefined && (
                            <div className="text-sm">✅ {record.qtyReceived} {record.med?.unit}</div>
                          )}
                        </td>
                        <td>
                          <span className={`text-xs px-2 py-1 rounded-full ${getStatusBadge(record.status)}`}>
                            {record.status}
                          </span>
                        </td>
                        <td>
                          <Link
                            to={`/records/${record.id}`}
                            className="text-primary-600 hover:text-primary-700 text-sm"
                          >
                            Ver detalhes
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="md:hidden space-y-4">
                {currentItems.map((record) => (
                  <div key={record.id} className="border border-gray-200 rounded-lg p-4 bg-white hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 text-base truncate">{record.med?.name}</h3>
                        <p className="text-xs text-gray-500">{record.med?.code}</p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ml-2 whitespace-nowrap ${getStatusBadge(record.status)}`}>
                        {record.status}
                      </span>
                    </div>

                    <div className="mb-3 pb-3 border-b border-gray-100">
                      <p className="text-sm text-gray-600">
                        📅 {new Date(record.date).toLocaleDateString('pt-BR')} às {new Date(record.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>

                    <div className="mb-3 space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Entregue:</span>
                        <span className="font-medium">📦 {record.qtyDelivered} {record.med?.unit}</span>
                      </div>
                      {record.qtyReceived !== null && record.qtyReceived !== undefined && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Recebido:</span>
                          <span className="font-medium">✅ {record.qtyReceived} {record.med?.unit}</span>
                        </div>
                      )}
                    </div>

                    <div className="mb-3 space-y-2 text-sm">
                      <div>
                        <span className="text-gray-600">Entregue por:</span>
                        <p className="font-medium text-gray-900 truncate">
                          {record.deliveredBy?.name || record.deliveredBy?.email || '-'}
                        </p>
                        {record.deliveredAt && (
                          <p className="text-xs text-gray-500">
                            às {new Date(record.deliveredAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        )}
                      </div>
                      <div>
                        <span className="text-gray-600">Recebido por:</span>
                        <p className="font-medium text-gray-900 truncate">
                          {record.receivedBy?.name || record.receivedBy?.email || '-'}
                        </p>
                        {record.receivedAt && (
                          <p className="text-xs text-gray-500">
                            às {new Date(record.receivedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        )}
                      </div>
                    </div>

                    <Link
                      to={`/records/${record.id}`}
                      className="block w-full text-center btn btn-secondary min-h-[44px] mt-3"
                    >
                      Ver detalhes →
                    </Link>
                  </div>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-t border-gray-200 pt-4">
                  <div className="text-xs sm:text-sm text-gray-700 text-center sm:text-left">
                    Mostrando {indexOfFirstItem + 1} a {Math.min(indexOfLastItem, records.length)} de {records.length} registros
                  </div>
                  <div className="flex flex-wrap gap-2 justify-center">
                    <button
                      onClick={() => paginate(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="px-3 py-2 min-h-[44px] border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      Anterior
                    </button>
                    
                    {/* Primeira página */}
                    {currentPage > 2 && (
                      <>
                        <button
                          onClick={() => paginate(1)}
                          className="px-3 py-2 min-h-[44px] border border-gray-300 rounded-md text-sm hover:bg-gray-50"
                        >
                          1
                        </button>
                        {currentPage > 3 && <span className="px-2 py-1">...</span>}
                      </>
                  )}

                  {[...Array(totalPages)].map((_, i) => {
                      const page = i + 1;
                      if (page >= currentPage - 1 && page <= currentPage + 1) {
                        return (
                          <button
                            key={page}
                            onClick={() => paginate(page)}
                            className={`px-3 py-2 min-h-[44px] border rounded-md text-sm ${
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

                  {currentPage < totalPages - 1 && (
                      <>
                        {currentPage < totalPages - 2 && <span className="px-2 py-1">...</span>}
                        <button
                          onClick={() => paginate(totalPages)}
                          className="px-3 py-2 min-h-[44px] border border-gray-300 rounded-md text-sm hover:bg-gray-50"
                        >
                          {totalPages}
                        </button>
                      </>
                    )}

                    <button
                      onClick={() => paginate(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="px-3 py-2 min-h-[44px] border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      Próxima
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
