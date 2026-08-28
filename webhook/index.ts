import { createServer } from './src/server.ts';

const PORT = parseInt(process.env.PORT || '3000', 10);
const SECRET = process.env.PESAJET_WEBHOOK_SECRET;

const app = createServer();

app.listen(PORT, () => {
  console.log(`\n=============================================================`);
  console.log(`🚀 PesaJet Webhook Demo Server is RUNNING`);
  console.log(`🌐 Local URL:       http://localhost:${PORT}`);
  console.log(`📬 Webhook Ingest:  http://localhost:${PORT}/webhook`);
  console.log(`🛡️  Signing Secret:  ${SECRET ? `${SECRET.slice(0, 10)}... (Configured)` : '⚠️  NOT SET (Check .env)'}`);
  console.log(`=============================================================`);
  console.log(`👉 Send simulated webhooks using: pnpm simulate`);
  console.log(`👉 Events available: completed, failed, expired, test, invalid`);
  console.log(`=============================================================\n`);
});
