import { Inject, Injectable } from '@nestjs/common';
import { UploadApiResponse } from 'cloudinary';
import { Readable } from 'stream';
import { join } from 'path';

@Injectable()
export class CloudinaryService {
  private readonly uploadPath: string;

  constructor(@Inject('CLOUDINARY') private readonly cloudinary: any) {
    this.uploadPath = join(process.cwd(), 'updates');
    this.ensureUploadDirExists();
  }

  private async ensureUploadDirExists() {
    try {
      const { promises: fs } = await import('fs');
      await fs.mkdir(this.uploadPath, { recursive: true });
      //console.log(`Directorio de uploads: ${this.uploadPath}`);
    } catch (error) {
      //console.error('Error al crear el directorio de uploads:', error);
      throw new Error('No se pudo crear el directorio de uploads');
    }
  }

  async uploadPdf(file: Express.Multer.File): Promise<{ url: string }> {
    if (!file.mimetype.includes('pdf')) {
      throw new Error('El archivo debe ser un PDF');
    }
    
    const { promises: fs } = await import('fs');
    const { join } = await import('path');
    
    // Asegurarse de que el directorio existe
    await this.ensureUploadDirExists();
    
    // Crear un nombre de archivo seguro
    const safeFilename = file.originalname.replace(/[^\w\d.-]/g, '_');
    const filename = `${Date.now()}-${safeFilename}`;
    const filePath = join(this.uploadPath, filename);
    
    try {
      //console.log(`Guardando archivo en: ${filePath}`);
      await fs.writeFile(filePath, file.buffer);
      
      // Verificar que el archivo se haya guardado
      const stats = await fs.stat(filePath);
      //console.log(`Archivo guardado correctamente. Tamaño: ${stats.size} bytes`);
      
      return { 
        url: `/updates/${filename}`
      };
    } catch (error) {
      //console.error('Error al guardar el archivo:', error);
      throw new Error('Error al guardar el archivo: ' + error.message);
    }
  }

  async uploadImage(file: Express.Multer.File): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      const uploadStream = this.cloudinary.uploader.upload_stream(
        {
          folder: 'imagenes', // puedes cambiar el folder si quieres
          transformation: [
            { width: 1024, height: 1024, crop: 'limit' }, // opcional: para limitar tamaño
          ],
        },
        (error, result) => {
          if (error) return reject(error)
          resolve(result)
        },
      )

      const readable = Readable.from(file.buffer)
      readable.pipe(uploadStream)
    })
  }
}
