import express, {
  type Request,
  type Response,
  type NextFunction,
} from "express";
import { verifyWebhookSignature } from "./verify.ts";
import { processWebhookEvent } from "./handlers.ts";
import type { PesaJetWebhookPayload } from "./types.ts";

export function createServer() {
  const app = express();

  // Parse JSON payloads
  app.use(express.json());

  // Health check endpoint
  app.get(["/", "/health"], (_req: Request, res: Response) => {
    res.json({
      status: "healthy",
      service: "pesajet-webhook-demo",
      timestamp: new Date().toISOString(),
    });
  });

  /**
   * PesaJet Webhook Ingestion Endpoint
   * Configure this URL in your PesaJet Merchant Dashboard:
   * https://your-domain.com/webhook
   */
  app.post(
    ["/webhook", "/api/webhook"],
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const signatureHeader = req.headers["x-webhook-signature"];
        const secret = process.env.PESAJET_WEBHOOK_SECRET;

        // 1. Verify Cryptographic HMAC Signature
        const verification = verifyWebhookSignature(
          req.body,
          signatureHeader,
          secret,
        );

        if (!verification.isValid) {
          console.error(
            `⛔ [SECURITY] Webhook signature verification failed: ${verification.reason}`,
          );
          res.status(401).json({
            error: "Unauthorized",
            message: verification.reason || "Invalid webhook signature",
          });
          return;
        }

        const payload = req.body as PesaJetWebhookPayload;

        // 2. Validate essential payload structure
        if (!payload || !payload.event || !payload.transactionId) {
          console.error(
            `⚠️ [BAD REQUEST] Malformed webhook payload received:`,
            req.body,
          );
          res.status(400).json({
            error: "Bad Request",
            message:
              "Missing required webhook payload fields (event, transactionId)",
          });
          return;
        }

        // 3. Process business logic (dispatched asynchronously or awaited)
        const result = await processWebhookEvent(payload);

        // 4. Always respond promptly with HTTP 200 OK
        // PesaJet expects a 2xx HTTP response within 30 seconds.
        res.status(200).json({
          received: true,
          event: payload.event,
          transactionId: payload.transactionId,
          duplicate: result.duplicate ?? false,
        });
      } catch (error) {
        next(error);
      }
    },
  );

  // Global Error Handler
  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error("💥 [ERROR] Uncaught webhook handler error:", err);
    res.status(500).json({
      error: "Internal Server Error",
      message: err.message,
    });
  });

  return app;
}
