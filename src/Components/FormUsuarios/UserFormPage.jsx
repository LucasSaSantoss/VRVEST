import HeaderQRCode from "../HeaderQRCode";
import FormUsu from "./FormUsu";

export default function UserForm() {
  return (
    <div>
      <section className="flex flex-row bg-[#2faed4] h-[30vh] items-center place-content-between">
        <HeaderQRCode/>
        <img
          className="w-[23vw] h-[20vh] mr-10"
          src="https://vrdocs.hmas.com.br/images/AlbertSchweitzer_Branco.png"
          alt="Logo Hmas"
        />
      </section>
      <h2 className="text-2xl font-bold text-center mt-6 mb-6">
        Cadastro de Usuários
      </h2>
      <div>
        <FormUsu />
      </div>
    </div>
  );
}
