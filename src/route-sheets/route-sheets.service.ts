import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateRouteSheetDto } from './dto/req/create-route-sheet.dto';
import { UpdateRouteSheetDto } from './dto/req/update-route-sheet.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { PrismaErrorHandler } from 'src/common/filters/prisma-errors';
import { Status } from '@prisma/client';
import { GetFrequenciesDto, GetRouteSheetScheduleDto } from './dto/req/get-frequencies.dto';

@Injectable()
export class RouteSheetsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateRouteSheetDto) {
    const { frequencyIds, busIds, ...routeSheetData } = dto;
    const header = await this.prisma.routeSheetHeader.create({
      data: {
        ...routeSheetData,
        status: Status.ACTIVE,
      },
    });

    if (frequencyIds.length === 0 || busIds.length === 0) {
      throw new BadRequestException('Se requiere al menos una frecuencia y un bus');
    }

    if (frequencyIds.length > busIds.length) {
      throw new BadRequestException('El número de frecuencias debe ser menor o igual al número de buses');
    }

    // Obtener las frecuencias con sus ciudades relacionadas
    const frequencies = await this.getFrequencies(frequencyIds, routeSheetData.cooperativeId);
    
    if (frequencies.length !== frequencyIds.length) {
      throw new BadRequestException('Una o más frecuencias no fueron encontradas');
    }
    
    // Obtener los buses con su información de asientos
    const buses = await this.getBuses(busIds, routeSheetData.cooperativeId);

    if (buses.length === 0) {
      throw new BadRequestException('No se encontraron buses válidos');
    }
    // Ordenar las frecuencias de manera cíclica
    const orderedFrequencies = this.orderFrequenciesCyclically(frequencies);
    
    // Asignar buses a frecuencias de manera cíclica
    const routeSheetDetails = busIds.map((busId, index) => {
      // Usar el operador módulo para volver al inicio del array de frecuencias
      const frequencyIndex = index % orderedFrequencies.length;
      const frequency = orderedFrequencies[frequencyIndex];
      
      return {
        routeSheetHeaderId: header.id,
        busId,
        frequencyId: frequency.id,
        status: Status.ACTIVE,
      };
    });
    
    // Crear los detalles de la hoja de ruta en la base de datos
    await this.prisma.routeSheetDetail.createMany({
      data: routeSheetDetails,
    });
    
