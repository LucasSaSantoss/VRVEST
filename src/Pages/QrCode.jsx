import HeaderQRCode from "../Components/HeaderQRCode";
import LeitorQrCode from "../Components/LeitorQrCode";

export default function QRCode() {
  return (
    <>
      <div className="flex flex-col flex-wrap items-center h-screen bg-white">
        <section className="flex justify-end items-center w-full h-[35vh] bg-[#2faed4]">
          <HeaderQRCode />
          <img
            className="w-[30vw] mr-12"
            src="https://vrdocs.hmas.com.br/images/AlbertSchweitzer_Branco.png"
            alt="VR Vest Image"
          />
        </section>
        <LeitorQrCode />
      </div>
    </>
  );
}
