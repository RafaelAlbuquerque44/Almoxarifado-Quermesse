import { useState, useEffect } from 'react';
import axios from 'axios';
import { ArrowRightLeft, Download } from 'lucide-react';
import QrCodeScanner from '../components/QrCodeScanner';

export default function Movimentacoes() {
  const [movimentacoes, setMovimentacoes] = useState<any[]>([]);
  const [produtos, setProdutos] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ produto_id: '', tipo: 'ENTRADA', quantidade: 1, responsavel: '', doador: '', isDoacao: false });
  const [searchTerm, setSearchTerm] = useState('');

  const fetchData = () => {
    axios.get(`http://${window.location.hostname}:3001/api/movimentacoes`).then(res => setMovimentacoes(res.data)).catch(console.error);
    axios.get(`http://${window.location.hostname}:3001/api/produtos`).then(res => setProdutos(res.data)).catch(console.error);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    axios.post(`http://${window.location.hostname}:3001/api/movimentacoes`, form)
      .then(() => {
        fetchData();
        setShowModal(false);
        setForm({ produto_id: produtos[0]?.id || '', tipo: 'ENTRADA', quantidade: 1, responsavel: '', doador: '', isDoacao: false });
      })
      .catch(err => {
        alert(err.response?.data?.error || 'Erro ao registrar movimentação');
      });
  };

  const exportToCSV = () => {
    const headers = ['ID', 'Data/Hora', 'Produto', 'Tipo', 'Quantidade', 'Responsável/Doador'];
    const rows = movimentacoes.map(m => [
      m.id,
      new Date(m.data).toLocaleString('pt-BR'),
      m.produto_nome,
      m.tipo,
      m.quantidade,
      m.responsavel || m.doador || '-'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(e => e.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `movimentacoes_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const movsFiltradas = movimentacoes.filter(m => {
    const term = searchTerm.toLowerCase();
    const nomeProd = m.produto_nome ? m.produto_nome.toLowerCase() : '';
    const resp = m.responsavel ? m.responsavel.toLowerCase() : '';
    const doad = m.doador ? m.doador.toLowerCase() : '';
    return nomeProd.includes(term) || resp.includes(term) || doad.includes(term);
  });

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">Histórico de Movimentações</h2>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="btn" style={{ backgroundColor: 'var(--glass-bg)', color: 'white', border: '1px solid var(--glass-border)' }} onClick={exportToCSV}>
            <Download size={18} /> Exportar CSV
          </button>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <ArrowRightLeft size={18} /> Registrar Movimentação
          </button>
        </div>
      </div>

      <div className="search-container" style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem' }}>
        <QrCodeScanner />
        <input 
          type="text" 
          className="form-control" 
          placeholder="Buscar por produto, responsável ou doador..." 
          value={searchTerm} 
          onChange={e => setSearchTerm(e.target.value)}
          style={{ flex: 1 }}
        />
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Data/Hora</th>
              <th>Produto</th>
              <th>Tipo</th>
              <th>Quantidade</th>
              <th>Responsável / Obs</th>
            </tr>
          </thead>
          <tbody>
            {movsFiltradas.map(m => (
              <tr key={m.id}>
                <td>{m.id}</td>
                <td>{new Date(m.data).toLocaleString('pt-BR')}</td>
                <td style={{ fontWeight: '600' }}>{m.produto_nome}</td>
                <td>
                  <span className={`badge ${m.tipo === 'ENTRADA' ? 'badge-entrada' : 'badge-saida'}`}>
                    {m.tipo} {m.doador ? '(Doação)' : ''}
                  </span>
                </td>
                <td style={{ fontWeight: 'bold' }}>{m.quantidade} un.</td>
                <td style={{ color: 'var(--text-secondary)' }}>
                  {m.tipo === 'SAIDA' ? m.responsavel : m.doador || '-'}
                </td>
              </tr>
            ))}
            {movsFiltradas.length === 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>Nenhuma movimentação encontrada.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 style={{ marginBottom: '1.5rem', fontSize: '1.5rem', fontWeight: '700' }}>Nova Movimentação</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Produto</label>
                <select 
                  required 
                  className="form-control" 
                  value={form.produto_id} 
                  onChange={e => setForm({...form, produto_id: e.target.value})}
                >
                  <option value="" disabled>Selecione um produto</option>
                  {produtos.map(p => (
                    <option key={p.id} value={p.id}>{p.nome} (Estoque: {p.quantidade})</option>
                  ))}
                </select>
              </div>
              <div className="form-group" style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label className="form-label">Tipo de Movimentação</label>
                  <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                      <input type="radio" name="tipo" value="ENTRADA" checked={form.tipo === 'ENTRADA'} onChange={e => setForm({...form, tipo: e.target.value})} />
                      Reposição (+ Estoque)
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                      <input type="radio" name="tipo" value="SAIDA" checked={form.tipo === 'SAIDA'} onChange={e => setForm({...form, tipo: e.target.value})} />
                      Retirada (- Estoque)
                    </label>
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <label className="form-label">Quantidade</label>
                  <input required type="number" min="1" className="form-control" value={form.quantidade} onChange={e => setForm({...form, quantidade: parseInt(e.target.value)})} />
                </div>
              </div>

              {form.tipo === 'SAIDA' && (
                <div className="form-group" style={{ marginTop: '1rem' }}>
                  <label className="form-label">Nome do Responsável / Barraca</label>
                  <input 
                    required 
                    className="form-control" 
                    value={form.responsavel} 
                    onChange={e => setForm({...form, responsavel: e.target.value})} 
                    placeholder="Ex: Barraca do Pastel, João, etc."
                  />
                </div>
              )}

              {form.tipo === 'ENTRADA' && (
                <div className="form-group" style={{ marginTop: '1rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', marginBottom: '0.5rem' }}>
                    <input type="checkbox" checked={form.isDoacao} onChange={e => setForm({...form, isDoacao: e.target.checked})} />
                    Este item foi recebido como Doação
                  </label>
                  {form.isDoacao && (
                    <input 
                      required 
                      className="form-control" 
                      value={form.doador} 
                      onChange={e => setForm({...form, doador: e.target.value})} 
                      placeholder="Nome do Doador ou Patrocinador"
                    />
                  )}
                </div>
              )}
              
              <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                <button type="button" className="btn" style={{ flex: 1, backgroundColor: 'transparent', border: '1px solid var(--border-color)', color: 'white' }} onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className={`btn ${form.tipo === 'ENTRADA' ? 'btn-success' : 'btn-danger'}`} style={{ flex: 1, padding: '1rem', fontSize: '1.1rem' }}>
                  Confirmar {form.tipo === 'ENTRADA' ? 'Reposição' : 'Retirada'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
