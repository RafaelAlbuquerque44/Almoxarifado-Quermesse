import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Smartphone, X } from 'lucide-react';

export default function MobileAccess() {
  const [isOpen, setIsOpen] = useState(false);
  const [localIp, setLocalIp] = useState('');

  useEffect(() => {
    // Tenta pegar o hostname real do navegador em que está rodando.
    // Se for localhost (aberto no PC), ele deve mostrar o IP da máquina, mas o navegador não expõe o IP local diretamente.
    // Como solução rápida, vamos assumir que o usuário rodará um script ou pegará via Node.js
    // Mas para simplicidade, se estiver rodando no PC, o Node.js que fornece a página já sabe o IP.
    // Contudo, como Vite injeta isso, uma abordagem mais robusta é pedir pro Backend Node qual é o IP dele.
    
    fetch(`http://${window.location.hostname}:3001/api/ip`)
      .then(res => res.json())
      .then(data => setLocalIp(data.ip))
      .catch(() => setLocalIp(window.location.hostname)); // fallback
      
  }, []);

  const accessUrl = `http://${localIp || window.location.hostname}:5173/`;

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
        <span>Acessar no Celular</span>
      </button>

      {isOpen && (
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
          <div className="modal-content" style={{ maxWidth: '350px', textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0 }}>Modo Bolso</h3>
              <button onClick={() => setIsOpen(false)} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}>
                <X size={24} />
              </button>
            </div>
            
            <div style={{ background: 'white', padding: '1.5rem', borderRadius: '16px', display: 'inline-block', marginBottom: '1rem' }}>
              <QRCodeSVG value={accessUrl} size={200} />
            </div>
            
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
              Abra a câmera do seu celular, aponte para este código e acesse o sistema pela mesma rede Wi-Fi!
            </p>
            <small style={{ color: 'var(--accent-color)' }}>{accessUrl}</small>
          </div>
        </div>
      )}
    </>
  );
}
