import { useState, useEffect } from 'react';
import axios from 'axios';
import { Package, TrendingUp, TrendingDown, AlertTriangle, Users, PieChart as PieIcon } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const COLORS = ['#f97316', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899'];

export default function Dashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Usando Node.js fallback, pois Python pode não estar instalado no seu sistema.
    // Para usar o Python mude a porta de 3001 para 8000 e altere a URL para /api/analytics/dashboard
    axios.get(`http://${window.location.hostname}:3001/api/dashboard`)
      .then(res => {
        setData(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Erro ao carregar dashboard', err);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="page-title">Carregando dados da Dashboard...</div>;
  if (!data) return <div className="page-title">Erro ao conectar com a API.</div>;

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">Visão Geral do CRM</h2>
      </div>

      <div className="dashboard-grid">
        <div className="stat-card">
          <Package className="stat-icon" size={24} />
          <span className="stat-title">Total de Itens no Estoque</span>
          <span className="stat-value">{data.total_produtos_ativos} un.</span>
        </div>

        <div className="stat-card">
          <TrendingDown className="stat-icon" size={24} style={{ color: 'var(--danger)' }} />
          <span className="stat-title">Retiradas Totais</span>
          <span className="stat-value">{data.movimentacoes.saidas} un.</span>
        </div>

        <div className="stat-card">
          <TrendingUp className="stat-icon" size={24} style={{ color: 'var(--success)' }} />
          <span className="stat-title">Reposições Totais</span>
          <span className="stat-value">{data.movimentacoes.entradas} un.</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginTop: '2rem' }}>
        <div className="table-container">
          <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertTriangle color="var(--danger)" size={20} />
            <h3 style={{ fontSize: '1.25rem' }}>Alerta: Estoque Crítico</h3>
          </div>
          {data.alertas_estoque.length === 0 ? (
            <div style={{ padding: '1rem', color: 'var(--success)' }}>Tudo certo! Nenhum produto atingiu o estoque mínimo.</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Produto</th>
                  <th>Qtd Atual</th>
                  <th>Mínimo Permitido</th>
                </tr>
              </thead>
              <tbody>
                {data.alertas_estoque.map((item: any, index: number) => (
                  <tr key={index}>
                    <td style={{ fontWeight: 'bold' }}>{item.nome}</td>
                    <td style={{ color: 'var(--danger)', fontWeight: 'bold' }}>{item.quantidade} un.</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{item.estoque_minimo} un.</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="table-container">
          <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Users color="var(--accent-color)" size={20} />
            <h3 style={{ fontSize: '1.25rem' }}>Últimas Retiradas</h3>
          </div>
          {data.saidas_recentes.length === 0 ? (
            <div style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Nenhuma retirada recente.</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Responsável</th>
                  <th>Produto</th>
                  <th>Qtd</th>
                </tr>
              </thead>
              <tbody>
                {data.saidas_recentes.map((item: any, index: number) => (
                  <tr key={index}>
                    <td style={{ fontWeight: 'bold' }}>{item.responsavel || '-'}</td>
                    <td>{item.nome}</td>
                    <td><span className="badge badge-saida">{item.quantidade} un.</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div className="table-container" style={{ marginTop: '2rem', padding: '1.5rem' }}>
        <div style={{ paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <PieIcon color="var(--accent-color)" size={20} />
          <h3 style={{ fontSize: '1.25rem' }}>Distribuição do Estoque por Categoria</h3>
        </div>
        
        {data.categorias_chart && data.categorias_chart.length > 0 ? (
          <div style={{ height: '300px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.categorias_chart}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="total"
                  nameKey="categoria"
                >
                  {data.categorias_chart.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--bg-panel)', borderColor: 'var(--border-color)', borderRadius: '8px' }}
                  itemStyle={{ color: 'var(--text-primary)' }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem' }}>
            Nenhum dado de categoria disponível ainda.
          </div>
        )}
      </div>

    </div>
  );
}
