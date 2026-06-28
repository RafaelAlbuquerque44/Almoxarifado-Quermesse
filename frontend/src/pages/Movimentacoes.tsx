import { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { ArrowRightLeft } from 'lucide-react';
import QrCodeScanner from '../components/QrCodeScanner';

export default function Movimentacoes() {
  const [movimentacoes, setMovimentacoes] = useState<any[]>([]);
  const [produtos, setProdutos] = useState<any[]>([]);
  
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ produto_id: '', tipo: 'Saída', quantidade: 1, responsavel: '' });
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const unsubProds = onSnapshot(collection(db, 'produtos'), (snapshot) => {
      setProdutos(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    const unsubMovs = onSnapshot(collection(db, 'movimentacoes'), (snapshot) => {
      setMovimentacoes(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => { unsubProds(); unsubMovs(); };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Registrar movimentação
      await addDoc(collection(db, 'movimentacoes'), {
        ...form,
        data_hora: new Date().toISOString()
      });

      // Atualizar quantidade no produto
      const prodRef = doc(db, 'produtos', form.produto_id);
      const prodSnap = await getDoc(prodRef);
      if (prodSnap.exists()) {
        const prodData = prodSnap.data();
        let novaQtd = prodData.quantidade || 0;
        if (form.tipo === 'Entrada') novaQtd += form.quantidade;
        if (form.tipo === 'Saída') novaQtd -= form.quantidade;
        await updateDoc(prodRef, { quantidade: novaQtd });
      }

      setShowModal(false);
      setForm({ produto_id: '', tipo: 'Saída', quantidade: 1, responsavel: '' });
    } catch (err) {
      console.error(err);
    }
  };

  const filtered = movimentacoes.filter(m => {
    const prodName = produtos.find(p => p.id === m.produto_id)?.nome || '';
    return prodName.toLowerCase().includes(searchTerm.toLowerCase()) || 
           m.responsavel.toLowerCase().includes(searchTerm.toLowerCase());
  }).sort((a, b) => new Date(b.data_hora).getTime() - new Date(a.data_hora).getTime());

  return (
    <div className="main-content slide-up">
      <div className="page-header">
        <div>
          <h2 className="page-title">Movimentações</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Registre entradas de doações e saídas para barracas</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <ArrowRightLeft size={20} /> Nova Movimentação
          </button>
        </div>
      </div>

      <div className="search-container" style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem' }}>
        <QrCodeScanner />
        <input 
          type="text" 
          className="form-control" 
          placeholder="Buscar por produto ou responsável..." 
          value={searchTerm} 
          onChange={e => setSearchTerm(e.target.value)}
          style={{ flex: 1 }}
        />
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Data/Hora</th>
              <th>Produto</th>
              <th>Tipo</th>
              <th>Qtd</th>
              <th>Responsável/Barraca</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(m => {
              const produto = produtos.find(p => p.id === m.produto_id);
              return (
                <tr key={m.id}>
                  <td style={{ color: 'var(--text-secondary)' }}>{new Date(m.data_hora).toLocaleString()}</td>
                  <td style={{ fontWeight: 500, color: 'white' }}>{produto ? produto.nome : 'Desconhecido'}</td>
                  <td>
                    <span className="badge" style={{ 
                      backgroundColor: m.tipo === 'Entrada' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                      color: m.tipo === 'Entrada' ? '#22c55e' : '#ef4444'
                    }}>
                      {m.tipo}
                    </span>
                  </td>
                  <td style={{ fontWeight: 600 }}>{m.quantidade}</td>
                  <td>{m.responsavel}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 style={{ marginBottom: '1.5rem', fontSize: '1.5rem', fontWeight: '700' }}>Registrar Movimentação</h3>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Produto</label>
                <select required className="form-control" value={form.produto_id} onChange={e => setForm({...form, produto_id: e.target.value})}>
                  <option value="">Selecione um produto</option>
                  {produtos.map(p => (
                    <option key={p.id} value={p.id}>{p.nome} (Estoque: {p.quantidade})</option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Tipo</label>
                  <select className="form-control" value={form.tipo} onChange={e => setForm({...form, tipo: e.target.value})}>
                    <option>Saída</option>
                    <option>Entrada</option>
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Quantidade</label>
                  <input required type="number" min="1" className="form-control" value={form.quantidade} onChange={e => setForm({...form, quantidade: Number(e.target.value)})} />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Responsável (ou Doador/Barraca)</label>
                <input required type="text" className="form-control" placeholder="Ex: Barraca do Pastel" value={form.responsavel} onChange={e => setForm({...form, responsavel: e.target.value})} />
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" className="btn" onClick={() => setShowModal(false)} style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.1)', color: 'white' }}>Cancelar</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Confirmar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
