import HeaderQRCode from "../Components/HeaderQRCode";
import LeitorQrCode from "../Components/LeitorQrCode";

export default function QRCode() {
  return (
    <>
        <section className="flex flex-row bg-[#2faed4] h-[30vh] items-center place-content-between">
          <HeaderQRCode />
          <img
            className="w-[23vw] h-[20vh] mr-10"
            src="https://vrdocs.hmas.com.br/images/AlbertSchweitzer_Branco.png"
            alt="VR Vest Image"
          />
        </section>
        <LeitorQrCode />
    </>
  );
}
