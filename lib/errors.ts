export class RAGError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(message: string, code: string, status = 500) {
    super(message);
    this.name = "RAGError";
    this.code = code;
    this.status = status;
  }
}
