import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import Navbar from '../components/Navbar';
import { useToast } from '../components/Toast';

export default function NewRecord() {
  const toast = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [meds, setMeds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentShift, setCurrentShift] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [formData, setFormData] = useState({
    medId: '',
    qtyDelivered: '',
    shiftStart: '',
    shiftEnd: ''
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
    }
  };

  const loadMeds = async () => {
    try {
      const res = await api.get('/meds');
      setMeds(res.data.meds || []);
    } catch (error) {
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('A imagem deve ter no máximo 5MB');
        return;
      }

      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Apenas imagens são permitidas (JPEG, PNG, GIF, WEBP)');
        return;
      }

      setPhotoFile(file);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (user.role === 'farmaceutico' && !currentShift) {
      setError('Você precisa ter um plantão ativo para criar um registro de entrega. Entre em contato com o administrador.');
      return;
    }
    
    setLoading(true);

    try {
      const dataToSend = {
        medId: formData.medId,
        qtyDelivered: parseInt(formData.qtyDelivered),
        shiftStart: formData.shiftStart ? new Date(formData.shiftStart).toISOString() : null,
        shiftEnd: formData.shiftEnd ? new Date(formData.shiftEnd).toISOString() : null
      };

      const response = await api.post('/records', dataToSend);
      const recordId = response.data.record.id;

      if (photoFile) {
        const formDataPhoto = new FormData();
        formDataPhoto.append('photo', photoFile);
        
        await api.post(`/records/${recordId}/upload-photo`, formDataPhoto, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
      }
      toast.success('Registro de entrega criado com sucesso!');
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

            {!currentShift && user.role === 'farmaceutico' && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-800 font-medium">
                  ⛔ Nenhum plantão ativo encontrado para você no momento. Entre em contato com o administrador para configurar seu plantão.
                </p>
                <p className="text-xs text-red-700 mt-1">
                  Você não poderá criar registros até ter um plantão ativo.
                </p>
              </div>
            )}
            
            {!currentShift && (user.role === 'chefe' || user.role === 'admin') && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  ℹ️ Nenhum plantão ativo encontrado, mas você pode criar registros como {user.role === 'admin' ? 'administrador' : 'chefe'}.
                </p>
              </div>
            )}

            <div>
              <label htmlFor="photo" className="label">
                Foto do Medicamento (opcional)
              </label>
              
              {!photoPreview ? (
                <div className="mt-2">
                  <label htmlFor="photo" className="flex flex-col items-center justify-center w-full h-48 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <svg className="w-10 h-10 sm:w-12 sm:h-12 mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <p className="mb-2 text-xs sm:text-sm text-gray-500">
                        <span className="font-semibold">Clique para enviar</span> ou arraste e solte
                      </p>
                      <p className="text-xs text-gray-500">PNG, JPG, GIF ou WEBP (máx. 5MB)</p>
                      <p className="text-xs text-gray-500 mt-1">📱 No mobile: tire uma foto ou selecione da galeria</p>
                    </div>
                    <input
                      id="photo"
                      name="photo"
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handlePhotoChange}
                      className="hidden"
                    />
                  </label>
                </div>
              ) : (
                <div className="mt-2 relative">
                  <img 
                    src={photoPreview} 
                    alt="Preview" 
                    className="w-full max-h-96 object-contain rounded-lg border-2 border-gray-300"
                  />
                  <button
                    type="button"
                    onClick={removePhoto}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition-colors shadow-lg min-h-[44px] min-w-[44px] flex items-center justify-center"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                  <p className="text-xs text-gray-600 mt-2">
                    📎 {photoFile?.name} ({(photoFile?.size / 1024 / 1024).toFixed(2)}MB)
                  </p>
                </div>
              )}
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">ℹ️ Informações importantes:</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Este registro será marcado como entregue por você automaticamente</li>
                <li>• O próximo farmacêutico deverá confirmar o recebimento</li>
                <li>• Todos os registros ficam salvos no histórico para auditoria</li>
              </ul>
            </div>

            <div className="flex flex-col-reverse sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => navigate('/records')}
                className="btn btn-secondary min-h-[44px]"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading || (user.role === 'farmaceutico' && !currentShift)}
                className="btn btn-primary flex-1 min-h-[44px]"
              >
                {loading ? 'Salvando...' : '✅ Confirmar Entrega'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
