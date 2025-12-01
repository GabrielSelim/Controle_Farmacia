import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function ShiftHandoverModal({ user, onClose }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [shiftInfo, setShiftInfo] = useState(null);
  const [pendingRecords, setPendingRecords] = useState([]);

  useEffect(() => {
    checkShiftStatus();
  }, []);

  const checkShiftStatus = async () => {
    try {
      setLoading(true);
      const now = new Date();
      const TOLERANCE_MS = 2 * 60 * 60 * 1000; // 2 horas

      // Buscar plantões próximos (ontem, hoje e amanhã)
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      
      const today = now.toISOString().split('T')[0];
      
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];

      // Buscar plantões dos 3 dias
      const [resYesterday, resToday, resTomorrow] = await Promise.all([
        api.get('/shifts', { params: { date: yesterdayStr } }).catch(() => ({ data: { shifts: [] } })),
        api.get('/shifts', { params: { date: today } }).catch(() => ({ data: { shifts: [] } })),
        api.get('/shifts', { params: { date: tomorrowStr } }).catch(() => ({ data: { shifts: [] } }))
      ]);
      
      const allShifts = [
        ...(resYesterday.data.shifts || []),
        ...(resToday.data.shifts || []),
        ...(resTomorrow.data.shifts || [])
      ];
      
      const myShifts = allShifts.filter(s => s.employeeId === user.id);

      if (myShifts.length === 0) {
        onClose();
        return;
      }

      // Verificar qual plantão está ativo (com tolerância)
      let activeShift = null;
      let isStarting = false;
      let isEnding = false;

      for (const shift of myShifts) {
        const shiftStart = new Date(shift.start);
        const shiftEnd = new Date(shift.end);
        const allowedStart = new Date(shiftStart.getTime() - TOLERANCE_MS);
        const allowedEnd = new Date(shiftEnd.getTime() + TOLERANCE_MS);

        if (now >= allowedStart && now <= allowedEnd) {
          activeShift = shift;
          
          // Verificar se está no início ou fim do plantão
          const timeSinceStart = now - shiftStart;
          const timeUntilEnd = shiftEnd - now;
          
          // Se está nas primeiras 2h após início, está recebendo
          if (timeSinceStart >= 0 && timeSinceStart <= TOLERANCE_MS) {
            isStarting = true;
          }
          
          // Se está nas últimas 2h antes do fim, está entregando
          if (timeUntilEnd >= 0 && timeUntilEnd <= TOLERANCE_MS) {
            isEnding = true;
          }
          
          break;
        }
      }

      if (!activeShift) {
        onClose();
        return;
      }

      // Buscar registros pendentes de recebimento (criados no plantão anterior)
      const recordsRes = await api.get('/records', { params: { status: 'pendente' } });
      const pending = recordsRes.data.records || [];

      setShiftInfo({
        shift: activeShift,
        isStarting,
        isEnding,
        canDeliver: isEnding,
        canReceive: isStarting && pending.length > 0
      });
      setPendingRecords(pending);
    } catch (error) {
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleNewRecord = () => {
    onClose();
    navigate('/records/new');
  };

  const handleReceiveRecord = (recordId) => {
    onClose();
    navigate(`/records/${recordId}`);
  };

  const handleViewAllRecords = () => {
    onClose();
    navigate('/records');
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verificando plantão...</p>
        </div>
      </div>
    );
  }

  if (!shiftInfo) {
    return null;
  }

  const { shift, isStarting, isEnding, canDeliver, canReceive } = shiftInfo;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
        <div className="bg-primary-600 text-white px-4 sm:px-6 py-3 sm:py-4 rounded-t-lg">
          <h2 className="text-lg sm:text-2xl font-bold">
            {isStarting && canReceive && '🔔 Recebimento de Plantão'}
            {isEnding && canDeliver && '📋 Entrega de Plantão'}
            {!canReceive && !canDeliver && '👋 Bem-vindo ao seu Plantão'}
          </h2>
          <p className="text-xs sm:text-sm mt-1 text-primary-100">
            {new Date(shift.start).toLocaleString('pt-BR', { 
              day: '2-digit', 
              month: '2-digit',
              hour: '2-digit', 
              minute: '2-digit' 
            })} - {new Date(shift.end).toLocaleString('pt-BR', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </p>
        </div>

        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {isStarting && canReceive && (
            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 sm:p-6">
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="text-2xl sm:text-4xl">📥</div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base sm:text-lg font-bold text-blue-900 mb-2">
                    Você está RECEBENDO o plantão
                  </h3>
                  <p className="text-sm sm:text-base text-blue-800 mb-4">
                    Há <strong>{pendingRecords.length}</strong> registro(s) pendente(s) de confirmação de recebimento.
                  </p>
                  
                  {pendingRecords.length > 0 && (
                    <div className="space-y-2 mb-4">
                      {pendingRecords.slice(0, 3).map(record => (
                        <div 
                          key={record.id} 
                          className="bg-white rounded-lg p-3 border border-blue-200 hover:border-blue-400 transition-colors cursor-pointer"
                          onClick={() => handleReceiveRecord(record.id)}
                        >
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-gray-900 text-sm sm:text-base truncate">{record.med?.name}</p>
                              <p className="text-xs sm:text-sm text-gray-600">
                                Qtd. entregue: <strong>{record.qtyDelivered} {record.med?.unit}</strong>
                              </p>
                              <p className="text-xs text-gray-500 truncate">
                                Por: {record.deliveredBy?.name || record.deliveredBy?.username}
                              </p>
                            </div>
                            <button className="text-blue-600 hover:text-blue-700 text-xs sm:text-sm font-medium self-end sm:self-start min-h-[44px] sm:min-h-0">
                              Confirmar →
                            </button>
                          </div>
                        </div>
                      ))}
                      
                      {pendingRecords.length > 3 && (
                        <button
                          onClick={handleViewAllRecords}
                          className="w-full text-xs sm:text-sm text-blue-600 hover:text-blue-700 font-medium py-2 min-h-[44px]"
                        >
                          Ver todos os {pendingRecords.length} registros →
                        </button>
                      )}
                    </div>
                  )}

                  <button
                    onClick={handleViewAllRecords}
                    className="btn btn-primary w-full min-h-[44px]"
                  >
                    📋 Ir para Registros
                  </button>
                </div>
              </div>
            </div>
          )}

          {isEnding && canDeliver && (
            <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4 sm:p-6">
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="text-2xl sm:text-4xl">📤</div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base sm:text-lg font-bold text-green-900 mb-2">
                    Você está ENTREGANDO o plantão
                  </h3>
                  <p className="text-sm sm:text-base text-green-800 mb-4">
                    Registre as contagens de medicamentos para o próximo farmacêutico.
                  </p>

                  <button
                    onClick={handleNewRecord}
                    className="btn bg-green-600 hover:bg-green-700 text-white w-full min-h-[44px]"
                  >
                    📝 Criar Novo Registro de Entrega
                  </button>
                </div>
              </div>
            </div>
          )}

          {!canReceive && !canDeliver && (
            <div className="bg-gray-50 border-2 border-gray-200 rounded-lg p-4 sm:p-6 text-center">
              <div className="text-2xl sm:text-4xl mb-3">👋</div>
              <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-2">
                Seu plantão está ativo
              </h3>
              <p className="text-sm sm:text-base text-gray-600">
                Você pode acessar o sistema normalmente.
              </p>
            </div>
          )}

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 sm:p-4">
            <div className="flex gap-2 sm:gap-3">
              <div className="text-xl sm:text-2xl">💡</div>
              <div className="flex-1 text-xs sm:text-sm text-yellow-800">
                <p className="font-semibold mb-1">Lembre-se:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Você tem até <strong>2 horas de tolerância</strong> para registrar entregas/recebimentos</li>
                  <li>No início do plantão: Confirme os recebimentos pendentes</li>
                  <li>No fim do plantão: Crie os registros de entrega</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
            <button
              onClick={onClose}
              className="flex-1 btn btn-secondary min-h-[44px] order-2 sm:order-1"
            >
              Fechar
            </button>
            <button
              onClick={handleViewAllRecords}
              className="flex-1 btn btn-primary min-h-[44px] order-1 sm:order-2"
            >
              Ver Todos os Registros
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
