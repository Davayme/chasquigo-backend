import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateRouteSheetDto } from './dto/req/create-route-sheet.dto';
import { UpdateRouteSheetDto } from './dto/req/update-route-sheet.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { PrismaErrorHandler } from 'src/common/filters/prisma-errors';

@Injectable()
export class RouteSheetsService {
  constructor(private readonly prisma: PrismaService) {}

/*   async create(createRouteSheetDto: CreateRouteSheetDto) {
    const { frequencyIds, busIds, startDate, endDate, ...routeSheetData } = createRouteSheetDto;
    
    // Validar que hay al menos una frecuencia y un bus
    if (frequencyIds.length === 0 || busIds.length === 0) {
      throw new BadRequestException('Se requiere al menos una frecuencia y un bus');
    }
    
    // Obtener las frecuencias con sus ciudades relacionadas
    const frequencies = await this.prisma.frequency.findMany({
      where: {
        cooperativeId: routeSheetData.cooperativeId,
        isDeleted: false,
        id: { in: frequencyIds },
      },
      include: {
        originCity: true,
        destinationCity: true,
      },
    });
    
    if (frequencies.length !== frequencyIds.length) {
      throw new BadRequestException('Una o más frecuencias no fueron encontradas');
    }
    
    // Obtener los buses con su información de asientos
    const buses = await this.prisma.bus.findMany({
      where: {
        cooperativeId: routeSheetData.cooperativeId,
        isDeleted: false,
        id: { in: busIds },
      },
      include: {
        seats: true,
      },
    });

    if (buses.length === 0) {
      throw new BadRequestException('No se encontraron buses válidos');
    }
    
    // Ordenar las frecuencias de manera cíclica
    const orderedFrequencies = this.orderFrequenciesCyclically(frequencies);
    
    // Calcular días entre fechas
    const start = new Date(startDate);
    const end = new Date(endDate);
    const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    
    // Crear los detalles de la hoja de ruta
    const routeSheetDetails = [];
    
    // Inicializar el estado de los buses
    const busStatus = buses.map((bus, index) => ({
      ...bus,
      workDays: 0,
      currentFreqIndex: index,
      isResting: false,
      consecutiveRestDays: 0,
      totalWorkDays: 0,
      lastAssignedFreq: null,
      nextFreqIndex: index,
      daysSkipped: 0
    }));
    
    // Generar los detalles de la hoja de ruta
    for (let day = 0; day < daysDiff; day++) {
      const currentDate = new Date(start);
      currentDate.setDate(start.getDate() + day);
      
      // Primera pasada: determinar qué buses necesitan descansar hoy
      for (const bus of busStatus) {
        if (bus.isResting) {
          bus.consecutiveRestDays++;
          if (bus.consecutiveRestDays > bus.stoppageDays) {
            bus.isResting = false;
            bus.consecutiveRestDays = 0;
            bus.workDays = 0;
          }
          continue;
        }
        
        if (bus.workDays >= 3 && bus.stoppageDays > 0) {
          bus.isResting = true;
          bus.consecutiveRestDays = 1;
          bus.nextFreqIndex = (bus.currentFreqIndex + 1) % orderedFrequencies.length;
          bus.daysSkipped = bus.stoppageDays;
          continue;
        }
      }
      
      // Segunda pasada: asignar frecuencias
      for (const bus of busStatus) {
        if (bus.isResting) continue;
        
        if (bus.consecutiveRestDays === 0 && bus.workDays === 0 && bus.daysSkipped > 0) {
          bus.currentFreqIndex = (bus.currentFreqIndex + bus.daysSkipped) % orderedFrequencies.length;
          bus.daysSkipped = 0;
        }
        
        const frequency = orderedFrequencies[bus.currentFreqIndex];
        const totalNormalSeats = bus.seats.filter(s => s.type === 'NORMAL').length;
        const totalVIPSeats = bus.seats.filter(s => s.type === 'VIP').length;
        
        routeSheetDetails.push({
          routeSheetHeaderId: 0, // Se actualizará con el ID real en la transacción
          frequencyId: frequency.id,
          busId: bus.id,
          availableNormalSeats: totalNormalSeats,
          availableVIPSeats: totalVIPSeats,
          totalNormalSeats,
          totalVIPSeats,
          normalSeatsTickets: 0,
          vipSeatsTickets: 0,
          date: new Date(currentDate),
          status: 'Pendiente',
          isDeleted: false,
        });
        
        bus.workDays++;
        bus.totalWorkDays++;
        bus.currentFreqIndex = (bus.currentFreqIndex + 1) % orderedFrequencies.length;
      }
    }
    
    // Ejecutar transacción
    return this.prisma.$transaction(async (tx) => {
      // 1. Crear la hoja de ruta
      const routeSheet = await tx.routeSheetHeader.create({
        data: {
          ...routeSheetData,
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          status: routeSheetData.status || 'Pendiente',
        },
      });
      
      // 2. Asignar el ID real a los detalles
      const detailsWithHeaderId = routeSheetDetails.map(detail => ({
        ...detail,
        routeSheetHeaderId: routeSheet.id,
      }));
      
      // 3. Crear todos los detalles
      await tx.routeSheetDetail.createMany({
        data: detailsWithHeaderId,
      });
      
      // 4. Retornar la hoja de ruta con sus detalles
      return {
        ...routeSheet,
        details: detailsWithHeaderId,
      };
    });
  }

  async findAll(cooperativeId: number) {
    return this.prisma.routeSheetHeader.findMany({
      where: {
        cooperativeId,
        isDeleted: false,
      },
      include: {
        routeSheetDetails: true,
      },
    }).catch((error) => {
      PrismaErrorHandler.handleError(error, 'Buscar Hojas de Ruta por Cooperativa');
    });
  }

  async findActive(cooperativeId: number) {
    return this.prisma.routeSheetHeader.findFirst({
      where: {
        cooperativeId,
        isDeleted: false,
        status: 'Activo',
      },
      include: {
        routeSheetDetails: true,
      },
    }).catch((error) => {
      PrismaErrorHandler.handleError(error, 'Buscar Hoja de Ruta Activa por Cooperativa');
    });
  }

  async findOne(id: number) {
    return this.prisma.routeSheetHeader.findUnique({
      where: {
        id,
        isDeleted: false,
      },
      include: {
        routeSheetDetails: true,
      },
    }).catch((error) => {
      PrismaErrorHandler.handleError(error, 'Buscar Hoja de Ruta por ID');
    });
  }

  async remove(id: number) {
    const routeSheet = await this.findOne(id);
    
    if (!routeSheet) {
      throw new NotFoundException(`Hoja de Ruta con ID ${id} no encontrada`);
    }
    
    const routeSheetDetails = await this.prisma.routeSheetDetail.findMany({
      where: {
        routeSheetHeaderId: id,
      },
    });
    
    for (const detail of routeSheetDetails) {
      await this.prisma.routeSheetDetail.update({ where: { id: detail.id }, data: { isDeleted: true, status: 'Cancelado' } }).catch((error) => {
        PrismaErrorHandler.handleError(error, 'Eliminar Detalle de Hoja de Ruta');
      });
    }
    
    return this.prisma.routeSheetHeader.update({ where: { id }, data: { isDeleted: true, status: 'Cancelado' } }).catch((error) => {
      PrismaErrorHandler.handleError(error, 'Eliminar Hoja de Ruta');
    });
  }

  async findDetailsByRouteSheetHeaderId(routeSheetHeaderId: number) {
    return this.prisma.routeSheetDetail.findMany({
      where: {
        routeSheetHeaderId,
        isDeleted: false,
      },
    }).catch((error) => {
      PrismaErrorHandler.handleError(error, 'Buscar Detalles de Hoja de Ruta por ID de Hoja de Ruta');
    });
  }

  async updateStatus(id: number, status: string) {
    const routeSheet = await this.findOne(id);
    
    if (!routeSheet) {
      throw new NotFoundException(`Hoja de Ruta con ID ${id} no encontrada`);
    }
    
    this.prisma.routeSheetDetail.updateMany({ where: { routeSheetHeaderId: id }, data: { status } }).catch((error) => {
      PrismaErrorHandler.handleError(error, 'Actualizar Estado de Detalles de Hoja de Ruta');
    });
    
    return this.prisma.routeSheetHeader.update({ where: { id }, data: { status } }).catch((error) => {
      PrismaErrorHandler.handleError(error, 'Actualizar Estado de Hoja de Ruta');
    });
  }

  private orderFrequenciesCyclically(frequencies: any[]) {
    if (frequencies.length === 0) return [];
    
    // Función auxiliar para encontrar todas las frecuencias que parten de una ciudad específica
    const findNextFrequencies = (currentCityId: number, availableFreqs: any[]) => {
      return availableFreqs.filter(f => f.originCity.id === currentCityId);
    };

    // Función recursiva para construir el ciclo
    const buildCycle = (currentPath: any[], remaining: any[]): any[] | null => {
      // Si no quedan frecuencias por colocar, verificamos si el ciclo está completo
      if (remaining.length === 0) {
        const first = currentPath[0];
        const last = currentPath[currentPath.length - 1];
        
        // Verificamos si la última frecuencia conecta con la primera
        if (last.destinationCity.id === first.originCity.id) {
          return [...currentPath];
        }
        return null;
      }

      const lastFreq = currentPath[currentPath.length - 1];
      const nextFrequencies = findNextFrequencies(lastFreq.destinationCity.id, remaining);

      // Si no hay frecuencias que conecten, el camino actual no es válido
      if (nextFrequencies.length === 0) {
        return null;
      }

      // Probamos cada una de las frecuencias posibles
      for (const nextFreq of nextFrequencies) {
        const newRemaining = remaining.filter(f => f.id !== nextFreq.id);
        const result = buildCycle([...currentPath, nextFreq], newRemaining);
        
        // Si encontramos un ciclo válido, lo retornamos
        if (result) {
          return result;
        }
      }

      return null;
    };

    // Intentamos comenzar con cada frecuencia como punto de partida
    for (let i = 0; i < frequencies.length; i++) {
      const startingFreq = frequencies[i];
      const remainingFrequencies = frequencies.filter((_, idx) => idx !== i);
      
      const cycle = buildCycle([startingFreq], remainingFrequencies);
      if (cycle) {
        return cycle;
      }
    }

    // Si llegamos aquí, no se pudo formar un ciclo con las frecuencias dadas
    throw new BadRequestException(
      'No se pudo formar un ciclo cerrado con las frecuencias proporcionadas. ' +
      'Asegúrese de que todas las frecuencias estén conectadas en un solo ciclo.'
    );
  } */
  
}
