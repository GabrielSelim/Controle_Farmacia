import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import Navbar from '../components/Navbar';
import { useToast } from '../components/Toast';
import { useConfirm } from '../components/ConfirmDialog';

export default function Shifts() {
  const toast = useToast();
  const { confirm } = useConfirm();
  const { user, hasRole } = useAuth();
  const [shifts, setShifts] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showModal, setShowModal] = useState(false);
  const [showRecurringModal, setShowRecurringModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    employeeId: '',
    start: '',
    end: ''
  });
  const [recurringData, setRecurringData] = useState({
    employeeId: '',
    pattern: '12x36',
    startDate: '',
    shiftStart: '19:00',
    shiftEnd: '07:00',
    customDays: [],
    durationDays: 30,
    durationType: 'days' // 'days' ou 'month'
  });

  const isChefOrAdmin = hasRole(['chefe', 'admin']);
  const isAssistant = user?.role === 'atendente';

  useEffect(() => {
    loadData();
  }, [selectedDate, user]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Sempre carregar shifts
      const shiftsRes = await api.get('/shifts', { params: { date: selectedDate } });
      setShifts(shiftsRes.data.shifts || shiftsRes.data);
      
      // Carregar usuários apenas se for chefe ou admin
      if (user && (user.role === 'chefe' || user.role === 'admin')) {
        const usersRes = await api.get('/users');
        const allUsers = usersRes.data.users || usersRes.data;
        const filteredUsers = allUsers.filter(u => u.role !== 'admin' && u.active);
        setUsers(filteredUsers);
      } else {
      }
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/shifts', formData);
      toast.success('Plantão criado com sucesso!');
      setShowModal(false);
      setFormData({ employeeId: '', start: '', end: '' });
      loadData();
    } catch (error) {
      toast.error('Erro ao criar plantão');
    }
  };

  const handleRecurringSubmit = async (e) => {
    e.preventDefault();
    try {
      let endDate;
      const startDate = new Date(recurringData.startDate);
      
      if (recurringData.durationType === 'month') {
        // Criar plantões para o mês inteiro
        endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0); // Último dia do mês
      } else {
        // Criar plantões por X dias
        endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + parseInt(recurringData.durationDays));
      }
      
      const dataToSend = {
        employeeId: recurringData.employeeId,
        pattern: recurringData.pattern,
        startDate: recurringData.startDate,
        endDate: endDate.toISOString().split('T')[0],
        shiftStart: recurringData.shiftStart,
        shiftEnd: recurringData.shiftEnd,
        customDays: recurringData.customDays
      };
      
      const response = await api.post('/shifts/recurring', dataToSend);
      toast.success(response.data.message);
      setShowRecurringModal(false);
      setRecurringData({
        employeeId: '',
        pattern: '12x36',
        startDate: '',
        shiftStart: '19:00',
        shiftEnd: '07:00',
        customDays: [],
        durationDays: 30,
        durationType: 'days'
      });
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erro ao criar plantões recorrentes');
    }
  };

  const handleDelete = async (shiftId) => {
    const confirmed = await confirm({
      title: 'Deletar Plantão',
      message: 'Tem certeza que deseja deletar este plantão? Esta ação não pode ser desfeita.',
      confirmText: 'Deletar',
      cancelText: 'Cancelar',
      confirmColor: 'red'
    });
    
    if (!confirmed) return;
    
    try {
      await api.delete(`/shifts/${shiftId}`);
      toast.success('Plantão deletado com sucesso!');
      loadData();
    } catch (error) {
      toast.error('Erro ao deletar plantão');
    }
  };

  const handleSendNotification = async (shift) => {
    try {
      await api.post('/notify/shift', { shiftId: shift.id });
      toast.success('Notificação enviada com sucesso!');
      await api.put(`/shifts/${shift.id}`, { notificationSent: true });
      loadData();
    } catch (error) {
      toast.error('Erro ao enviar notificação');
    }
  };

  const handleMarkAbsence = async (shift) => {
    const absenceType = prompt('Digite o tipo de ausência:\n- falta\n- folga\n- ferias');
    if (!absenceType || !['falta', 'folga', 'ferias'].includes(absenceType.toLowerCase())) {
      toast.error('Tipo de ausência inválido. Use: falta, folga ou ferias');
      return;
    }

    const description = prompt('Digite o motivo (opcional):');
    
    if (!shift.employee) {
      toast.error('Este plantão não tem funcionário atribuído');
      return;
    }

    try {
      await api.post('/absences', {
        userId: shift.employeeId,
        userEmail: shift.employee.email,
        userName: shift.employee.name || shift.employee.email,
        date: shift.start,
        reason: absenceType.toLowerCase(),
        description: description || ''
      });
      toast.success(`${absenceType.charAt(0).toUpperCase() + absenceType.slice(1)} registrada com sucesso!`);
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erro ao registrar ausência');
    }
  };

  const getRoleLabel = (role) => {
    const labels = {
      farmaceutico: 'Farmacêutico',
      chefe: 'Farmacêutico (Chefe)',
      atendente: 'Atendente de Farmácia',
      admin: 'Administrador'
    };
    return labels[role] || role;
  };

  const formatDateTime = (date) => {
    return new Date(date).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const changeDate = (days) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    setSelectedDate(newDate.toISOString().split('T')[0]);
  };

  const todayShifts = shifts.filter(s => {
    const shiftDate = new Date(s.start).toISOString().split('T')[0];
    return shiftDate === selectedDate;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Plantões</h1>
            <p className="mt-2 text-sm text-gray-600">
              {isAssistant 
                ? 'Visualize seus plantões e solicite trocas'
                : 'Gerencie a escala de plantões dos funcionários'}
            </p>
          </div>
          {isChefOrAdmin && (
            <button
              onClick={() => setShowRecurringModal(true)}
              className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg font-medium transition-colors"
            >
              📅 Criar Escala Recorrente
            </button>
          )}
        </div>

        {/* Navegação de Data */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex items-center justify-between">
            <button
              onClick={() => changeDate(-1)}
              className="px-4 py-2 bg-gray-200 text-gray-800 hover:bg-gray-300 rounded-lg font-medium transition-colors"
            >
              ← Dia Anterior
            </button>
            
            <div className="flex items-center gap-4">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
                className="px-4 py-2 bg-gray-200 text-gray-800 hover:bg-gray-300 rounded-lg font-medium transition-colors"
              >
                Hoje
              </button>
            </div>

            <button
              onClick={() => changeDate(1)}
              className="px-4 py-2 bg-gray-200 text-gray-800 hover:bg-gray-300 rounded-lg font-medium transition-colors"
            >
              Próximo Dia →
            </button>
          </div>
          
          <div className="mt-4 text-center">
            <h2 className="text-2xl font-bold text-gray-900">
              {new Date(selectedDate + 'T12:00:00').toLocaleDateString('pt-BR', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </h2>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Plantões do Dia ({todayShifts.length})
            </h3>
          </div>
          
          {loading ? (
            <div className="p-8 text-center text-gray-500">Carregando...</div>
          ) : todayShifts.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              Nenhum plantão agendado para este dia
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {todayShifts.map((shift) => (
                <div key={shift.id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="text-lg font-semibold text-gray-900">
                          {shift.employee ? shift.employee.name || shift.employee.email : 'Não atribuído'}
                        </h4>
                      </div>
                      
                      <div className="flex items-center gap-6 text-sm text-gray-600">
                        <span>🕐 {formatDateTime(shift.start)} - {formatDateTime(shift.end)}</span>
                        {shift.notificationSent && (
                          <span className="text-green-600">✓ Notificado</span>
                        )}
                      </div>
                    </div>

                    {isChefOrAdmin && (
                      <div className="flex gap-2 ml-4">
                        {!shift.notificationSent && shift.employee && (
                          <button
                            onClick={() => handleSendNotification(shift)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                          >
                            📱 Notificar
                          </button>
                        )}
                        <button
                          onClick={() => handleMarkAbsence(shift)}
                          className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 text-sm font-medium"
                        >
                          📅 Marcar Ausência
                        </button>
                        <button
                          onClick={() => handleDelete(shift.id)}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium"
                        >
                          Deletar
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">Criar Plantão</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Funcionário
                </label>
                <select
                  value={formData.employeeId}
                  onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Não atribuído</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name || u.email}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Início
                </label>
                <input
                  type="datetime-local"
                  value={formData.start}
                  onChange={(e) => setFormData({ ...formData, start: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fim
                </label>
                <input
                  type="datetime-local"
                  value={formData.end}
                  onChange={(e) => setFormData({ ...formData, end: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg font-medium transition-colors">
                  Criar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setFormData({ employeeId: '', start: '', end: '' });
                  }}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 hover:bg-gray-300 rounded-lg font-medium transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showRecurringModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Criar Escala Recorrente</h2>
            
            <form onSubmit={handleRecurringSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Funcionário
                </label>
                <select
                  value={recurringData.employeeId}
                  onChange={(e) => setRecurringData({ ...recurringData, employeeId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Não atribuído</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name || u.email}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Padrão de Repetição
                </label>
                <select
                  value={recurringData.pattern}
                  onChange={(e) => setRecurringData({ ...recurringData, pattern: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="12x36">12x36 (trabalha dia sim, dia não)</option>
                  <option value="weekdays">Segunda a Sexta (8h por dia)</option>
                  <option value="custom">Dias específicos da semana</option>
                </select>
              </div>

              {recurringData.pattern === 'custom' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Selecione os dias da semana
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day, index) => (
                      <label key={index} className="flex items-center gap-2 px-3 py-2 border rounded cursor-pointer hover:bg-gray-50">
                        <input
                          type="checkbox"
                          checked={recurringData.customDays.includes(index)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setRecurringData({
                                ...recurringData,
                                customDays: [...recurringData.customDays, index]
                              });
                            } else {
                              setRecurringData({
                                ...recurringData,
                                customDays: recurringData.customDays.filter(d => d !== index)
                              });
                            }
                          }}
                        />
                        {day}
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data Inicial da Escala
                </label>
                <input
                  type="date"
                  value={recurringData.startDate}
                  onChange={(e) => {
                    setRecurringData({ 
                      ...recurringData, 
                      startDate: e.target.value
                    });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Duração da Escala
                </label>
                <div className="flex gap-2">
                  <select
                    value={recurringData.durationType}
                    onChange={(e) => setRecurringData({ ...recurringData, durationType: e.target.value })}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="days">Por dias</option>
                    <option value="month">Mês inteiro</option>
                  </select>
                  
                  {recurringData.durationType === 'days' && (
                    <input
                      type="number"
                      min="1"
                      max="365"
                      value={recurringData.durationDays}
                      onChange={(e) => setRecurringData({ ...recurringData, durationDays: e.target.value })}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Ex: 30"
                      required
                    />
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {recurringData.durationType === 'month' 
                    ? 'Criará plantões para todo o mês da data inicial' 
                    : `Criará plantões por ${recurringData.durationDays} dias a partir da data inicial`}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Horário de Entrada
                  </label>
                  <input
                    type="time"
                    value={recurringData.shiftStart}
                    onChange={(e) => setRecurringData({ ...recurringData, shiftStart: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">Ex: 19:00 (entrada)</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Horário de Saída
                  </label>
                  <input
                    type="time"
                    value={recurringData.shiftEnd}
                    onChange={(e) => setRecurringData({ ...recurringData, shiftEnd: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">Ex: 07:00 (saída no dia seguinte se for antes da entrada)</p>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  💡 <strong>Dica:</strong> {recurringData.pattern === 'weekdays' 
                    ? 'Será criado um plantão de 8 horas para cada dia útil (segunda a sexta) no período especificado.' 
                    : 'Esta funcionalidade criará múltiplos plantões automaticamente de acordo com o padrão selecionado no período especificado.'}
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg font-medium transition-colors">
                  Criar Escala
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowRecurringModal(false);
                    setRecurringData({
                      employeeId: '',
                      pattern: '12x36',
                      startDate: '',
                      shiftStart: '19:00',
                      shiftEnd: '07:00',
                      customDays: [],
                      durationDays: 30,
                      durationType: 'days'
                    });
                  }}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 hover:bg-gray-300 rounded-lg font-medium transition-colors"
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
