import React, { useState, useRef, useEffect } from "react";

const SelfieWebcam = ({ show, onClose, onUsePhoto }) => {
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isPhotoTaken, setIsPhotoTaken] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const cameraRef = useRef(null);
  const canvasRef = useRef(null);

  // Efeito para gerenciar o stream da câmera
  useEffect(() => {
    if (show) {
      setIsCameraOpen(true);
      createCameraElement();
    } else {
      stopCameraStream();
      setIsCameraOpen(false);
      setIsPhotoTaken(false);
    }

    return () => {
      stopCameraStream();
    };
  }, [show]);

  // Lógica para iniciar o stream da câmera
  const createCameraElement = async () => {
    setIsLoading(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (cameraRef.current) {
        cameraRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error("Erro ao acessar a câmera:", error);
      alert("O navegador não suporta a câmera ou houve um erro ao acessá-la.");
    } finally {
      setIsLoading(false);
    }
  };

  // Lógica para parar o stream da câmera
  const stopCameraStream = () => {
    if (cameraRef.current && cameraRef.current.srcObject) {
      cameraRef.current.srcObject.getTracks().forEach((track) => track.stop());
    }
  };

  // Lógica para tirar a foto
  const takePhoto = () => {
    if (!isPhotoTaken) {
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");
      const video = cameraRef.current;

      // Redimensiona o canvas para 384x384
      canvas.width = 550;
      canvas.height = 420;

      // Desenha a imagem da webcam no canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
    }
    setIsPhotoTaken(!isPhotoTaken);
  };

  // Lógica para usar a foto tirada
  const usePhoto = () => {
    const canvas = canvasRef.current;
    const image = canvas.toDataURL("image/png");
    onUsePhoto(image);
  };

  if (!show) {
    return null;
  }

  return (
    <div className="modal">
      <div className="modal-content">
        <div className="modal-header text-2xl">
          <h2>Captura de Imagem WebCam</h2>
          {/* <button onClick={onClose}>Fechar</button> */}
        </div>
        <div className="modal-body">
          {isLoading && (
            <div className="camera-loading">
              <div className="loader"></div>
              <p>Carregando câmera...</p>
            </div>
          )}
          <div className="camera-container">
            <video
              ref={cameraRef}
              style={{ display: isPhotoTaken ? "none" : "block" }}
              autoPlay
            />
            <canvas
              ref={canvasRef}
              style={{ display: isPhotoTaken ? "block" : "none" }}
            />
          </div>
        </div>
        <div className="modal-footer">
          {isPhotoTaken && (
            <button
              className="px-4 py-2 rounded-md font-semibold text-white shadow-md transition bg-cyan-700 hover:bg-cyan-800 ml-[8vw] mr-[2vw]"
              onClick={usePhoto}
            >
              Usar Foto
            </button>
          )}
          <button
            onClick={takePhoto}
            className={`px-4 py-2 rounded-md font-semibold text-white shadow-md transition ${
              isPhotoTaken
                ? "bg-red-600 hover:bg-red-700 "
                : "bg-cyan-600 hover:bg-cyan-700 ml-[12vw]"
            }`}
          >
            {isPhotoTaken ? "Descartar" : "Capturar!"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SelfieWebcam;
