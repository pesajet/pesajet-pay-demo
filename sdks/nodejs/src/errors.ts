export class PesaJetError extends Error {
  public statusCode?: number;
  public errorCode?: string;
  public details?: any;

  constructor(
    message: string,
    statusCode?: number,
    errorCode?: string,
    details?: any,
  ) {
    super(message);
    this.name = "PesaJetError";
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class WebhookVerificationError extends PesaJetError {
  constructor(message = "Webhook cryptographic signature mismatch") {
    super(message, 401, "WEBHOOK_SIGNATURE_MISMATCH");
    this.name = "WebhookVerificationError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
