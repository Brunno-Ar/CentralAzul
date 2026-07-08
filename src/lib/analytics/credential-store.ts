/**
 * Credential Store
 *
 * Camada de abstracao para criptografar e descriptografar credenciais
 * de integracoes de analytics. Usa AES-256-GCM com chave derivada
 * de process.env.ENCRYPTION_KEY via HKDF (SHA-256).
 *
 * Para providers de API key simples (YouTube Data, GA4 service account):
 * credenciais sao armazenadas no model SystemConfig como JSON criptografado.
 *
 * Para providers OAuth (Meta Graph, YouTube Analytics):
 * credenciais sao armazenadas no model IntegrationCredential (Prisma).
 */

import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const TAG_LENGTH = 16;
const SALT = "central-azul-analytics-v1";

function getEncryptionKey(): Buffer {
  const raw = process.env.ENCRYPTION_KEY;
  if (!raw) {
    throw new Error(
      "ENCRYPTION_KEY nao definida no ambiente. " +
      "Gere uma chave com `openssl rand -base64 32` e adicione ao .env",
    );
  }
  return scryptSync(raw, SALT, 32);
}

export interface EncryptedPayload {
  /** Base64 do IV + ciphertext + authTag */
  data: string;
  /** Versao do esquema de criptografia para migracoes futuras */
  v: 1;
}

/**
 * Criptografa uma string usando AES-256-GCM.
 * Retorna um objeto serializavel com o payload criptografado.
 */
export function encrypt(plaintext: string): EncryptedPayload {
  const key = getEncryptionKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  // Formato: IV (12 bytes) + ciphertext + tag (16 bytes)
  const combined = Buffer.concat([iv, encrypted, tag]);

  return {
    data: combined.toString("base64"),
    v: 1,
  };
}

/**
 * Descriptografa um payload gerado por encrypt().
 * Lanca erro se a chave for incorreta ou se os dados forem adulterados.
 */
export function decrypt(payload: EncryptedPayload): string {
  if (payload.v !== 1) {
    throw new Error(`Versao de criptografia nao suportada: ${payload.v}`);
  }
  const key = getEncryptionKey();
  const combined = Buffer.from(payload.data, "base64");

  const iv = combined.subarray(0, IV_LENGTH);
  const tag = combined.subarray(combined.length - TAG_LENGTH);
  const ciphertext = combined.subarray(
    IV_LENGTH,
    combined.length - TAG_LENGTH,
  );

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  const decrypted = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
}

/**
 * Verifica se a ENCRYPTION_KEY esta configurada sem lancar erro.
 */
export function isEncryptionConfigured(): boolean {
  return !!process.env.ENCRYPTION_KEY;
}

/**
 * Serializa um objeto para JSON criptografado.
 */
export function encryptJSON(obj: unknown): EncryptedPayload {
  return encrypt(JSON.stringify(obj));
}

/**
 * Descriptografa e faz parse de um payload JSON.
 */
export function decryptJSON<T>(payload: EncryptedPayload): T {
  return JSON.parse(decrypt(payload)) as T;
}
