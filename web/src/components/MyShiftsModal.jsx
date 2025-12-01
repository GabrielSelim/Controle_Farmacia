import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

export default function MyShiftsModal({ onClose }) {
  const { user } = useAuth();
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    loadShifts();
  }, [currentMonth]);

  const loadShifts = async () => {
    try {
      setLoading(true);
      
      // Buscar plantões do mês atual
      const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
      
      const response = await api.get('/shifts', {
        params: {
          startDate: startOfMonth.toISOString().split('T')[0],
          endDate: endOfMonth.toISOString().split('T')[0]
        }
      });

      // Filtrar apenas os plantões do usuário
      const myShifts = response.data.shifts.filter(s => s.employeeId === user.id);
      setShifts(myShifts);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Adicionar dias vazios do mês anterior
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Adicionar dias do mês
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }
    
    return days;
  };

  const getShiftsForDay = (day) => {
    if (!day) return [];
    
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const dateStr = date.toISOString().split('T')[0];
    
    return shifts.filter(shift => {
      const shiftDate = new Date(shift.start).toISOString().split('T')[0];
      return shiftDate === dateStr;
    });
  };

  const previousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const isToday = (day) => {
    if (!day) return false;
    const today = new Date();
    return (
      day === today.getDate() &&
      currentMonth.getMonth() === today.getMonth() &&
      currentMonth.getFullYear() === today.getFullYear()
    );
  };

  const monthName = currentMonth.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
  const days = getDaysInMonth();
  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
        <div className="bg-primary-600 text-white px-4 sm:px-6 py-3 sm:py-4 rounded-t-lg flex justify-between items-center sticky top-0 z-10">
          <h2 className="text-lg sm:text-xl font-bold">📅 Meus Plantões</h2>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 p-1 min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-4 sm:p-6">
          <div className="flex justify-between items-center mb-4 sm:mb-6 gap-2">
            <button
              onClick={previousMonth}
              className="btn btn-secondary px-3 sm:px-4 py-2 text-sm sm:text-base min-h-[44px]"
            >
              <span className="hidden sm:inline">← Anterior</span>
              <span className="sm:hidden">←</span>
            </button>
            <h3 className="text-base sm:text-xl font-bold text-gray-900 capitalize text-center">
              {monthName}
            </h3>
            <button
              onClick={nextMonth}
              className="btn btn-secondary px-3 sm:px-4 py-2 text-sm sm:text-base min-h-[44px]"
            >
              <span className="hidden sm:inline">Próximo →</span>
              <span className="sm:hidden">→</span>
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
          ) : (
            <>
              <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
                <div className="grid grid-cols-7 gap-px bg-gray-200 min-w-[280px]">
                  {weekDays.map(day => (
                    <div
                      key={day}
                      className="bg-gray-100 px-1 sm:px-2 py-2 sm:py-3 text-center text-xs sm:text-sm font-semibold text-gray-700"
                    >
                      <span className="hidden sm:inline">{day}</span>
                      <span className="sm:hidden">{day.substring(0, 1)}</span>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-px bg-gray-200 min-w-[280px]">
                  {days.map((day, index) => {
                    const dayShifts = getShiftsForDay(day);
                    const hasShift = dayShifts.length > 0;
                    const today = isToday(day);

                    return (
                      <div
                        key={index}
                        className={`bg-white min-h-[60px] sm:min-h-[100px] p-1 sm:p-2 ${
                          !day ? 'bg-gray-50' : ''
                        } ${today ? 'ring-2 ring-primary-500' : ''}`}
                      >
                        {day && (
                          <>
                            <div className={`text-xs sm:text-sm font-semibold mb-1 ${
                              today ? 'text-primary-600' : 'text-gray-700'
                            }`}>
                              {day}
                              {today && <span className="hidden sm:inline ml-1 text-xs">(Hoje)</span>}
                            </div>
                            
                            {hasShift && (
                              <div className="space-y-1">
                                {dayShifts.map(shift => (
                                  <div
                                    key={shift.id}
                                    className="bg-primary-100 border border-primary-300 rounded px-1 sm:px-2 py-0.5 sm:py-1 text-[10px] sm:text-xs"
                                  >
                                    <div className="font-semibold text-primary-900">
                                      🕐 {new Date(shift.start).toLocaleTimeString('pt-BR', {
                                        hour: '2-digit',
                                        minute: '2-digit'
                                      })}
                                    </div>
                                    <div className="hidden sm:block text-primary-700">
                                      até {new Date(shift.end).toLocaleTimeString('pt-BR', {
                                        hour: '2-digit',
                                        minute: '2-digit'
                                      })}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {shifts.length > 0 && (
                <div className="mt-4 sm:mt-6">
                  <h4 className="text-base sm:text-lg font-bold text-gray-900 mb-3">
                    📋 Resumo de Plantões ({shifts.length})
                  </h4>
                  <div className="space-y-2 max-h-48 sm:max-h-64 overflow-y-auto">
                    {shifts.map(shift => (
                      <div
                        key={shift.id}
                        className="bg-gray-50 border border-gray-200 rounded-lg p-2 sm:p-3 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 text-sm sm:text-base truncate">
                            {new Date(shift.start).toLocaleDateString('pt-BR', {
                              day: '2-digit',
                              month: 'long',
                              weekday: 'long'
                            })}
                          </p>
                          <p className="text-xs sm:text-sm text-gray-600">
                            🕐 {new Date(shift.start).toLocaleTimeString('pt-BR', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })} - {new Date(shift.end).toLocaleTimeString('pt-BR', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                        {shift.notificationSent && (
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded self-start sm:self-center whitespace-nowrap">
                            ✓ Notificado
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {shifts.length === 0 && (
                <div className="text-center py-8 text-sm sm:text-base text-gray-500">
                  Nenhum plantão agendado para este mês
                </div>
              )}
            </>
          )}

          <div className="mt-4 sm:mt-6 pt-4 border-t flex justify-end">
            <button
              onClick={onClose}
              className="btn btn-secondary min-h-[44px] px-6"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
