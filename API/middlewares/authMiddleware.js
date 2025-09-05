  import jwt from "jsonwebtoken";

  export const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) return res.status(401).json({ message: "Token não fornecido" });

    const token = authHeader.split(" ")[1];

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || "segredo_supersecreto", { expiresIn: "1h" });
      req.user = decoded; // dados do usuário logado disponíveis em req.user
      
      next();
    } catch (err) {
      return res.status(401).json({ message: "Token inválido" });
    }
  };