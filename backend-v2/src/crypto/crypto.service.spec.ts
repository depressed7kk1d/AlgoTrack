import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { CryptoService } from './crypto.service';

describe('CryptoService', () => {
  let service: CryptoService;

  const mockConfig = {
    get: jest.fn((key: string) => {
      if (key === 'JWT_SECRET') return 'test-secret-key-for-encryption';
      return null;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CryptoService,
        { provide: ConfigService, useValue: mockConfig },
      ],
    }).compile();

    service = module.get<CryptoService>(CryptoService);
  });

  it('должен быть определён', () => {
    expect(service).toBeDefined();
  });

  describe('encrypt/decrypt', () => {
    it('должен зашифровать и расшифровать текст', () => {
      const original = 'my-secret-api-key-12345';
      
      const encrypted = service.encrypt(original);
      expect(encrypted).not.toBe(original);
      expect(encrypted).toContain(':'); // Формат iv:authTag:encrypted

      const decrypted = service.decrypt(encrypted);
      expect(decrypted).toBe(original);
    });

    it('должен возвращать пустую строку для пустого текста', () => {
      expect(service.encrypt('')).toBe('');
      expect(service.decrypt('')).toBe('');
    });

    it('каждое шифрование должно давать разный результат (IV случайный)', () => {
      const text = 'same-text';
      
      const encrypted1 = service.encrypt(text);
      const encrypted2 = service.encrypt(text);

      expect(encrypted1).not.toBe(encrypted2);
      
      // Но оба должны расшифровываться правильно
      expect(service.decrypt(encrypted1)).toBe(text);
      expect(service.decrypt(encrypted2)).toBe(text);
    });

    it('должен вернуть текст как есть если он не зашифрован', () => {
      const plainText = 'not-encrypted-text';
      const decrypted = service.decrypt(plainText);
      
      expect(decrypted).toBe(plainText);
    });
  });

  describe('isEncrypted', () => {
    it('должен определять зашифрованный текст', () => {
      const encrypted = service.encrypt('test');
      expect(service.isEncrypted(encrypted)).toBe(true);
    });

    it('должен определять незашифрованный текст', () => {
      expect(service.isEncrypted('plain-text')).toBe(false);
      expect(service.isEncrypted('')).toBe(false);
    });
  });
});

