import { useState } from 'react';
import { HashRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Package, ArrowRightLeft, Menu, X } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import Produtos from './pages/Produtos';
import Movimentacoes from './pages/Movimentacoes';

import MobileAccess from './components/MobileAccess';

function Sidebar({ isOpen, setIsOpen }: { isOpen: boolean, setIsOpen: (v: boolean) => void }) {
  const location = useLocation();
  
  return (
    <>
      <div className={`sidebar-overlay ${isOpen ? 'show' : ''}`} onClick={() => setIsOpen(false)}></div>
      <div className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h1 style={{ margin: 0, fontSize: '1.6rem' }}>Almoxarifado</h1>
          <button className="mobile-close-btn" onClick={() => setIsOpen(false)} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}>
            <X size={24} />
          </button>
        </div>
      <nav className="nav-container">
        <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>
          <LayoutDashboard size={20} />
          <span>Dashboard</span>
        </Link>
        <Link to="/produtos" className={`nav-link ${location.pathname === '/produtos' ? 'active' : ''}`}>
          <Package size={20} />
          <span>Produtos</span>
        </Link>
        <Link to="/movimentacoes" className={`nav-link ${location.pathname === '/movimentacoes' ? 'active' : ''}`}>
          <ArrowRightLeft size={20} />
          <span>Movimentações</span>
        </Link>
      </nav>
      <MobileAccess />
      </div>
    </>
  );
}

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <Router>
      <div className="app-container">
        <div className="mobile-top-bar">
          <button onClick={() => setSidebarOpen(true)} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}>
            <Menu size={28} />
          </button>
          <h2 style={{ fontSize: '1.2rem', margin: 0 }}>Almoxarifado</h2>
        </div>
        <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/produtos" element={<Produtos />} />
            <Route path="/movimentacoes" element={<Movimentacoes />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
