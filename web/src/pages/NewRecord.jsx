import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import Navbar from '../components/Navbar';

export default function NewRecord() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [meds, setMeds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentShift, setCurrentShift] = useState(null);
  const [formData, setFormData] = useState({
    medId: '',
    qtyDelivered: '',
    shiftStart: '',
    shiftEnd: '',
    photoUrl: ''
  });
  const [error, setError] = useState('');

  useEffect(() => {
    loadMeds();
    loadCurrentShift();
  }, [user]);

  const loadCurrentShift = async () => {
    try {
      // Buscar plantão atual do usuário logado
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      
      const res = await api.get('/shifts', { params: { date: today } });
      const shifts = res.data.shifts || [];
      
      // Encontrar o plantão do usuário logado que está ativo agora
      const userShift = shifts.find(shift => {
        if (shift.employeeId !== user.id) return false;
        
        const start = new Date(shift.start);
        const end = new Date(shift.end);
        
        return now >= start && now <= end;
      });

      if (userShift) {
        setCurrentShift(userShift);
        
        // Preencher automaticamente os campos de horário
        const startFormatted = new Date(userShift.start).toISOString().slice(0, 16);
        const endFormatted = new Date(userShift.end).toISOString().slice(0, 16);
        
        setFormData(prev => ({
          ...prev,
          shiftStart: startFormatted,
          shiftEnd: endFormatted
        }));
      }
    } catch (error) {
      console.error('Erro ao carregar plantão atual:', error);
    }
  };

  const loadMeds = async () => {
    try {
      const res = await api.get('/meds');
      setMeds(res.data.meds || []);
    } catch (error) {
      console.error('Erro ao carregar medicamentos:', error);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const dataToSend = {
        medId: formData.medId,
        qtyDelivered: parseInt(formData.qtyDelivered),
        shiftStart: formData.shiftStart ? new Date(formData.shiftStart).toISOString() : null,
        shiftEnd: formData.shiftEnd ? new Date(formData.shiftEnd).toISOString() : null,
        photoUrl: formData.photoUrl || null
      };

      await api.post('/records', dataToSend);
      alert('✅ Registro de entrega criado com sucesso!');
      navigate('/records');
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao criar registro');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Novo Registro de Entrega</h1>
          <p className="text-gray-600 mt-1">Registre a contagem de medicamentos para entrega</p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="medId" className="label">
                Medicamento *
              </label>
              <select
                id="medId"
                name="medId"
                value={formData.medId}
                onChange={handleChange}
                required
                className="input"
              >
                <option value="">Selecione um medicamento</option>
                {meds.map((med) => (
                  <option key={med.id} value={med.id}>
                    {med.name} - {med.code} ({med.location})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="qtyDelivered" className="label">
                Quantidade Entregue *
              </label>
              <input
                id="qtyDelivered"
                name="qtyDelivered"
                type="number"
                min="0"
                value={formData.qtyDelivered}
                onChange={handleChange}
                required
                className="input"
                placeholder="Ex: 10"
              />
            </div>

            {currentShift && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-green-800">
                  ✓ Plantão identificado: {new Date(currentShift.start).toLocaleString('pt-BR')} até {new Date(currentShift.end).toLocaleString('pt-BR')}
                </p>
              </div>
            )}

            {!currentShift && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  ⚠️ Nenhum plantão ativo encontrado para você no momento. Entre em contato com o administrador para configurar seu plantão.
                </p>
              </div>
            )}

            <div>
              <label htmlFor="photoUrl" className="label">
                URL da Foto (opcional)
              </label>
              <input
                id="photoUrl"
                name="photoUrl"
                type="url"
                value={formData.photoUrl}
                onChange={handleChange}
                className="input"
                placeholder="https://exemplo.com/foto.jpg"
              />
              <p className="text-xs text-gray-500 mt-1">
                Cole a URL de uma foto hospedada externamente
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">ℹ️ Informações importantes:</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Este registro será marcado como entregue por você automaticamente</li>
                <li>• O próximo farmacêutico deverá confirmar o recebimento</li>
                <li>• Todos os registros ficam salvos no histórico para auditoria</li>
              </ul>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary flex-1"
              >
                {loading ? 'Salvando...' : '✅ Confirmar Entrega'}
              </button>
              <button
                type="button"
                onClick={() => navigate('/records')}
                className="btn btn-secondary"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
