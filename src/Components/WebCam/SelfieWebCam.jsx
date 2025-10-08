import React, { useState, useRef, useEffect } from "react";

const SelfieWebcam = ({ show, onClose, onUsePhoto }) => {
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isPhotoTaken, setIsPhotoTaken] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const cameraRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    if (show) {
      setIsCameraOpen(true);
      createCameraElement();
    } else {
      stopCameraStream();
      setIsCameraOpen(false);
      setIsPhotoTaken(false);
    }

    return () => stopCameraStream();
  }, [show]);

  const createCameraElement = async () => {
    setIsLoading(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (cameraRef.current) cameraRef.current.srcObject = stream;
    } catch (error) {
      console.error("Erro ao acessar a câmera:", error);
      alert("O navegador não suporta a câmera ou houve um erro ao acessá-la.");
    } finally {
      setIsLoading(false);
    }
  };

  const stopCameraStream = () => {
    if (cameraRef.current && cameraRef.current.srcObject) {
      cameraRef.current.srcObject.getTracks().forEach((track) => track.stop());
    }
  };

  const takePhoto = () => {
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    const video = cameraRef.current;

    if (!isPhotoTaken) {
      canvas.width = 550;
      canvas.height = 420;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
    }

    setIsPhotoTaken(!isPhotoTaken);
  };

  const usePhoto = () => {
    const canvas = canvasRef.current;
    canvas.toBlob((blob) => {
      if (!blob) return;
      const file = new File([blob], `avatar_${Date.now()}.png`, { type: "image/png" });
      onUsePhoto(file);
    }, "image/png");
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-xl w-[600px] max-w-full overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">Captura de Imagem</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-4 flex flex-col items-center">
          {isLoading && (
            <div className="flex flex-col items-center justify-center mb-4">
              <div className="w-12 h-12 border-4 border-cyan-600 border-t-transparent rounded-full animate-spin mb-2"></div>
              <p className="text-gray-600">Carregando câmera...</p>
            </div>
          )}
          <div className="bg-gray-100 rounded-lg shadow-md overflow-hidden">
            <video
              ref={cameraRef}
              autoPlay
              className={`w-[550px] h-[420px] object-cover ${isPhotoTaken ? "hidden" : "block"}`}
            />
            <canvas
              ref={canvasRef}
              className={`w-[550px] h-[420px] object-cover ${isPhotoTaken ? "block" : "hidden"}`}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-4 p-4 border-t border-gray-200">
          {isPhotoTaken && (
            <button
              onClick={usePhoto}
              className="px-4 py-2 bg-cyan-700 hover:bg-cyan-800 text-white font-semibold rounded-md shadow-md transition"
            >
              Usar Foto
            </button>
          )}
          <button
            onClick={takePhoto}
            className={`px-4 py-2 font-semibold rounded-md shadow-md transition ${
              isPhotoTaken ? "bg-red-600 hover:bg-red-700 text-white" : "bg-cyan-600 hover:bg-cyan-700 text-white"
            }`}
          >
            {isPhotoTaken ? "Descartar" : "Capturar"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SelfieWebcam;
