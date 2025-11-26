import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class CryptoService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly encryptionKey: Buffer;

  constructor(private configService: ConfigService) {
    // Ключ шифрования из .env (должен быть 32 байта для AES-256)
    const key = this.configService.get('ENCRYPTION_KEY') || this.configService.get('JWT_SECRET');
    
    if (!key) {
      throw new Error('ENCRYPTION_KEY не настроен в .env');
    }

    // Создаём 32-байтовый ключ из строки
    this.encryptionKey = crypto.scryptSync(key, 'salt', 32);
  }

  /**
   * Шифрование текста (для API ключей)
   */
  encrypt(text: string): string {
    if (!text) return '';

    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, this.encryptionKey, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    // Возвращаем: iv:authTag:encrypted
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  }

  /**
   * Расшифровка текста
   */
  decrypt(encryptedText: string): string {
    if (!encryptedText) return '';

    try {
      const parts = encryptedText.split(':');
      
      if (parts.length !== 3) {
        // Возможно, текст не зашифрован (старые данные)
        return encryptedText;
      }

      const [ivHex, authTagHex, encrypted] = parts;
      
      const iv = Buffer.from(ivHex, 'hex');
      const authTag = Buffer.from(authTagHex, 'hex');
      
      const decipher = crypto.createDecipheriv(this.algorithm, this.encryptionKey, iv);
      decipher.setAuthTag(authTag);
      
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      console.error('❌ Ошибка расшифровки:', error.message);
      // Возвращаем как есть (возможно не зашифровано)
      return encryptedText;
    }
  }

  /**
   * Проверка: зашифрован ли текст
   */
  isEncrypted(text: string): boolean {
    if (!text) return false;
    const parts = text.split(':');
    return parts.length === 3 && parts[0].length === 32; // IV длина 16 байт = 32 hex символа
  }
}