    // Obtener el header con los detalles recién creados
    return this.prisma.routeSheetHeader.findUnique({
      where: { id: header.id },
      include: {
        routeSheetDetails: {
          include: {
            bus: true,
            frequency: {
              include: {
                originCity: true,
                destinationCity: true,
              },
            },
          },
        },
      },
    });
  }

  async updateStatus(id: number) {
    
    const routeSheetHeader = await this.prisma.routeSheetHeader.update({
      where: { id },
      data: {
        status: Status.INACTIVE,
      },
    });
    
    return routeSheetHeader;
  }

  async delete(id: number) {
    
    const routeSheetHeader = await this.prisma.routeSheetHeader.update({
      where: { id },
      data: {
        isDeleted: true,
      },
    });
    
    const routeSheetDetails = await this.prisma.routeSheetDetail.updateMany({
      where: { routeSheetHeaderId: id },
      data: {
        isDeleted: true,
      },
    });
    
    return routeSheetHeader;
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
  
  async getFrequencies(frequencyIds: number[], cooperativeId: number) {
    return this.prisma.frequency.findMany({
      where: {
        cooperativeId,
        isDeleted: false,
        id: { in: frequencyIds },
      },
      include: {
        originCity: true,
        destinationCity: true,
      },
    });
  }

  async getBuses(busIds: number[], cooperativeId: number) {
    return this.prisma.bus.findMany({
      where: {
        cooperativeId,
        isDeleted: false,
        id: { in: busIds },
      },
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
  } 

  // Obtener el bus asignado a una frecuencia en una fecha específica
  async getBusForFrequencyOnDate(getFrequenciesDto: GetFrequenciesDto) {
    // Obtener el encabezado con los detalles iniciales
    const routeSheet = await this.prisma.routeSheetHeader.findUnique({
      where: { id: getFrequenciesDto.routeSheetHeaderId },
      include: {
        routeSheetDetails: {
          include: {
            bus: true,
            frequency: true,
          },
        },
      },
    });

    if (!routeSheet) {
      throw new NotFoundException(`Hoja de ruta con ID ${getFrequenciesDto.routeSheetHeaderId} no encontrada`);
    }

    // Verificar si la fecha objetivo es anterior a la fecha de inicio
    if (new Date(getFrequenciesDto.targetDate) < new Date(routeSheet.startDate)) {
      throw new BadRequestException('La fecha objetivo no puede ser anterior a la fecha de inicio de la hoja de ruta');
    }

    // Obtener los detalles iniciales ordenados por ID para consistencia
    const initialDetails = [...routeSheet.routeSheetDetails].sort((a, b) => a.id - b.id);
    
    // Obtener todas las frecuencias únicas ordenadas por ID
    const allFrequencies = [...new Set(initialDetails.map(d => d.frequencyId))].sort();
    const totalFrequencies = allFrequencies.length;
    
    if (totalFrequencies === 0) {
      throw new Error('No hay frecuencias asignadas a esta hoja de ruta');
    }
    
    // Verificar si la frecuencia existe en la hoja de ruta
    if (!allFrequencies.includes(getFrequenciesDto.frequencyId)) {
      throw new NotFoundException(`La frecuencia con ID ${getFrequenciesDto.frequencyId} no está asignada a esta hoja de ruta`);
    }
    
    // Obtener todos los buses únicos
    const allBuses = [
      ...new Map(initialDetails.map(d => [d.bus.id, d.bus])).values()
    ];
    const totalBuses = allBuses.length;
    
    if (totalBuses === 0) {
      throw new Error('No hay buses asignados a esta hoja de ruta');
    }
    
    // Calcular la diferencia en días entre la fecha objetivo y la fecha de inicio
    const startDate = new Date(routeSheet.startDate);
    startDate.setHours(0, 0, 0, 0);
    
    const endDate = new Date(getFrequenciesDto.targetDate);
    endDate.setHours(0, 0, 0, 0);
    
    const diffTime = endDate.getTime() - startDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    // Ordenar los buses por ID para consistencia
    const sortedBuses = [...allBuses].sort((a, b) => a.id - b.id);
    
    // Determinar cuántos ciclos completos de frecuencias han pasado
    const fullCycles = Math.floor(diffDays / totalFrequencies);
    
    // Determinar la posición en el ciclo actual (0 a totalFrequencies-1)
    const positionInCycle = diffDays % totalFrequencies;
    
    // Determinar qué buses están activos en este ciclo
    const activeBuses = [];
    const waitingBuses = [];
    
    // Los primeros N buses (donde N = totalFrequencies) están activos en el ciclo 0
    // Luego rotan los buses adicionales en ciclos posteriores
    const busesPerCycle = Math.min(totalBuses, totalFrequencies);
    
    // Calcular el desplazamiento del ciclo actual
    const cycleOffset = fullCycles % Math.ceil(totalBuses / busesPerCycle);
    
    // Determinar qué buses están activos en este ciclo
    for (let i = 0; i < totalBuses; i++) {
      const cycleGroup = Math.floor(i / busesPerCycle);
      const isActive = cycleGroup === (cycleOffset % Math.ceil(totalBuses / busesPerCycle));
      
      if (isActive) {
        activeBuses.push(sortedBuses[i]);
      } else {
        waitingBuses.push(sortedBuses[i]);
      }
    }
    
    // Para los buses activos, determinar su frecuencia actual
    const busAssignments = new Map<number, number>();
    
    activeBuses.forEach((bus, index) => {
      const freqIndex = (index + fullCycles) % totalFrequencies;
      busAssignments.set(bus.id, allFrequencies[freqIndex]);
    });
    
    // Los buses en espera no tienen asignación de frecuencia
    waitingBuses.forEach(bus => busAssignments.set(bus.id, -1));
    
    // Filtrar los buses que están asignados a la frecuencia solicitada
    const assignedBuses = activeBuses.filter(bus => 
      busAssignments.get(bus.id) === getFrequenciesDto.frequencyId
    );
    
    if (assignedBuses.length === 0) {
      throw new Error(`No hay buses asignados a la frecuencia ${getFrequenciesDto.frequencyId} en la fecha especificada`);
    }
    
    // Si hay múltiples buses para la frecuencia, devolvemos el primero
    const assignedBus = assignedBuses[0];
    
    return {
      date: getFrequenciesDto.targetDate,
      frequencyId: getFrequenciesDto.frequencyId,
      bus: assignedBus,
      totalBuses: assignedBuses.length,
      daysFromStart: diffDays,
      // Información adicional para depuración
      _debug: {
        allFrequencies,
        busAssignments: Object.fromEntries(busAssignments),
        activeBuses: activeBuses.map(b => b.id),
        waitingBuses: waitingBuses.map(b => b.id),
        fullCycles,
        positionInCycle,
        cycleOffset,
        busesPerCycle
      }
    };
  }

  /**
   * Obtiene el horario de asignación de buses para un rango de fechas
   * @param routeSheetHeaderId ID de la hoja de ruta
   * @param startDate Fecha de inicio del rango
   * @param endDate Fecha de fin del rango
   * @returns Un objeto con las asignaciones por día
   */
  async getRouteSheetSchedule(
    dto: GetRouteSheetScheduleDto
  ) {
    // Validar fechas
    if (dto.startDate > dto.endDate) {
      throw new BadRequestException('La fecha de inicio no puede ser posterior a la fecha de fin');
    }

    // Obtener las frecuencias únicas de la hoja de ruta
    const routeSheet = await this.prisma.routeSheetHeader.findUnique({
      where: { id: dto.routeSheetHeaderId },
      include: {
        routeSheetDetails: {
          include: {
            frequency: {
              include: {
                originCity: true,
                destinationCity: true,
              },
            },
          },
        },
      },
    });

    if (!routeSheet) {
      throw new NotFoundException(`Hoja de ruta con ID ${dto.routeSheetHeaderId} no encontrada`);
    }

    // Obtener todas las frecuencias únicas
    const allFrequencies = [
      ...new Map(routeSheet.routeSheetDetails.map(d => [d.frequency.id, d.frequency])).values()
    ].sort((a, b) => a.id - b.id);

    if (allFrequencies.length === 0) {
      throw new Error('No hay frecuencias asignadas a esta hoja de ruta');
    }

    // Calcular el número de días en el rango
    const start = new Date(dto.startDate);
    start.setHours(0, 0, 0, 0);
    
    const end = new Date(dto.endDate);
    end.setHours(23, 59, 59, 999);
    
    const diffTime = end.getTime() - start.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    // Generar el horario para cada día
    const schedule = [];
    
    for (let i = 0; i < diffDays; i++) {
      const currentDate = new Date(start);
      currentDate.setDate(start.getDate() + i);
      
      const daySchedule = {
        date: new Date(currentDate),
        dayOfWeek: currentDate.toLocaleDateString('es-ES', { weekday: 'long' }),
        assignments: []
      };

      // Para cada frecuencia, determinar qué bus la cubre este día
      for (const frequency of allFrequencies) {
        try {
          const getFrequenciesDto = {
            routeSheetHeaderId: dto.routeSheetHeaderId,
            frequencyId: frequency.id,
            targetDate: currentDate.toISOString(),
          };
          const assignment = await this.getBusForFrequencyOnDate(getFrequenciesDto);

          daySchedule.assignments.push({
            frequencyId: frequency.id,
            frequencyName: `De ${frequency.originCity?.name || 'Origen'} a ${frequency.destinationCity?.name || 'Destino'}`,
            busId: assignment.bus.id,
            busName: `Bus ${assignment.bus.id}`,
            departureTime: frequency.departureTime
          });
        } catch (error) {
          // Si hay un error (por ejemplo, no hay bus asignado), lo omitimos
          console.warn(`Error al obtener asignación para frecuencia ${frequency.id} en ${currentDate}:`, error.message);
        }
      }

      schedule.push(daySchedule);
    }

    return {
      routeSheetId: dto.routeSheetHeaderId,
      schedule
    };
  }
}
