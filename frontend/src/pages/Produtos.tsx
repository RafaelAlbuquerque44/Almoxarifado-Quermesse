import { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus } from 'lucide-react';
import QrCodeScanner from '../components/QrCodeScanner';

export default function Produtos() {
  const [produtos, setProdutos] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ nome: '', descricao: '', categoria: 'Bebidas', estoque_minimo: 10, quantidade: 0 });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategoria, setFilterCategoria] = useState('Todas');

  const fetchProdutos = () => {
    axios.get(`http://${window.location.hostname}:3001/api/produtos`)
      .then(res => setProdutos(res.data))
      .catch(console.error);
  };

  useEffect(() => {
    fetchProdutos();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    axios.post(`http://${window.location.hostname}:3001/api/produtos`, form)
      .then(() => {
        fetchProdutos();
        setShowModal(false);
        setForm({ nome: '', descricao: '', categoria: 'Bebidas', estoque_minimo: 10, quantidade: 0 });
      })
      .catch(console.error);
  };

  const produtosFiltrados = produtos.filter(p => {
    const matchesSearch = p.nome.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategoria = filterCategoria === 'Todas' || p.categoria === filterCategoria;
    return matchesSearch && matchesCategoria;
  });

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">Catálogo de Produtos</h2>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={18} /> Novo Produto
        </button>
      </div>

      <div className="search-container" style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
        <QrCodeScanner />
        <input 
          type="text" 
          className="form-control" 
          placeholder="Buscar produto por nome ou código..." 
          value={searchTerm} 
          onChange={e => setSearchTerm(e.target.value)}
          style={{ flex: 2 }}
        />
        <select 
          className="form-control" 
          value={filterCategoria} 
          onChange={e => setFilterCategoria(e.target.value)}
          style={{ flex: 1 }}
        >
          <option value="Todas">Todas as Categorias</option>
          <option value="Bebidas">Bebidas</option>
          <option value="Comidas">Comidas</option>
          <option value="Descartáveis">Descartáveis</option>
          <option value="Limpeza">Limpeza</option>
          <option value="Outros">Outros</option>
        </select>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Nome</th>
              <th>Categoria</th>
              <th>Descrição</th>
              <th>Estoque / Min</th>
            </tr>
          </thead>
          <tbody>
            {produtosFiltrados.map(p => (
              <tr key={p.id}>
                <td>{p.id}</td>
                <td style={{ fontWeight: '600' }}>{p.nome}</td>
                <td>
                  <span className="badge" style={{ backgroundColor: 'var(--border-color)' }}>{p.categoria}</span>
                </td>
                <td>{p.descricao}</td>
                <td>
                  <span style={{ fontWeight: 'bold', color: p.quantidade <= p.estoque_minimo ? 'var(--danger)' : 'var(--success)' }}>
                    {p.quantidade} un.
                  </span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginLeft: '0.5rem' }}>
                    (Min: {p.estoque_minimo})
                  </span>
                </td>
              </tr>
            ))}
            {produtosFiltrados.length === 0 && (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>Nenhum produto encontrado.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 style={{ marginBottom: '1.5rem', fontSize: '1.5rem', fontWeight: '700' }}>Cadastrar Novo Produto</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Nome do Produto</label>
                <input required className="form-control" value={form.nome} onChange={e => setForm({...form, nome: e.target.value})} placeholder="Ex: Refrigerante Lata" />
              </div>
              <div className="form-group" style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label className="form-label">Categoria</label>
                  <select className="form-control" value={form.categoria} onChange={e => setForm({...form, categoria: e.target.value})}>
                    <option>Bebidas</option>
                    <option>Comidas</option>
                    <option>Descartáveis</option>
                    <option>Limpeza</option>
                    <option>Outros</option>
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label className="form-label">Estoque Mínimo p/ Alerta</label>
                  <input required type="number" className="form-control" value={form.estoque_minimo} onChange={e => setForm({...form, estoque_minimo: parseInt(e.target.value)})} />
                </div>
              </div>
              <div className="form-group" style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 2 }}>
                  <label className="form-label">Descrição (Opcional)</label>
                  <input className="form-control" value={form.descricao} onChange={e => setForm({...form, descricao: e.target.value})} />
                </div>
                <div style={{ flex: 1 }}>
                  <label className="form-label">Estoque Inicial</label>
                  <input required type="number" className="form-control" value={form.quantidade} onChange={e => setForm({...form, quantidade: parseInt(e.target.value)})} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                <button type="button" className="btn" style={{ flex: 1, backgroundColor: 'transparent', border: '1px solid var(--border-color)', color: 'white' }} onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
