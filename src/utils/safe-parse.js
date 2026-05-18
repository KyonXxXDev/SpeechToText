import path from "node:path";
import { TEMP_DIR } from "./consts.js";

export async function safePath(filePath) {
    const resolved = path.resolve(filePath);

    if (!resolved.startsWith(TEMP_DIR)) {
        throw new Error("Ruta no permitida");
    }

    return resolved;
}