import { grabar } from "./src/utils/grabar.js";
import { transcriptor } from "./src/utils/transcriptor.js";

async function main() {
    await grabar();
    transcriptor();
}
await main();