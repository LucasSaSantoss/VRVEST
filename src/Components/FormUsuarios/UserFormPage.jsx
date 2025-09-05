import HeaderQRCode from "../HeaderQRCode";
import FormUsu from "./FormUsu";

export default function UserForm() {
  return (
    <div>
      <h2 className="text-2xl font-bold text-center mt-6 mb-6">
        Cadastro de Usuários
      </h2>
      <div>
        <FormUsu />
      </div>
    </div>
  );
}
