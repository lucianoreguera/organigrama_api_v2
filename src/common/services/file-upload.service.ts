import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import FormData = require('form-data');

@Injectable()
export class FileUploadService {
  private readonly logger = new Logger(FileUploadService.name);

  constructor(
    private configService: ConfigService,
    private httpService: HttpService,
  ) {}

  async uploadFile(file: Express.Multer.File, cuil: string): Promise<string> {
    try {
      const baseUrl =
        this.configService.get<string>('S3_API_URL') ||
        'https://s3-api.cc.gob.ar';
      const folder =
        this.configService.get<string>('S3_FOLDER') || 'organigrama';
      const uploadUrl = `${baseUrl}/upload?folder=${folder}`;
      const apiKey =
        this.configService.get<string>('S3_API_KEY') ||
        'WfMIY0oHEFqjILZNAm5r3bvxQajLaayK';

      // Asegurarse de que el archivo tiene el nombre correcto basado en el CUIL
      const fileExtension = file.originalname.split('.').pop();
      const fileName = `${cuil}.${fileExtension}`;
      console.log(fileName);

      // Crear el FormData
      const formData = new FormData();
      formData.append('file', file.buffer, {
        filename: fileName,
        contentType: file.mimetype,
      });

      this.logger.log(`Enviando archivo ${fileName} a ${uploadUrl}`);

      const response = await firstValueFrom(
        this.httpService.post(uploadUrl, formData, {
          headers: {
            'x-api-key': apiKey,
            ...formData.getHeaders(),
          },
        }),
      );

      // Según la documentación, la respuesta debería contener la URL
      // Si no se especifica la estructura exacta, asumimos que está en la raíz
      // o en una propiedad llamada `url`
      if (response.data) {
        let fileUrl: string;

        if (typeof response.data === 'string') {
          fileUrl = response.data;
        } else if (response.data.url) {
          fileUrl = response.data.url;
        } else if (response.data.location) {
          fileUrl = response.data.location;
        } else if (response.data.file) {
          fileUrl = response.data.file;
        } else {
          this.logger.error(
            `Respuesta inesperada: ${JSON.stringify(response.data)}`,
          );
          throw new Error('Formato de respuesta no reconocido');
        }

        this.logger.log(`Archivo subido exitosamente a: ${fileUrl}`);
        return fileUrl;
      } else {
        throw new Error('La respuesta está vacía');
      }
    } catch (error) {
      // Manejar diferentes tipos de errores según la documentación
      if (error.response) {
        const status = error.response.status;
        const message = error.response.data?.message || 'Error desconocido';

        switch (status) {
          case 400:
            this.logger.error(`Error 400: ${message}`);
            throw new Error(`Error en la solicitud: ${message}`);
          case 401:
            this.logger.error('Error 401: API Key requerida');
            throw new Error('API Key requerida');
          case 403:
            this.logger.error('Error 403: API Key inválida o desactivada');
            throw new Error('API Key inválida o desactivada');
          case 500:
            this.logger.error(`Error 500: ${message}`);
            throw new Error(`Error del servidor: ${message}`);
          default:
            this.logger.error(`Error ${status}: ${message}`);
            throw new Error(`Error en la carga: ${message}`);
        }
      } else {
        this.logger.error(`Error al subir archivo: ${error.message}`);
        throw new Error(`Error al subir archivo: ${error.message}`);
      }
    }
  }
}
