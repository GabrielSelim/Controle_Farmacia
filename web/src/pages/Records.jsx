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
      console.error('Erro ao carregar medicamentos:', error);
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
      console.error('Erro ao carregar registros:', error);
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Registros de Contagem</h1>
            <p className="text-gray-600 mt-1">Histórico de entregas e recebimentos</p>
          </div>
          <Link to="/records/new" className="btn btn-primary">
            ➕ Novo Registro
          </Link>
        </div>

        {/* Filtros */}
        <div className="card mb-6">
          <h3 className="font-semibold text-gray-900 mb-4">Filtros</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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

          <div className="flex gap-2 mt-4">
            <button onClick={applyFilters} className="btn btn-primary">
              Aplicar Filtros
            </button>
            <button onClick={clearFilters} className="btn btn-secondary">
              Limpar
            </button>
          </div>
        </div>

        {/* Tabela de registros */}
        <div className="card overflow-x-auto">
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

              {/* Paginação */}
              {totalPages > 1 && (
                <div className="mt-6 flex items-center justify-between border-t border-gray-200 pt-4">
                  <div className="text-sm text-gray-700">
                    Mostrando {indexOfFirstItem + 1} a {Math.min(indexOfLastItem, records.length)} de {records.length} registros
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
            </>
          )}
        </div>
      </div>
    </>
  );
}
