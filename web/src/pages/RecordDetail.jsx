import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import Navbar from '../components/Navbar';
import { useToast } from '../components/Toast';
import { useConfirm } from '../components/ConfirmDialog';

export default function RecordDetail() {
  const toast = useToast();
  const { confirm } = useConfirm();
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, hasRole } = useAuth();
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [receiving, setReceiving] = useState(false);
  const [qtyReceived, setQtyReceived] = useState('');
  const [currentShift, setCurrentShift] = useState(null);
  const [receivePhotoFile, setReceivePhotoFile] = useState(null);
  const [receivePhotoPreview, setReceivePhotoPreview] = useState(null);

  useEffect(() => {
    loadRecord();
    if (user?.role === 'farmaceutico') {
      checkCurrentShift();
    }
  }, [id, user]);

  const checkCurrentShift = async () => {
    try {
      const now = new Date();
      
      // Buscar plantões próximos (hoje, ontem e amanhã)
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
      
      if (myShifts.length > 0) {
        const TOLERANCE_MS = 2 * 60 * 60 * 1000; // 2 horas
        
        // Verificar se algum plantão está dentro da janela de tolerância
        const activeShift = myShifts.find(shift => {
          const shiftStart = new Date(shift.start);
          const shiftEnd = new Date(shift.end);
          const allowedStart = new Date(shiftStart.getTime() - TOLERANCE_MS);
          const allowedEnd = new Date(shiftEnd.getTime() + TOLERANCE_MS);
          
          return now >= allowedStart && now <= allowedEnd;
        });
        
        if (activeShift) {
          setCurrentShift(activeShift);
        }
      }
    } catch (error) {
    }
  };

  const loadRecord = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/records/${id}`);
      setRecord(res.data.record);
      setQtyReceived(res.data.record.qtyDelivered?.toString() || '');
    } catch (error) {
      toast.error('Erro ao carregar registro');
      navigate('/records');
    } finally {
      setLoading(false);
    }
  };

  const handleReceive = async () => {
    if (!qtyReceived || qtyReceived <= 0) {
      toast.warning('Por favor, informe a quantidade recebida');
      return;
    }

    const confirmed = await confirm({
      title: 'Confirmar Recebimento',
      message: `Confirma o recebimento de ${qtyReceived} unidades?`,
      confirmText: 'Confirmar',
      cancelText: 'Cancelar',
      confirmColor: 'green'
    });
    
    if (!confirmed) return;

    try {
      setReceiving(true);
      await api.post(`/records/${id}/receive`, {
        qtyReceived: parseInt(qtyReceived)
      });

      // Se houver foto, fazer upload separado
      if (receivePhotoFile) {
        const formData = new FormData();
        formData.append('photo', receivePhotoFile);
        await api.post(`/records/${id}/upload-photo`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
      }

      toast.success('Recebimento confirmado com sucesso!');
      setReceivePhotoFile(null);
      setReceivePhotoPreview(null);
      loadRecord();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erro ao confirmar recebimento');
    } finally {
      setReceiving(false);
    }
  };

  const handleReceivePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Apenas arquivos de imagem são permitidos (JPEG, PNG, GIF, WebP)');
      return;
    }

    // Validar tamanho (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast.error('A imagem deve ter no máximo 5MB');
      return;
    }

    setReceivePhotoFile(file);

    // Criar preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setReceivePhotoPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const removeReceivePhoto = () => {
    setReceivePhotoFile(null);
    setReceivePhotoPreview(null);
  };

  const getStatusBadge = (status) => {
    const badges = {
      pendente: 'bg-yellow-100 text-yellow-800',
      finalizado: 'bg-green-100 text-green-800',
      discrepancia: 'bg-red-100 text-red-800'
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
  };

  const translateAction = (action) => {
    const translations = {
      'CREATE': 'Criação',
      'UPDATE': 'Atualização',
      'DELETE': 'Exclusão',
      'RECEIVE': 'Recebimento',
      'DELIVER': 'Entrega'
    };
    return translations[action] || action;
  };

  const translateField = (field) => {
    const translations = {
      'qtyDelivered': 'Quantidade Entregue',
      'qtyReceived': 'Quantidade Recebida',
      'status': 'Status',
      'notes': 'Observações',
      'photoUrl': 'Foto'
    };
    return translations[field] || field;
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

  if (!record) {
    return (
      <>
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="card">
            <p className="text-gray-500">Registro não encontrado</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <button
            onClick={() => navigate('/records')}
            className="text-primary-600 hover:text-primary-700 mb-2"
          >
            ← Voltar para registros
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Detalhes do Registro</h1>
        </div>

        <div className="space-y-6">
          <div className="card">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-bold text-gray-900">Informações Gerais</h2>
              <span className={`text-sm px-3 py-1 rounded-full ${getStatusBadge(record.status)}`}>
                {record.status}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-600">Medicamento</p>
                <p className="font-semibold text-gray-900 mt-1">{record.med?.name}</p>
                <p className="text-sm text-gray-500">{record.med?.code}</p>
                {record.med?.location && (
                  <p className="text-sm text-gray-500">📍 {record.med.location}</p>
                )}
              </div>

              <div>
                <p className="text-sm text-gray-600">Data do Registro</p>
                <p className="font-semibold text-gray-900 mt-1">
                  {new Date(record.date).toLocaleString('pt-BR')}
                </p>
              </div>

              {record.shiftStart && (
                <div>
                  <p className="text-sm text-gray-600">Início do Plantão</p>
                  <p className="font-semibold text-gray-900 mt-1">
                    {new Date(record.shiftStart).toLocaleString('pt-BR')}
                  </p>
                </div>
              )}

              {record.shiftEnd && (
                <div>
                  <p className="text-sm text-gray-600">Fim do Plantão</p>
                  <p className="font-semibold text-gray-900 mt-1">
                    {new Date(record.shiftEnd).toLocaleString('pt-BR')}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <h2 className="text-xl font-bold text-gray-900 mb-4">📦 Entrega</h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Entregue por</p>
                <p className="font-semibold text-gray-900 mt-1">
                  {record.deliveredBy?.name || record.deliveredBy?.email}
                </p>
                <p className="text-sm text-gray-500">{record.deliveredBy?.email}</p>
              </div>

              <div>
                <p className="text-sm text-gray-600">Quantidade Entregue</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {record.qtyDelivered} {record.med?.unit}
                </p>
              </div>

              {record.deliveredAt && (
                <div>
                  <p className="text-sm text-gray-600">Data/Hora da Entrega</p>
                  <p className="font-semibold text-gray-900 mt-1">
                    {new Date(record.deliveredAt).toLocaleString('pt-BR')}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <h2 className="text-xl font-bold text-gray-900 mb-4">✅ Recebimento</h2>
            
            {record.receivedBy ? (
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Recebido por</p>
                  <p className="font-semibold text-gray-900 mt-1">
                    {record.receivedBy?.name || record.receivedBy?.email}
                  </p>
                  <p className="text-sm text-gray-500">{record.receivedBy?.email}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-600">Quantidade Recebida</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {record.qtyReceived} {record.med?.unit}
                  </p>
                  {record.qtyReceived !== record.qtyDelivered && (
                    <p className="text-sm text-red-600 font-semibold mt-1">
                      ⚠️ Discrepância: {Math.abs(record.qtyReceived - record.qtyDelivered)} {record.med?.unit}
                    </p>
                  )}
                </div>

                {record.receivedAt && (
                  <div>
                    <p className="text-sm text-gray-600">Data/Hora do Recebimento</p>
                    <p className="font-semibold text-gray-900 mt-1">
                      {new Date(record.receivedAt).toLocaleString('pt-BR')}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-yellow-800 font-semibold mb-4">
                  ⏳ Aguardando confirmação de recebimento
                </p>
                
                {/* Mostrar botão apenas se for chefe/admin OU farmacêutico com plantão ativo */}
                {(user?.role === 'chefe' || user?.role === 'admin' || (user?.role === 'farmaceutico' && currentShift)) ? (
                  <div className="space-y-4">
                    <div>
                      <label className="label">Quantidade Recebida *</label>
                      <input
                        type="number"
                        min="0"
                        value={qtyReceived}
                        onChange={(e) => setQtyReceived(e.target.value)}
                        className="input max-w-xs min-h-[44px]"
                        placeholder="Ex: 10"
                      />
                    </div>

                    {/* Upload de Foto do Recebimento */}
                    <div>
                      <label className="label">Foto do Recebimento (opcional)</label>
                      {!receivePhotoPreview ? (
                        <div className="mt-2">
                          <label className="flex flex-col items-center justify-center w-full h-32 sm:h-48 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-primary-500 transition-colors bg-gray-50 hover:bg-gray-100">
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                              <svg className="w-8 h-8 sm:w-10 sm:h-10 mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                              </svg>
                              <p className="mb-2 text-xs sm:text-sm text-gray-500">
                                <span className="font-semibold">Clique para fazer upload</span> ou arraste
                              </p>
                              <p className="text-xs text-gray-500">PNG, JPG, GIF, WebP (máx. 5MB)</p>
                            </div>
                            <input
                              type="file"
                              accept="image/*"
                              capture="environment"
                              onChange={handleReceivePhotoChange}
                              className="hidden"
                            />
                          </label>
                        </div>
                      ) : (
                        <div className="mt-2 relative">
                          <img 
                            src={receivePhotoPreview} 
                            alt="Preview" 
                            className="w-full max-h-96 object-contain rounded-lg border-2 border-gray-300"
                          />
                          <button
                            type="button"
                            onClick={removeReceivePhoto}
                            className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition-colors shadow-lg min-h-[44px] min-w-[44px] flex items-center justify-center"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                          <p className="text-xs text-gray-600 mt-2">
                            📎 {receivePhotoFile?.name} ({(receivePhotoFile?.size / 1024 / 1024).toFixed(2)}MB)
                          </p>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={handleReceive}
                      disabled={receiving}
                      className="btn btn-primary min-h-[44px]"
                    >
                      {receiving ? 'Confirmando...' : '✅ Confirmar Recebimento'}
                    </button>
                  </div>
                ) : (
                  <p className="text-sm text-gray-600">
                    {user?.role === 'farmaceutico' 
                      ? '⚠️ Você precisa ter um plantão ativo (com 2h de tolerância) para confirmar o recebimento.'
                      : '⚠️ Você não tem permissão para confirmar recebimentos.'}
                  </p>
                )}
              </div>
            )}
          </div>

          {record.photoUrl && (
            <div className="card">
              <h2 className="text-xl font-bold text-gray-900 mb-4">📸 Foto da Entrega</h2>
              <div className="relative">
                <img
                  src={`http://localhost:3000${record.photoUrl}`}
                  alt="Foto do registro"
                  className="w-full max-h-[600px] object-contain rounded-lg border-2 border-gray-200 cursor-pointer hover:border-primary-500 transition-colors"
                  onClick={(e) => {
                    // Abrir imagem em nova aba para visualização ampliada
                    window.open(e.target.src, '_blank');
                  }}
                  onError={(e) => {
                    e.target.parentElement.innerHTML = '<p class="text-gray-500 text-sm">⚠️ Erro ao carregar imagem</p>';
                  }}
                />
                <p className="text-xs text-gray-500 mt-2 text-center">
                  💡 Clique na imagem para ampliar
                </p>
              </div>
            </div>
          )}

          {record.auditLogs && record.auditLogs.length > 0 && (
            <div className="card">
              <h2 className="text-xl font-bold text-gray-900 mb-4">📋 Histórico de Alterações</h2>
              <div className="space-y-2">
                {record.auditLogs.map((log) => (
                  <div key={log.id} className="border-l-4 border-primary-500 pl-4 py-2">
                    <p className="text-sm font-semibold text-gray-900">
                      {translateAction(log.action)} {log.field && `- ${translateField(log.field)}`}
                    </p>
                    {log.oldValue && (
                      <p className="text-xs text-gray-600">Valor anterior: {log.oldValue}</p>
                    )}
                    {log.newValue && (
                      <p className="text-xs text-gray-600">Valor novo: {log.newValue}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      Por: {log.userEmail} em {new Date(log.createdAt).toLocaleString('pt-BR')}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
