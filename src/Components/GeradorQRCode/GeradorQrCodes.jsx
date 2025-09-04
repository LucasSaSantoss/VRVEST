import React, { useState } from 'react';
    import QRCode from 'react-qr-code';

    function QrCodeGenerator() {
      const [value, setValue] = useState(''); // State to hold the QR code content

      return (
        <div className=''>
          <h1>Gerador de QR Code</h1>
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Digite o conteúdo do QR Code"
          />
          {value && ( // Only render QR code if there's a value
            <div style={{ background: 'white', padding: '16px' }}>
              <QRCode
                value={value}
                size={256} // Size of the QR code
                bgColor="#FFFFFF" // Background color
                fgColor="#000000" // Foreground color
                level="H" // Error correction level (L, M, Q, H)
              />
            </div>
          )}
        </div>
      );
    }

    export default QrCodeGenerator;