/**
 * Interactive Payments Demo Server
 *
 * Serves the interactive developer integration playground & storefront UI
 * and bridges API requests to PesaJet Core API.
 */

import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PesaJet } from "./pesajet";
import type { Provider, TransactionType } from "./types";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function createDemoServer() {
  const app = express();
  app.use(express.json());

  // Serve static assets from public/
  const publicDir = path.resolve(__dirname, "../public");
  app.use(express.static(publicDir));

  // Initialize PesaJet SDK
  const getPesaJetClient = (overrideApiKey?: string) => {
    const apiKey =
      overrideApiKey || process.env.PESAJET_API_KEY || "pk_test_demo";
    const baseUrl =
      process.env.PESAJET_API_BASE_URL || "http://localhost:3000/api/v1";
    return new PesaJet({ apiKey, baseUrl });
  };

  /**
   * GET /api/demo/config
   * Returns active environment configuration for UI inspection
   */
  app.get("/api/demo/config", (_req, res) => {
    const apiKey = process.env.PESAJET_API_KEY || "pk_test_demo";
    const baseUrl =
      process.env.PESAJET_API_BASE_URL || "http://localhost:3000/api/v1";
    res.json({
      baseUrl,
      apiKeyMasked:
        apiKey.length > 8
          ? `${apiKey.slice(0, 7)}...${apiKey.slice(-4)}`
          : "pk_...",
      apiKey,
      status: "connected",
    });
  });

  /**
   * POST /api/demo/collect
   * Initiates mobile money collection via SDK
   */
  app.post("/api/demo/collect", async (req, res) => {
    const {
      amount,
      phoneNumber,
      provider,
      reference,
      description,
      metadata,
      customApiKey,
    } = req.body;

    const startTime = Date.now();
    try {
      const pesajet = getPesaJetClient(customApiKey);
      const transaction = await pesajet.payments.create({
        type: "COLLECTION",
        amount: Number(amount) || 10000,
        currency: "UGX",
        phoneNumber: phoneNumber || "+256770000001",
        provider: (provider as Provider) || undefined,
        reference: reference || `ORD-${Date.now()}`,
        description: description || "PesaJet Demo Store Purchase",
        metadata: metadata || { source: "web_demo" },
      });

      const durationMs = Date.now() - startTime;
      res.json({
        success: true,
        durationMs,
        transaction,
      });
    } catch (error: any) {
      const durationMs = Date.now() - startTime;
      res.status(error.statusCode || 400).json({
        success: false,
        durationMs,
        error: error.message,
        errorCode: error.errorCode,
        details: error.details,
      });
    }
  });

  /**
   * POST /api/demo/disburse
   * Initiates payout via SDK
   */
  app.post("/api/demo/disburse", async (req, res) => {
    const {
      amount,
      phoneNumber,
      provider,
      reference,
      description,
      customApiKey,
    } = req.body;

    const startTime = Date.now();
    try {
      const pesajet = getPesaJetClient(customApiKey);
      const transaction = await pesajet.payments.create({
        type: "DISBURSEMENT",
        amount: Number(amount) || 20000,
        currency: "UGX",
        phoneNumber: phoneNumber || "+256770000001",
        provider: (provider as Provider) || "mtn",
        reference: reference || `PAYOUT-${Date.now()}`,
        description: description || "PesaJet Demo Payout",
      });

      const durationMs = Date.now() - startTime;
      res.json({
        success: true,
        durationMs,
        transaction,
      });
    } catch (error: any) {
      const durationMs = Date.now() - startTime;
      res.status(error.statusCode || 400).json({
        success: false,
        durationMs,
        error: error.message,
        errorCode: error.errorCode,
        details: error.details,
      });
    }
  });

  /**
   * GET /api/demo/status/:id
   * Queries status of a transaction
   */
  app.get("/api/demo/status/:id", async (req, res) => {
    const customApiKey = req.query.apiKey as string | undefined;
    try {
      const pesajet = getPesaJetClient(customApiKey);
      const transaction = await pesajet.payments.get(req.params.id);
      res.json({ success: true, transaction });
    } catch (error: any) {
      res.status(error.statusCode || 400).json({
        success: false,
        error: error.message,
      });
    }
  });

  /**
   * GET /api/demo/preview
   * Computes fee breakdown
   */
  app.get("/api/demo/preview", async (req, res) => {
    const amount = Number(req.query.amount) || 50000;
    const provider = (req.query.provider as Provider) || "mtn";
    const type = (
      (req.query.type as string) || "COLLECTION"
    ).toUpperCase() as TransactionType;
    const customApiKey = req.query.apiKey as string | undefined;

    try {
      const pesajet = getPesaJetClient(customApiKey);
      const preview = await pesajet.payments.preview({
        amount,
        provider,
        type,
      });
      res.json({ success: true, preview });
    } catch (error: any) {
      res.status(error.statusCode || 400).json({
        success: false,
        error: error.message,
      });
    }
  });

  /**
   * GET /api/demo/history
   * Lists recent transactions
   */
  app.get("/api/demo/history", async (req, res) => {
    const customApiKey = req.query.apiKey as string | undefined;
    try {
      const pesajet = getPesaJetClient(customApiKey);
      const history = await pesajet.payments.list({ limit: 10 });
      res.json({ success: true, ...history });
    } catch (error: any) {
      res.status(error.statusCode || 400).json({
        success: false,
        error: error.message,
      });
    }
  });

  return app;
}
