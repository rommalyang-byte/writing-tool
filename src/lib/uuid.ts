/** 生成简单的 UUID v4（客户端用，不依赖 crypto 库） */
export function generateId(): string {
  return crypto.randomUUID();
}