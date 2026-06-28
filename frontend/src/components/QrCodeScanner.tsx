import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, QrCode } from 'lucide-react';

export default function QrCodeScanner() {
  const [isOpen, setIsOpen] = useState(false);

  // URL do GitHub Pages (ou local se estiver rodando em dev)
  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  const accessUrl = isLocalhost ? `http://${window.location.hostname}:5173/` : window.location.href;

  return (
    <>
      <button 
        className="btn" 
        style={{ backgroundColor: 'var(--glass-bg)', color: 'white', border: '1px solid var(--glass-border)', padding: '0.75rem' }}
        onClick={() => setIsOpen(true)}
        title="Acessar pelo Celular"
      >
        <QrCode size={18} />
      </button>

      {isOpen && (
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
          <div className="modal-content" style={{ maxWidth: '350px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0 }}>Acessar no Celular</h3>
              <button onClick={() => setIsOpen(false)} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}>
                <X size={24} />
              </button>
            </div>
            
            <div style={{ background: 'white', padding: '1.5rem', borderRadius: '16px', display: 'inline-block', marginBottom: '1rem' }}>
              <QRCodeSVG value={accessUrl} size={200} />
            </div>
            
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
              Abra a câmera do seu celular, aponte para este código e acesse o sistema de onde estiver!
            </p>
            <small style={{ color: 'var(--accent-color)' }}>{accessUrl}</small>
          </div>
        </div>
      )}
    </>
  );
}
