import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  encrypt,
  decrypt,
  encryptJSON,
  decryptJSON,
  isEncryptionConfigured,
} from "@/lib/analytics/credential-store";
import type { EncryptedPayload } from "@/lib/analytics/credential-store";

const MOCK_KEY = "test-encryption-key-for-vitest-32b!";

beforeEach(() => {
  vi.stubEnv("ENCRYPTION_KEY", MOCK_KEY);
});

describe("credential-store encrypt/decrypt", () => {
  it("criptografa e descriptografa uma string corretamente", () => {
    const plaintext = "my-secret-api-key-12345";
    const encrypted = encrypt(plaintext);

    expect(encrypted.data).not.toBe(plaintext);
    expect(encrypted.v).toBe(1);

    const decrypted = decrypt(encrypted);
    expect(decrypted).toBe(plaintext);
  });

  it("gera payloads diferentes para o mesmo input (IV aleatorio)", () => {
    const plaintext = "same-secret";
    const e1 = encrypt(plaintext);
    const e2 = encrypt(plaintext);

    expect(e1.data).not.toEqual(e2.data);
  });

  it("lanca erro ao tentar descriptografar com versao errada", () => {
    const plaintext = "test";
    const encrypted = encrypt(plaintext);
    const tampered: EncryptedPayload = { data: encrypted.data, v: 99 as 1 };

    expect(() => decrypt(tampered)).toThrow(
      "Versao de criptografia nao suportada: 99",
    );
  });

  it("lanca erro ao tentar descriptografar dados adulterados", () => {
    const plaintext = "test";
    const encrypted = encrypt(plaintext);
    const tampered: EncryptedPayload = {
      data: encrypted.data.slice(0, -5) + "AAAAA",
      v: 1,
    };

    expect(() => decrypt(tampered)).toThrow();
  });

  it("encryptJSON e decryptJSON roundtrip", () => {
    const obj = { apiKey: "key123", propertyId: "42" };
    const encrypted = encryptJSON(obj);
    const decrypted = decryptJSON<typeof obj>(encrypted);

    expect(decrypted).toEqual(obj);
  });

  it("isEncryptionConfigured retorna true quando ENCRYPTION_KEY existe", () => {
    expect(isEncryptionConfigured()).toBe(true);
  });

  it("isEncryptionConfigured retorna false quando ENCRYPTION_KEY nao existe", () => {
    vi.stubEnv("ENCRYPTION_KEY", "");
    expect(isEncryptionConfigured()).toBe(false);
    vi.stubEnv("ENCRYPTION_KEY", MOCK_KEY);
  });

  it("lanca erro quando ENCRYPTION_KEY nao esta definida", () => {
    vi.stubEnv("ENCRYPTION_KEY", "");
    expect(() => encrypt("test")).toThrow("ENCRYPTION_KEY");
    vi.stubEnv("ENCRYPTION_KEY", MOCK_KEY);
  });
});
