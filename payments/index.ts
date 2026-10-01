/**
 * PesaJet Payments Integration Demo Server Entry Point
 */

import { createDemoServer } from "./src/server";

const PORT = process.env.PORT || 8001;
const app = createDemoServer();

app.listen(PORT, () => {
  console.log("\n=======================================================");
  console.log(`🚀 PesaJet Payments Demo Server running at:`);
  console.log(`👉 http://localhost:${PORT}`);
  console.log(`=======================================================`);
  console.log(
    `• Interactive Code Generator & Storefront: http://localhost:${PORT}`,
  );
  console.log(
    `• Connected to PesaJet API: ${process.env.PESAJET_API_BASE_URL || "http://localhost:3000/api/v1"}`,
  );
  console.log(`• Run automated SDK tests:  pnpm test`);
  console.log(
    `• Fast CLI collection:      pnpm collect:mtn 15000 +256771234567`,
  );
  console.log(`=======================================================\n`);
});
