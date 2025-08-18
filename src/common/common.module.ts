import { Module, Global } from '@nestjs/common';
import { PaginationService } from './services/pagination.service';
import { FileUploadService } from './services/file-upload.service';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';

@Global()
@Module({
  imports: [
    ConfigModule, // Importa ConfigModule para que ConfigService esté disponible
    HttpModule, // Importa HttpModule para que HttpService esté disponible
  ],
  providers: [PaginationService, FileUploadService],
  exports: [PaginationService, FileUploadService],
})
export class CommonModule {}
