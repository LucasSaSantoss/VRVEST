import { BrowserRouter, Routes, Route } from "react-router-dom";
import LoginVR from "./LoginVR";
import FormularioVRVest from "./FormQR";
import QRCode from "./QrCode";

export default function App() {
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LoginVR />} />
          <Route path="/login" element={<LoginVR />} />
          <Route path="/qrcode" element={<QRCode />} />
          <Route path="/form" element={<FormularioVRVest />} />
        </Routes>
      </BrowserRouter>
      {/* 
      <div className="flex flex-col flex-wrap items-center h-screen bg-white overflow-hidden">
        <section className="flex justify-end items-center w-full h-[35vh] bg-[#2faed4]">
          <HeaderQRCode />

          <img
            className="w-[30vw] mr-12"
            src="https://vrdocs.hmas.com.br/images/AlbertSchweitzer_Branco.png"
            alt="VR Vest Image"
          />
        </section>
        <LeitorQrCode />
      </div> */}
    </>
  );
}
