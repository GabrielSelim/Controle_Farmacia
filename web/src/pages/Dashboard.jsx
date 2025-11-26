import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import Navbar from '../components/Navbar';

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    pendingDeliveries: 0,
    pendingReceipts: 0,
    pendingSwaps: 0,
    onDutyNow: false
  });
  const [recentRecords, setRecentRecords] = useState([]);
  const [upcomingShifts, setUpcomingShifts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Para assistentes, mostrar apenas plantões do dia
      if (user?.role === 'assistente') {
        const today = new Date().toISOString().split('T')[0];
        
        // Carregar plantões de hoje
        const shiftsRes = await api.get('/shifts', {
          params: { date: today }
        });
        const todayShifts = shiftsRes.data.shifts || [];
        
        // Verificar se está de plantão agora
        const now = new Date();
        const onDuty = todayShifts.some(s => 
          s.employeeId === user.id && 
          new Date(s.start) <= now && 
          new Date(s.end) >= now
        );
        
        // Encontrar o plantão do assistente hoje
        const myShift = todayShifts.find(s => s.employeeId === user.id);
        
        // Filtrar colegas que trabalham no mesmo horário
        const colleagues = myShift ? todayShifts.filter(s => 
          s.id !== myShift.id && // Não incluir o próprio plantão
          s.employeeId !== user.id && // Garantir que não é o próprio usuário
          new Date(s.start).getTime() === new Date(myShift.start).getTime() && // Mesma hora de início
          new Date(s.end).getTime() === new Date(myShift.end).getTime() // Mesma hora de fim
        ) : [];

        // Carregar solicitações de troca
        let pendingSwaps = 0;
        try {
          const swapsRes = await api.get('/swaps', {
            params: { status: 'pendente' }
          });
          pendingSwaps = swapsRes.data.length || 0;
        } catch (err) {
          console.log('Erro ao carregar swaps:', err);
        }

        setStats({
          pendingDeliveries: 0,
          pendingReceipts: 0,
          pendingSwaps,
          onDutyNow: onDuty
        });
        
        setUpcomingShifts(colleagues);
        setRecentRecords([]);
        
      } else {
        // Para farmacêuticos, chefes e admins
        // Carregar registros pendentes de entrega (criados mas não recebidos)
        const recordsRes = await api.get('/records', {
          params: { status: 'pendente' }
        });
        const allRecords = recordsRes.data.records || [];
        
        // Registros que o usuário entregou mas ainda não foram recebidos
        const myPendingDeliveries = allRecords.filter(r => r.deliveredById === user.id);
        
        // Registros pendentes de recebimento que o usuário pode receber
        const pendingReceipts = allRecords.filter(r => r.receivedById === null);

        // Carregar próximos plantões do usuário
        const now = new Date();
        const shiftsRes = await api.get('/shifts', {
          params: { startDate: now.toISOString() }
        });
        const allShifts = shiftsRes.data.shifts || [];
        
        // Filtrar plantões futuros do usuário
        const myUpcomingShifts = allShifts.filter(s => 
          s.employeeId === user.id && new Date(s.start) > now
        ).slice(0, 5);
        
        // Verificar se está de plantão agora
        const onDuty = allShifts.some(s => 
          s.employeeId === user.id && 
          new Date(s.start) <= now && 
          new Date(s.end) >= now
        );

        // Carregar registros recentes (não apenas de hoje)
        const allRecordsRes = await api.get('/records');
        const allRecentRecords = allRecordsRes.data.records || [];

        // Carregar solicitações de troca pendentes
        let pendingSwaps = 0;
        try {
          const swapsRes = await api.get('/swaps', {
            params: { status: 'pendente' }
          });
          pendingSwaps = swapsRes.data.length || 0;
        } catch (err) {
          console.log('Erro ao carregar swaps:', err);
        }

        setStats({
          pendingDeliveries: myPendingDeliveries.length,
          pendingReceipts: pendingReceipts.length,
          pendingSwaps,
          onDutyNow: onDuty
        });

        // Para chefes/admins: mostrar histórico de atividades
        // Para farmacêuticos: mostrar apenas suas ações
        if (user.role === 'chefe' || user.role === 'admin') {
          setRecentRecords(allRecentRecords.slice(0, 5));
        } else {
          // Farmacêuticos veem apenas registros onde eles são entregadores ou receptores
          const myRecords = allRecentRecords.filter(r => 
            r.deliveredById === user.id || r.receivedById === user.id
          );
          setRecentRecords(myRecords.slice(0, 5));
        }
        
        setUpcomingShifts(myUpcomingShifts);
      }
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pendente: 'bg-yellow-100 text-yellow-800',
      finalizado: 'bg-green-100 text-green-800',
      discrepancia: 'bg-red-100 text-red-800'
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
  };

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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Bem-vindo, {user?.name || user?.email}
          </h1>
          <p className="text-gray-600 mt-1">
            Painel de controle de medicamentos controlados
          </p>
        </div>

        {/* Cards de estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {stats.onDutyNow && (
            <div className="card bg-gradient-to-br from-green-50 to-green-100 border border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-800">Status do Plantão</p>
                  <p className="text-lg font-bold text-green-900 mt-2">🟢 Em Plantão Agora</p>
                </div>
                <div className="text-4xl">🏥</div>
              </div>
            </div>
          )}

          {(user?.role === 'farmaceutico' || user?.role === 'chefe') && (
            <>
              <div className="card bg-gradient-to-br from-yellow-50 to-yellow-100 border border-yellow-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-yellow-800">Aguardando Recebimento</p>
                    <p className="text-3xl font-bold text-yellow-900 mt-2">{stats.pendingReceipts}</p>
                  </div>
                  <div className="text-4xl">📦</div>
                </div>
              </div>

              <div className="card bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-800">Minhas Entregas Pendentes</p>
                    <p className="text-3xl font-bold text-blue-900 mt-2">{stats.pendingDeliveries}</p>
                  </div>
                  <div className="text-4xl">⏳</div>
                </div>
              </div>
            </>
          )}

          <div className="card bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-800">Trocas Pendentes</p>
                <p className="text-3xl font-bold text-purple-900 mt-2">{stats.pendingSwaps}</p>
              </div>
              <div className="text-4xl">🔄</div>
            </div>
          </div>
        </div>

        {/* Ações rápidas */}
        <div className="card mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Ações Rápidas</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {(user?.role === 'farmaceutico' || user?.role === 'chefe') && (
              <Link
                to="/records/new"
                className="btn btn-primary text-center"
              >
                ➕ Registrar Entrega
              </Link>
            )}
            {user?.role !== 'assistente' && (
              <Link
                to="/records"
                className="btn btn-secondary text-center"
              >
                📋 Ver Registros
              </Link>
            )}
            {user?.role !== 'admin' && (
              <Link
                to="/swaps"
                className="btn btn-secondary text-center"
              >
                🔄 Trocas de Plantão
              </Link>
            )}
            {(user?.role === 'chefe' || user?.role === 'admin') && (
              <>
                <Link
                  to="/shifts"
                  className="btn btn-secondary text-center"
                >
                  📅 Gerenciar Plantões
                </Link>
                <Link
                  to="/timeline"
                  className="btn btn-secondary text-center"
                >
                  📊 Histórico
                </Link>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Registros recentes - apenas para não assistentes */}
          {user?.role !== 'assistente' && (
            <div className="card">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                {user?.role === 'chefe' || user?.role === 'admin' ? 'Histórico de Atividades' : 'Minhas Atividades'}
              </h2>
              {recentRecords.length === 0 ? (
                <p className="text-gray-500 text-center py-4">Nenhum registro hoje</p>
              ) : (
                <div className="space-y-3">
                  {recentRecords.map((record) => (
                    <div key={record.id} className="border border-gray-200 rounded-lg p-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-gray-900">{record.med?.name}</p>
                          <p className="text-sm text-gray-600">
                            Entregue por: {record.deliveredBy?.name || record.deliveredBy?.email}
                          </p>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full ${getStatusBadge(record.status)}`}>
                          {record.status}
                        </span>
                      </div>
                      <div className="mt-2 flex gap-4 text-sm text-gray-600">
                        <span>📦 {record.qtyDelivered} {record.med?.unit}</span>
                        {record.qtyReceived && <span>✅ {record.qtyReceived} recebidas</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <Link
                to="/records"
                className="block text-center text-primary-600 hover:text-primary-700 font-medium mt-4"
              >
                Ver todos os registros →
              </Link>
            </div>
          )}

          {/* Próximos plantões ou Colegas de Trabalho (assistentes) */}
          <div className="card">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {user?.role === 'assistente' ? 'Colegas de Trabalho Hoje' : 'Meus Próximos Plantões'}
            </h2>
            {upcomingShifts.length === 0 ? (
              <p className="text-gray-500 text-center py-4">Nenhum plantão agendado</p>
            ) : (
              <div className="space-y-3">
                {upcomingShifts.map((shift) => (
                  <div key={shift.id} className="border border-gray-200 rounded-lg p-3">
                    <div className="flex items-start gap-3">
                      <div className="text-2xl">👤</div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">
                          {shift.employee?.name || 'Não atribuído'}
                        </p>
                        <p className="text-sm text-gray-500">
                          {shift.employee?.role === 'farmaceutico' ? 'Farmacêutico' : 
                           shift.employee?.role === 'chefe' ? 'Chefe' : 
                           shift.employee?.role === 'assistente' ? 'Assistente' : 'Outro'}
                        </p>
                        <p className="text-sm text-gray-600">
                          📅 {new Date(shift.start).toLocaleDateString('pt-BR')}
                        </p>
                        <p className="text-sm text-gray-600">
                          🕐 {new Date(shift.start).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} - {new Date(shift.end).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {user && (user.role === 'chefe' || user.role === 'admin') && (
              <Link
                to="/shifts"
                className="block text-center text-primary-600 hover:text-primary-700 font-medium mt-4"
              >
                Gerenciar plantões →
              </Link>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
