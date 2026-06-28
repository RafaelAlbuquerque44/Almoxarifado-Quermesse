import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Package, ArrowRightLeft } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import Produtos from './pages/Produtos';
import Movimentacoes from './pages/Movimentacoes';
import AiChat from './components/AiChat';
import MobileAccess from './components/MobileAccess';

function Sidebar() {
  const location = useLocation();
  
  return (
    <div className="sidebar">
      <h1>Almoxarifado Quermesse</h1>
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
  );
}

function App() {
  return (
    <Router>
      <div className="app-container">
        <Sidebar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/produtos" element={<Produtos />} />
            <Route path="/movimentacoes" element={<Movimentacoes />} />
          </Routes>
        </main>
        <AiChat />
      </div>
    </Router>
  );
}

export default App;
