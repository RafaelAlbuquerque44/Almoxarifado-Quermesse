import { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import QrCodeScanner from '../components/QrCodeScanner';

export default function Produtos() {
  const [produtos, setProdutos] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategoria, setFilterCategoria] = useState('Todas');
  
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ nome: '', descricao: '', categoria: 'Bebidas', estoque_minimo: 10, quantidade: 0 });

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'produtos'), (snapshot) => {
      const prods = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProdutos(prods);
    });
    return () => unsub();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateDoc(doc(db, 'produtos', editingId), form);
      } else {
        await addDoc(collection(db, 'produtos'), form);
      }
      setShowModal(false);
      setEditingId(null);
      setForm({ nome: '', descricao: '', categoria: 'Bebidas', estoque_minimo: 10, quantidade: 0 });
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este produto?')) {
      try {
        await deleteDoc(doc(db, 'produtos', id));
      } catch (err) {
        console.error(err);
      }
    }
  };

  const openEdit = (prod: any) => {
    setForm({ nome: prod.nome, descricao: prod.descricao || '', categoria: prod.categoria, estoque_minimo: prod.estoque_minimo, quantidade: prod.quantidade });
    setEditingId(prod.id);
    setShowModal(true);
  };

  const openNew = () => {
    setEditingId(null);
    setForm({ nome: '', descricao: '', categoria: 'Bebidas', estoque_minimo: 10, quantidade: 0 });
    setShowModal(true);
  };

  const filtered = produtos.filter(p => {
    const matchName = p.nome?.toLowerCase().includes(searchTerm.toLowerCase()) || p.id === searchTerm;
    const matchCat = filterCategoria === 'Todas' || p.categoria === filterCategoria;
    return matchName && matchCat;
  });

  return (
    <div className="main-content slide-up">
      <div className="page-header">
        <div>
          <h2 className="page-title">Gestão de Produtos</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Cadastre e gerencie os itens da quermesse</p>
        </div>
        <button className="btn btn-primary" onClick={openNew}>
          <Plus size={20} /> Novo Produto
        </button>
      </div>

      <div className="search-container" style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
        <QrCodeScanner />
        <input 
          type="text" 
          className="form-control" 
          placeholder="Buscar produto por nome ou ID..." 
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
          <option value="Doces">Doces</option>
          <option value="Diversos">Diversos</option>
        </select>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>ID (QR Code)</th>
              <th>Nome</th>
              <th>Categoria</th>
              <th>Estoque Atual</th>
              <th>Mínimo</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(p => (
              <tr key={p.id}>
                <td style={{ color: 'var(--text-secondary)' }}>{p.id.slice(0,6)}...</td>
                <td style={{ fontWeight: 500, color: 'white' }}>{p.nome}</td>
                <td><span className="badge" style={{ backgroundColor: 'rgba(252, 211, 77, 0.2)', color: '#fcd34d' }}>{p.categoria}</span></td>
                <td>
                  <span style={{ 
                    color: p.quantidade <= p.estoque_minimo ? '#ef4444' : '#22c55e',
                    fontWeight: 600 
                  }}>
                    {p.quantidade} un.
                  </span>
                </td>
                <td style={{ color: 'var(--text-secondary)' }}>{p.estoque_minimo}</td>
                <td>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn" style={{ padding: '0.4rem', backgroundColor: 'rgba(255,255,255,0.1)' }} onClick={() => openEdit(p)} title="Editar">
                      <Edit2 size={16} />
                    </button>
                    <button className="btn" style={{ padding: '0.4rem', backgroundColor: 'rgba(239, 68, 68, 0.2)', color: '#ef4444' }} onClick={() => handleDelete(p.id)} title="Excluir">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 style={{ marginBottom: '1.5rem', fontSize: '1.5rem', fontWeight: '700' }}>{editingId ? 'Editar Produto' : 'Adicionar Produto'}</h3>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Nome do Produto</label>
                <input required type="text" className="form-control" value={form.nome} onChange={e => setForm({...form, nome: e.target.value})} />
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Categoria</label>
                  <select className="form-control" value={form.categoria} onChange={e => setForm({...form, categoria: e.target.value})}>
                    <option>Bebidas</option>
                    <option>Comidas</option>
                    <option>Doces</option>
                    <option>Diversos</option>
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Estoque Inicial</label>
                  <input required type="number" className="form-control" value={form.quantidade} onChange={e => setForm({...form, quantidade: Number(e.target.value)})} />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Estoque Mínimo (Alerta)</label>
                <input required type="number" className="form-control" value={form.estoque_minimo} onChange={e => setForm({...form, estoque_minimo: Number(e.target.value)})} />
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" className="btn" onClick={() => setShowModal(false)} style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.1)', color: 'white' }}>Cancelar</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>{editingId ? 'Salvar Alterações' : 'Salvar Produto'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
