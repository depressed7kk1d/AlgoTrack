import { Module, Global } from '@nestjs/common';
import { CryptoService } from './crypto.service';

@Global()  // Делаем глобальным для использования везде
@Module({
  providers: [CryptoService],
  exports: [CryptoService],
})
export class CryptoModule {}

