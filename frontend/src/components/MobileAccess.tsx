import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Smartphone, X } from 'lucide-react';

export default function MobileAccess() {
  const [isOpen, setIsOpen] = useState(false);

  // URL do GitHub Pages (ou local se estiver rodando em dev)
  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  const accessUrl = isLocalhost ? `http://${window.location.hostname}:5173/` : window.location.href;

  return (
    <>
      <button 
        className="nav-link" 
        onClick={() => setIsOpen(true)}
        style={{ 
          background: 'none', border: 'none', cursor: 'pointer', width: '100%', 
          marginTop: 'auto', borderTop: '1px solid var(--glass-border)', borderRadius: '0' 
        }}
      >
        <Smartphone size={20} />
        <span>Compartilhar App</span>
      </button>

      {isOpen && (
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
          <div className="modal-content" style={{ maxWidth: '350px', textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0 }}>Compartilhar Acesso</h3>
              <button onClick={() => setIsOpen(false)} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}>
                <X size={24} />
              </button>
            </div>
            
            <div style={{ background: 'white', padding: '1.5rem', borderRadius: '16px', display: 'inline-block', marginBottom: '1rem' }}>
              <QRCodeSVG value={accessUrl} size={200} />
            </div>
            
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
              Mostre este QR Code para os voluntários escanearem e acessarem o sistema de qualquer lugar!
            </p>
            <small style={{ color: 'var(--accent-color)', wordBreak: 'break-all' }}>{accessUrl}</small>
          </div>
        </div>
      )}
    </>
  );
}
