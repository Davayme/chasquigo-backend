import { Injectable, BadRequestException } from '@nestjs/common';
import { RekognitionClient, DetectTextCommand, DetectLabelsCommand } from '@aws-sdk/client-rekognition';
import { TextractClient, AnalyzeDocumentCommand } from '@aws-sdk/client-textract';

export interface DocumentValidationResult {
  isValidIdCard: boolean;
  confidence: number;
  detectedLabels: string[];
  extractedText?: string[];
}

export interface AgeValidationResult {
  isMinor: boolean;
  isSenior: boolean;
  isDisabilityCard: boolean;
  birthDate?: string;
  age?: number;
  extractedFullText?: string; // Para debugging
}

@Injectable()
export class AwsService {
  private rekognitionClient: RekognitionClient;
  private textractClient: TextractClient;

  constructor() {
    const region = process.env.AWS_REGION || 'us-east-1';
    
    this.rekognitionClient = new RekognitionClient({
      region,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });

    this.textractClient = new TextractClient({
      region,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });
  }

  /**
   * Valida si una imagen es una cédula de identidad válida
   */
  async validateIdCard(imageBuffer: Buffer): Promise<DocumentValidationResult> {
    try {
      // Detectar etiquetas para identificar si es un documento de identidad
      const detectLabelsCommand = new DetectLabelsCommand({
        Image: {
          Bytes: imageBuffer,
        },
        MaxLabels: 10,
        MinConfidence: 70,
      });

      const labelsResponse = await this.rekognitionClient.send(detectLabelsCommand);
      
      // Detectar texto en la imagen
      const detectTextCommand = new DetectTextCommand({
        Image: {
          Bytes: imageBuffer,
        },
      });

      const textResponse = await this.rekognitionClient.send(detectTextCommand);

      // Analizar las etiquetas para determinar si es una cédula
      const labels = labelsResponse.Labels || [];
      const detectedLabels = labels.map(label => label.Name).filter(Boolean);
      
      // Palabras clave que indican que es un documento de identidad
      const idCardKeywords = [
        'Document', 'ID Card', 'License', 'Card', 'Text', 'Paper',
        'Identity', 'Identification', 'Certificate', 'Official'
      ];

      const isValidIdCard = labels.some(label => 
        idCardKeywords.some(keyword => 
          label.Name?.toLowerCase().includes(keyword.toLowerCase())
        ) && (label.Confidence || 0) > 75
      );

      // Extraer texto detectado
      const extractedText = textResponse.TextDetections
        ?.filter(detection => detection.Type === 'LINE')
        .map(detection => detection.DetectedText)
        .filter(Boolean) || [];

      // Calcular confianza promedio
      const avgConfidence = labels.length > 0 
        ? labels.reduce((sum, label) => sum + (label.Confidence || 0), 0) / labels.length 
        : 0;

      return {
        isValidIdCard,
        confidence: avgConfidence,
        detectedLabels,
        extractedText,
      };

    } catch (error) {
      console.error('Error validating ID card:', error);
      throw new BadRequestException('Error al procesar la imagen del documento');
    }
  }

  /**
   * Extrae texto de un documento usando Textract y valida edad - MEJORADO para cédulas ecuatorianas
   */
  async validateAge(imageBuffer: Buffer): Promise<AgeValidationResult> {
    try {
      // Usar también Rekognition para extraer texto (más preciso para cédulas)
      const detectTextCommand = new DetectTextCommand({
        Image: {
          Bytes: imageBuffer,
        },
      });

      const textResponse = await this.rekognitionClient.send(detectTextCommand);
      
      // Extraer todo el texto del documento usando Rekognition
      const extractedTextArray = textResponse.TextDetections
        ?.filter(detection => detection.Type === 'LINE')
        .map(detection => detection.DetectedText)
        .filter(Boolean) || [];

      const extractedText = extractedTextArray.join(' ');

      console.log('Texto extraído completo:', extractedText);
      console.log('Array de texto:', extractedTextArray);

      // Buscar fecha de nacimiento específicamente para cédulas ecuatorianas
      const birthDate = this.extractEcuadorianBirthDate(extractedTextArray);
      let age: number | undefined;
      let isMinor = false;
      let isSenior = false;

      if (birthDate) {
        age = this.calculateAge(birthDate);
        isMinor = age < 18;
        isSenior = age >= 65;
        console.log(`Fecha encontrada: ${birthDate}, Edad calculada: ${age}`);
      } else {
        console.log('No se pudo extraer la fecha de nacimiento');
      }

      // Detectar si es carnet de discapacidad
      const disabilityKeywords = [
        'discapacidad', 'disability', 'conadis', 'carnet',
        'persona con discapacidad', 'discapacitado', 'ministerial',
        'carné de la persona con discapacidad'
      ];
      
      const isDisabilityCard = disabilityKeywords.some(keyword =>
        extractedText.toLowerCase().includes(keyword.toLowerCase())
      );

      return {
        isMinor,
        isSenior,
        isDisabilityCard,
        birthDate,
        age,
        extractedFullText: extractedText, // Para debugging
      };

    } catch (error) {
      console.error('Error validating age:', error);
      throw new BadRequestException('Error al extraer información del documento');
    }
  }

