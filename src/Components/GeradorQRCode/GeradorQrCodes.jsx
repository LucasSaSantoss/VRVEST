import React, { useState } from "react";
import QRCode from "react-qr-code";

function QrCodeGenerator({cpf}) {
  const [value, setValue] = useState(cpf || ""); // State to hold the QR code content

  return (
    <div className="flex justify-center items-center">
      <h1></h1>
      {value && ( // Only render QR code if there's a value
        <div style={{ background: "white", padding: "5px" }}>
          <QRCode
            value={cpf}
            size={80} // Size of the QR code
            bgColor="#FFFFFF" // Background color
            fgColor="#000000" // Foreground color
            level="H" // Error correction level (L, M, Q, H)
          />
        </div>
      )}
      {/* <input
        className="mt-1 p-2 text-center text-bold w-full"
        type="text"
        value={cpf}
        onChange={(e) => setValue(e.target.value)}
        // placeholder="Digite o conteúdo do QR Code"
      /> */}
    </div>
  );
}

export default QrCodeGenerator;
