import multer from "multer";
import path from "path";
import fs from "fs";

const folderPath = path.join(process.cwd(), "public", "images");

// Cria a pasta se não existir
if (!fs.existsSync(folderPath)) {
  fs.mkdirSync(folderPath, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, folderPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now();
    cb(null, `${file.fieldname}_${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

export const upload = multer({ storage });