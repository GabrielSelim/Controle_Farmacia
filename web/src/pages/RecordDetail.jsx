import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import Navbar from '../components/Navbar';

export default function RecordDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, hasRole } = useAuth();
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [receiving, setReceiving] = useState(false);
  const [qtyReceived, setQtyReceived] = useState('');

  useEffect(() => {
    loadRecord();
  }, [id]);

  const loadRecord = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/records/${id}`);
      setRecord(res.data.record);
      setQtyReceived(res.data.record.qtyDelivered?.toString() || '');
    } catch (error) {
      console.error('Erro ao carregar registro:', error);
      alert('Erro ao carregar registro');
      navigate('/records');
    } finally {
      setLoading(false);
    }
  };

  const handleReceive = async () => {
    if (!qtyReceived || qtyReceived === '') {
      alert('Por favor, informe a quantidade recebida');
      return;
    }

    if (!confirm('Confirma o recebimento com esta quantidade?')) {
      return;
    }

    try {
      setReceiving(true);
      await api.post(`/records/${id}/receive`, {
        qtyReceived: parseInt(qtyReceived)
      });
      alert('✅ Recebimento confirmado com sucesso!');
      loadRecord();
    } catch (error) {
      alert(error.response?.data?.error || 'Erro ao confirmar recebimento');
    } finally {
      setReceiving(false);
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
          {/* Informações principais */}
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

          {/* Entrega */}
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

          {/* Recebimento */}
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
                
                <div className="space-y-4">
                  <div>
                    <label className="label">Quantidade Recebida</label>
                    <input
                      type="number"
                      min="0"
                      value={qtyReceived}
                      onChange={(e) => setQtyReceived(e.target.value)}
                      className="input max-w-xs"
                      placeholder="Ex: 10"
                    />
                  </div>

                  <button
                    onClick={handleReceive}
                    disabled={receiving}
                    className="btn btn-primary"
                  >
                    {receiving ? 'Confirmando...' : '✅ Confirmar Recebimento'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Foto */}
          {record.photoUrl && (
            <div className="card">
              <h2 className="text-xl font-bold text-gray-900 mb-4">📸 Foto</h2>
              <img
                src={record.photoUrl}
                alt="Foto do registro"
                className="max-w-full rounded-lg"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            </div>
          )}

          {/* Logs de auditoria */}
          {record.auditLogs && record.auditLogs.length > 0 && (
            <div className="card">
              <h2 className="text-xl font-bold text-gray-900 mb-4">📋 Histórico de Alterações</h2>
              <div className="space-y-2">
                {record.auditLogs.map((log) => (
                  <div key={log.id} className="border-l-4 border-primary-500 pl-4 py-2">
                    <p className="text-sm font-semibold text-gray-900">
                      {log.action} {log.field && `- ${log.field}`}
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
