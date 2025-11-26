import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import Navbar from '../components/Navbar';

export default function ShiftSwaps() {
  const { user, hasRole } = useAuth();
  const [swaps, setSwaps] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [formData, setFormData] = useState({
    shiftId: '',
    targetId: '',
    targetShiftId: '',
    reason: ''
  });
  
  const [targetShifts, setTargetShifts] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [swapsRes, shiftsRes, usersRes] = await Promise.all([
        api.get('/swaps'),
        api.get('/shifts'),
        api.get('/users')
      ]);

      // Enriquecer swaps com informações dos plantões
      const enrichedSwaps = swapsRes.data.map(swap => {
        const requesterShift = (shiftsRes.data.shifts || shiftsRes.data || []).find(s => s.id === swap.shiftId);
        const targetShift = swap.targetShiftId ? (shiftsRes.data.shifts || shiftsRes.data || []).find(s => s.id === swap.targetShiftId) : null;
        return {
          ...swap,
          requesterShift,
          targetShift
        };
      });

      setSwaps(enrichedSwaps);
      setShifts(shiftsRes.data.shifts || shiftsRes.data || []);
      setUsers(usersRes.data.users || usersRes.data);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const shift = shifts.find(s => s.id === formData.shiftId);
      if (!shift) {
        alert('Plantão não encontrado');
        return;
      }

      const target = formData.targetId ? users.find(u => u.id === formData.targetId) : null;

      await api.post('/swaps', {
        shiftId: formData.shiftId,
        shiftDate: shift.start,
        requesterId: user.id,
        requesterEmail: user.email,
        requesterName: user.name || user.email,
        targetId: formData.targetId || null,
        targetEmail: target?.email || null,
        targetName: target?.name || target?.email || null,
        targetShiftId: formData.targetShiftId || null,
        reason: formData.reason
      });

      alert('Solicitação de troca criada com sucesso!');
      setShowModal(false);
      setFormData({ shiftId: '', targetId: '', targetShiftId: '', reason: '' });
      setTargetShifts([]);
      loadData();
    } catch (error) {
      console.error('Erro ao criar solicitação:', error);
      alert(error.response?.data?.error || 'Erro ao criar solicitação de troca');
    }
  };
  
  // Carregar plantões do colega selecionado
  const handleTargetChange = (targetId) => {
    setFormData({ ...formData, targetId, targetShiftId: '' });
    
    if (targetId) {
      const colleagueShifts = shifts.filter(s => 
        s.employeeId === targetId && 
        new Date(s.start) > new Date()
      );
      setTargetShifts(colleagueShifts);
    } else {
      setTargetShifts([]);
    }
  };

  const handleRespond = async (swapId, status) => {
    try {
      await api.patch(`/swaps/${swapId}/respond`, { status });
      alert(`Solicitação ${status === 'aceito' ? 'aceita' : 'recusada'} com sucesso!`);
      loadData();
    } catch (error) {
      console.error('Erro ao responder solicitação:', error);
      alert('Erro ao responder solicitação');
    }
  };

  const handleApprove = async (swapId) => {
    try {
      await api.patch(`/swaps/${swapId}/approve`);
      alert('Troca aprovada e plantão atualizado!');
      loadData();
    } catch (error) {
      console.error('Erro ao aprovar troca:', error);
      alert('Erro ao aprovar troca');
    }
  };

  const handleCancel = async (swapId) => {
    if (!confirm('Deseja cancelar esta solicitação?')) return;
    
    try {
      await api.delete(`/swaps/${swapId}`);
      alert('Solicitação cancelada!');
      loadData();
    } catch (error) {
      console.error('Erro ao cancelar:', error);
      alert('Erro ao cancelar solicitação');
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pendente: 'bg-yellow-100 text-yellow-800',
      aceito: 'bg-green-100 text-green-800',
      recusado: 'bg-red-100 text-red-800',
      cancelado: 'bg-gray-100 text-gray-800'
    };
    
    const labels = {
      pendente: 'Pendente',
      aceito: 'Aceito (Aguardando Aprovação)',
      recusado: 'Recusado',
      cancelado: 'Cancelado'
    };

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${badges[status]}`}>
        {labels[status]}
      </span>
    );
  };

  const canRespond = (swap) => {
    return swap.targetId === user.id && swap.status === 'pendente';
  };

  const canApprove = (swap) => {
    return hasRole(['chefe', 'admin']) && swap.status === 'aceito' && !swap.approvedBy;
  };

  const canCancel = (swap) => {
    return swap.requesterId === user.id && swap.status === 'pendente';
  };

  // Paginação
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = swaps.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(swaps.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Trocas de Plantão</h1>
            <p className="mt-2 text-sm text-gray-600">
              Solicite e gerencie trocas de plantão com outros farmacêuticos
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg font-medium transition-colors"
          >
            + Solicitar Troca
          </button>
        </div>

        {/* Lista de Solicitações */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Carregando...</div>
          ) : swaps.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              Nenhuma solicitação de troca encontrada
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {currentItems.map((swap) => (
                <div key={swap.id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {getStatusBadge(swap.status)}
                        <span className="text-sm text-gray-500">
                          {new Date(swap.shiftDate).toLocaleDateString('pt-BR', {
                            weekday: 'long',
                            day: '2-digit',
                            month: 'long'
                          })}
                        </span>
                      </div>
                      
                      <div className="space-y-1 text-sm">
                        <p>
                          <span className="font-semibold">{swap.requesterName}</span>
                          {' '}solicita troca
                          {swap.targetName && <> com <span className="font-semibold">{swap.targetName}</span></>}
                        </p>
                        
                        {/* Mostrar detalhes dos plantões */}
                        {swap.requesterShift && (
                          <div className="mt-2 p-2 bg-blue-50 rounded">
                            <p className="text-xs text-gray-600 font-medium">Plantão de {swap.requesterName}:</p>
                            <p className="text-sm">
                              📅 {new Date(swap.requesterShift.start).toLocaleDateString('pt-BR')} 
                              {' '}às {new Date(swap.requesterShift.start).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                              {' '}- {new Date(swap.requesterShift.end).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        )}
                        
                        {swap.targetShift && (
                          <div className="mt-2 p-2 bg-green-50 rounded">
                            <p className="text-xs text-gray-600 font-medium">Plantão de {swap.targetName}:</p>
                            <p className="text-sm">
                              📅 {new Date(swap.targetShift.start).toLocaleDateString('pt-BR')} 
                              {' '}às {new Date(swap.targetShift.start).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                              {' '}- {new Date(swap.targetShift.end).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        )}
                        
                        {swap.reason && (
                          <p className="text-gray-600 mt-2">
                            <span className="font-medium">Motivo:</span> {swap.reason}
                          </p>
                        )}
                        
                        {swap.approvedBy && (
                          <p className="text-green-600 mt-2">
                            ✓ Aprovado por {swap.approvedBy} em{' '}
                            {new Date(swap.approvedAt).toLocaleDateString('pt-BR')}
                          </p>
                        )}
                        
                        <p className="text-gray-500 text-xs mt-2">
                          Criado em {new Date(swap.createdAt).toLocaleDateString('pt-BR')} às{' '}
                          {new Date(swap.createdAt).toLocaleTimeString('pt-BR', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>

                    {/* Ações */}
                    <div className="flex gap-2 ml-4">
                      {canRespond(swap) && (
                        <>
                          <button
                            onClick={() => handleRespond(swap.id, 'aceito')}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
                          >
                            Aceitar
                          </button>
                          <button
                            onClick={() => handleRespond(swap.id, 'recusado')}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium"
                          >
                            Recusar
                          </button>
                        </>
                      )}
                      
                      {canApprove(swap) && (
                        <button
                          onClick={() => handleApprove(swap.id)}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                        >
                          Aprovar Troca
                        </button>
                      )}
                      
                      {canCancel(swap) && (
                        <button
                          onClick={() => handleCancel(swap.id)}
                          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm font-medium"
                        >
                          Cancelar
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Paginação */}
              {totalPages > 1 && (
                <div className="border-t border-gray-200 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Mostrando <span className="font-medium">{indexOfFirstItem + 1}</span> a{' '}
                    <span className="font-medium">{Math.min(indexOfLastItem, swaps.length)}</span> de{' '}
                    <span className="font-medium">{swaps.length}</span> solicitações
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
            </div>
          )}
        </div>
      </div>

      {/* Modal de Criar Solicitação */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">Solicitar Troca de Plantão</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Plantão
                </label>
                <select
                  value={formData.shiftId}
                  onChange={(e) => setFormData({ ...formData, shiftId: e.target.value })}
                  className="input w-full"
                  required
                >
                  <option value="">Selecione um plantão</option>
                  {shifts
                    .filter(s => {
                      // Se for assistente, só pode ver seus próprios plantões
                      if (user.role === 'assistente') {
                        return s.employeeId === user.id && new Date(s.start) > new Date();
                      }
                      // Senão, pode ver plantões atribuídos a ele (se tiver employeeId)
                      return s.employeeId === user.id && new Date(s.start) > new Date();
                    })
                    .map((shift) => (
                      <option key={shift.id} value={shift.id}>
                        {new Date(shift.start).toLocaleDateString('pt-BR')} -{' '}
                        {new Date(shift.start).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Trocar com (opcional)
                </label>
                <select
                  value={formData.targetId}
                  onChange={(e) => handleTargetChange(e.target.value)}
                  className="input w-full"
                >
                  <option value="">Qualquer disponível</option>
                  {users
                    .filter(u => {
                      if (u.id === user.id || !u.active) return false;
                      
                      // Assistente: só pode trocar com outros assistentes
                      if (user.role === 'assistente') {
                        return u.role === 'assistente';
                      }
                      
                      // Chefe: só pode trocar com farmacêuticos e outros chefes
                      if (user.role === 'chefe') {
                        return u.role === 'farmaceutico' || u.role === 'chefe';
                      }
                      
                      // Farmacêutico: só pode trocar com outros farmacêuticos e chefes
                      if (user.role === 'farmaceutico') {
                        return u.role === 'farmaceutico' || u.role === 'chefe';
                      }
                      
                      // Admin não deve fazer trocas
                      return false;
                    })
                    .map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name || u.email}
                      </option>
                    ))}
                </select>
              </div>

              {formData.targetId && targetShifts.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Plantão do Colega (opcional)
                  </label>
                  <select
                    value={formData.targetShiftId}
                    onChange={(e) => setFormData({ ...formData, targetShiftId: e.target.value })}
                    className="input w-full"
                  >
                    <option value="">Não especificar plantão</option>
                    {targetShifts.map((shift) => (
                      <option key={shift.id} value={shift.id}>
                        {new Date(shift.start).toLocaleDateString('pt-BR')} -{' '}
                        {new Date(shift.start).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Se selecionado, os dois plantões serão trocados quando aprovado
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Motivo
                </label>
                <textarea
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  className="input w-full"
                  rows="3"
                  placeholder="Descreva o motivo da troca..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg font-medium transition-colors flex-1">
                  Solicitar Troca
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setFormData({ shiftId: '', targetId: '', targetShiftId: '', reason: '' });
                    setTargetShifts([]);
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-800 hover:bg-gray-300 rounded-lg font-medium transition-colors flex-1"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
