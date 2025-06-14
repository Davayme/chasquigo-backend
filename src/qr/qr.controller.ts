import { Controller, Get, Param, ParseIntPipe, Res, Query, UseGuards } from '@nestjs/common';
import { QrService } from './qr.service';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { QrCodeResponseDto, TicketValidationResponseDto } from './dtos/res/qr-response.dto';
import { QrDemoService } from './qr.demo.service';

@ApiTags('qr')
@Controller('qr')
export class QrController {
  constructor(private readonly qrService: QrService,
              private readonly qrDemoService: QrDemoService
  ) {}

  @Get('ticket/:id')
  /* @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT') */
  @ApiOperation({ summary: 'Obtener código QR de un boleto' })
  @ApiParam({ name: 'id', description: 'ID del boleto', type: 'number' })
  @ApiQuery({ 
    name: 'format', 
    required: false, 
    enum: ['base64', 'png'],
    description: 'Formato del QR (base64 o png)'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Código QR generado correctamente',
    type: QrCodeResponseDto
  })
  @ApiResponse({ status: 404, description: 'Boleto no encontrado' })
  async getTicketQR(
    @Param('id', ParseIntPipe) id: number,
    @Query('format') format: 'base64' | 'png' = 'base64',
    @Res() res: Response
  ) {
    const qrData = await this.qrService.getTicketQR(id, format);
    
    if (format === 'png') {
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Content-Disposition', `attachment; filename="ticket-${id}-qr.png"`);
      return res.send(qrData);
    } else {
      return res.json({ qrCode: qrData });
    }
  }

  @Get('validate/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('oficinista', 'chofer', 'admin_coop')
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Validar un boleto escaneando su QR' })
  @ApiParam({ name: 'id', description: 'ID del boleto', type: 'number' })
  @ApiQuery({ 
    name: 'hash', 
    required: true,
    description: 'Hash de validación del QR' 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Boleto validado correctamente',
    type: TicketValidationResponseDto
  })
  @ApiResponse({ status: 404, description: 'Boleto no encontrado' })
  async validateTicket(
    @Param('id', ParseIntPipe) id: number,
    @Query('hash') hash: string,
    @Res() res: Response
  ) {
    const validationResult = await this.qrService.validateTicket(id, hash);
    return res.json(validationResult);
  }


  @Get('demo/:id')
  @ApiOperation({ summary: 'Obtener código QR de prueba (no requiere datos en BD)' })
  @ApiParam({ name: 'id', description: 'ID de demo (1-3)', type: 'number' })
  @ApiQuery({ 
    name: 'format', 
    required: false, 
    enum: ['base64', 'png'],
    description: 'Formato del QR (base64 o png)'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Código QR de prueba generado correctamente',
    type: QrCodeResponseDto
  })
  async getDemoTicketQR(
    @Param('id', ParseIntPipe) id: number,
    @Query('format') format: 'base64' | 'png' = 'base64',
    @Res() res: Response
  ) {
    const qrData = await this.qrDemoService.getDemoTicketQR(id, format);
    
    if (format === 'png') {
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Content-Disposition', `attachment; filename="demo-ticket-${id}-qr.png"`);
      return res.send(qrData);
    } else {
      return res.json({ qrCode: qrData });
    }
  }
}