  /**
   * Extrae la fecha de nacimiento específicamente de cédulas ecuatorianas
   */
  private extractEcuadorianBirthDate(textArray: string[]): string | null {
    console.log('Buscando fecha de nacimiento en:', textArray);

    // Buscar el índice donde aparece "FECHA DE NACIMIENTO"
    const birthDateIndex = textArray.findIndex(text => 
      text.toLowerCase().includes('fecha de nacimiento') || 
      text.toLowerCase().includes('nacimiento')
    );

    if (birthDateIndex !== -1) {
      // Buscar en las siguientes líneas después de "FECHA DE NACIMIENTO"
      for (let i = birthDateIndex + 1; i < Math.min(birthDateIndex + 4, textArray.length); i++) {
        const dateMatch = this.extractDateFromText(textArray[i]);
        if (dateMatch) {
          console.log(`Fecha encontrada en línea ${i}: ${textArray[i]} -> ${dateMatch}`);
          return dateMatch;
        }
      }
    }

    // Si no encuentra con el método anterior, buscar patrones de fecha en todo el texto
    for (const text of textArray) {
      const dateMatch = this.extractDateFromText(text);
      if (dateMatch) {
        console.log(`Fecha encontrada directamente: ${text} -> ${dateMatch}`);
        return dateMatch;
      }
    }

    return null;
  }

  /**
   * Extrae fecha de un texto específico con patrones ecuatorianos
   */
  private extractDateFromText(text: string): string | null {
    // Patrones para fechas ecuatorianas en cédulas
    const patterns = [
      // Formato: "13 MAY 2003", "15 ENE 1990", etc.
      /(\d{1,2})\s+(ENE|FEB|MAR|ABR|MAY|JUN|JUL|AGO|SEP|OCT|NOV|DIC)\s+(\d{4})/i,
      // Formato: "13 MAYO 2003", "15 ENERO 1990", etc.
      /(\d{1,2})\s+(ENERO|FEBRERO|MARZO|ABRIL|MAYO|JUNIO|JULIO|AGOSTO|SEPTIEMBRE|OCTUBRE|NOVIEMBRE|DICIEMBRE)\s+(\d{4})/i,
      // Formato: DD/MM/YYYY
      /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/,
      // Formato: DD-MM-YYYY
      /(\d{1,2})-(\d{1,2})-(\d{4})/,
      // Formato: YYYY/MM/DD
      /(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        console.log(`Patrón encontrado en "${text}":`, match);
        return match[0];
      }
    }

    return null;
  }

  /**
   * Calcula la edad basada en la fecha de nacimiento - MEJORADO para formatos ecuatorianos
   */
  private calculateAge(birthDateString: string): number {
    try {
      console.log(`Calculando edad para: ${birthDateString}`);
      let birthDate: Date;

      // Mapeo de meses en español
      const monthMap: { [key: string]: number } = {
        'ENE': 0, 'ENERO': 0,
        'FEB': 1, 'FEBRERO': 1,
        'MAR': 2, 'MARZO': 2,
        'ABR': 3, 'ABRIL': 3,
        'MAY': 4, 'MAYO': 4,
        'JUN': 5, 'JUNIO': 5,
        'JUL': 6, 'JULIO': 6,
        'AGO': 7, 'AGOSTO': 7,
        'SEP': 8, 'SEPTIEMBRE': 8,
        'OCT': 9, 'OCTUBRE': 9,
        'NOV': 10, 'NOVIEMBRE': 10,
        'DIC': 11, 'DICIEMBRE': 11
      };

      // Formato: "13 MAY 2003" o "13 MAYO 2003"
      const spanishDateMatch = birthDateString.match(/(\d{1,2})\s+([A-Z]+)\s+(\d{4})/i);
      if (spanishDateMatch) {
        const day = parseInt(spanishDateMatch[1]);
        const monthStr = spanishDateMatch[2].toUpperCase();
        const year = parseInt(spanishDateMatch[3]);
        
        const monthNum = monthMap[monthStr];
        if (monthNum !== undefined) {
          birthDate = new Date(year, monthNum, day);
          console.log(`Fecha parseada (formato español): ${birthDate}`);
        } else {
          throw new Error(`Mes no reconocido: ${monthStr}`);
        }
      }
      // Formato: DD/MM/YYYY o DD-MM-YYYY
      else if (birthDateString.includes('/') || birthDateString.includes('-')) {
        const separator = birthDateString.includes('/') ? '/' : '-';
        const parts = birthDateString.split(separator);
        
        if (parts.length === 3) {
          // Detectar si es DD/MM/YYYY o YYYY/MM/DD
          if (parseInt(parts[0]) > 31) {
            // Formato YYYY/MM/DD
            birthDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
          } else {
            // Formato DD/MM/YYYY
            birthDate = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
          }
          console.log(`Fecha parseada (formato numérico): ${birthDate}`);
        } else {
          throw new Error('Formato de fecha inválido');
        }
      } else {
        birthDate = new Date(birthDateString);
      }

      // Validar que la fecha sea válida
      if (isNaN(birthDate.getTime())) {
        throw new Error('Fecha inválida después del parsing');
      }

      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();

      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }

      console.log(`Edad calculada: ${age} años`);
      return age;
    } catch (error) {
      console.error('Error calculating age:', error);
      throw new BadRequestException(`Error al calcular la edad: ${error.message}`);
    }
  }

  /**
   * Método combinado para validar documento completo
   */
  async validateDocument(imageBuffer: Buffer): Promise<{
    documentValidation: DocumentValidationResult;
    ageValidation: AgeValidationResult;
  }> {
    const [documentValidation, ageValidation] = await Promise.all([
      this.validateIdCard(imageBuffer),
      this.validateAge(imageBuffer),
    ]);

    return {
      documentValidation,
      ageValidation,
    };
  }
}