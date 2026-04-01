import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// move from /config → project root or backend root
dotenv.config({
  path: path.resolve(__dirname, "../../.env"),
});