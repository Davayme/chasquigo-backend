import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
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
    const routeSheetDetails = busIds.map(async (busId, index) => {
      // Usar el operador módulo para volver al inicio del array de frecuencias
      const frequencyIndex = index % orderedFrequencies.length;
      const frequency = orderedFrequencies[frequencyIndex];
      
      const existOne = await this.prisma.routeSheetDetail.findFirst({
        where: {
          routeSheetHeaderId: header.id,
          frequencyId: frequency.id,
        },
      });

      let status : Status = Status.ACTIVE;

      if (existOne) {
        status = Status.INACTIVE;
      }

      return {
        routeSheetHeaderId: header.id,
        busId,
        frequencyId: frequency.id,
        status,
      };
    });
    
    // Crear los detalles de la hoja de ruta en la base de datos
    await this.prisma.routeSheetDetail.createMany({
      data: await Promise.all(routeSheetDetails),
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
      where: { id: getFrequenciesDto.routeSheetHeaderId, status: Status.ACTIVE},
      include: {
        routeSheetDetails: {
          where: { status: Status.ACTIVE },
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
    
    const endDate = new Date(getFrequenciesDto.targetDate);
    
    const diffTime = endDate.getTime() - startDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    // Ordenar los buses por ID para consistencia
    const sortedBuses = [...allBuses].sort((a, b) => a.id - b.id);
    
    // Determinar cuántos ciclos completos de frecuencias han pasado
    const fullCycles = Math.floor(diffDays / totalFrequencies);
    
    // Determinar cuántos grupos de buses necesitamos (cada grupo contiene tantos buses como frecuencias)
    const busesPerCycle = Math.min(totalBuses, totalFrequencies);
    const totalCycles = Math.ceil(totalBuses / busesPerCycle);
    
    // Determinar en qué ciclo estamos actualmente
    const currentCycle = Math.floor(diffDays / busesPerCycle);
    
    // Determinar qué buses están activos en este ciclo
    const activeBuses: any[] = [];
    const waitingBuses: any[] = [];
    
    // Calcular el índice de inicio para los buses activos
    const startIndex = (currentCycle * busesPerCycle) % totalBuses;
    
    // Seleccionar los buses activos para este ciclo
    for (let i = 0; i < totalBuses; i++) {
      const busIndex = (startIndex + i) % totalBuses;
      if (i < busesPerCycle) {
        activeBuses.push(sortedBuses[busIndex]);
      } else {
        waitingBuses.push(sortedBuses[busIndex]);
      }
    }
    
    // Para los buses activos, determinar su frecuencia actual
    const busAssignments = new Map<number, number>();
    
    // Calcular el desplazamiento de frecuencia basado en los días transcurridos
    const frequencyOffset = diffDays % totalFrequencies;
    
    // Asignar frecuencias a los buses activos
    activeBuses.forEach((bus, index) => {
      const freqIndex = (index + frequencyOffset) % totalFrequencies;
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
        currentCycle,
        frequencyOffset,
        busesPerCycle,
        startIndex
      }
    };
  }


  // async getRouteSheetSchedule(
  //   dto: GetRouteSheetScheduleDto
  // ) {
  //   if (dto.startDate > dto.endDate) {
  //     throw new BadRequestException('La fecha de inicio no puede ser posterior a la fecha de fin');
  //   }
  
  //   // Obtener las frecuencias únicas de la hoja de ruta
  //   const routeSheet = await this.prisma.routeSheetHeader.findUnique({
  //     where: { id: dto.routeSheetHeaderId },
  //     include: {
  //       routeSheetDetails: {
  //         include: {
  //           bus: true,
  //           frequency: {
  //             include: {
  //               originCity: true,
  //               destinationCity: true,
  //             },
  //           },
  //         },
  //       },
  //     },
  //   });
  
  //   if (!routeSheet) {
  //     throw new NotFoundException(`Hoja de ruta con ID ${dto.routeSheetHeaderId} no encontrada`);
  //   }
  
  //   // Obtener todas las frecuencias únicas
  //   const allFrequencies = [
  //     ...new Map(routeSheet.routeSheetDetails.map(d => [d.frequency.id, d.frequency])).values()
  //   ].sort((a, b) => a.id - b.id);
  
  //   if (allFrequencies.length === 0) {
  //     throw new Error('No hay frecuencias asignadas a esta hoja de ruta');
  //   }
  
  //   // Obtener todos los buses únicos
  //   const allBuses = [
  //     ...new Map(routeSheet.routeSheetDetails.map(d => [d.bus.id, d.bus])).values()
  //   ].sort((a, b) => a.id - b.id);
  
  //   const totalBuses = allBuses.length;
  //   const totalFrequencies = allFrequencies.length;
  //   const busesPerCycle = Math.min(totalBuses, totalFrequencies);
  
  //   // Calcular la fecha de inicio de la hoja de ruta
  //   const routeStartDate = new Date(routeSheet.startDate);
  //   routeStartDate.setHours(0, 0, 0, 0);
  
  //   // Ajustar las fechas de inicio y fin
  //   const start = new Date(dto.startDate);
  //   const end = new Date(dto.endDate);
  //   end.setHours(23, 59, 59, 999);
  
  //   // Calcular diferencia en días desde el inicio de la hoja de ruta
  //   const diffTimeStart = start.getTime() - routeStartDate.getTime();
  //   const startDayOffset = Math.max(0, Math.floor(diffTimeStart / (1000 * 60 * 60 * 24)));
  
  //   // Generar el horario para cada día
  //   const schedule = [];
  //   const currentDate = new Date(start);
    
  //   while (currentDate <= end) {
  //     const dayOfWeek = currentDate.toLocaleDateString('es-ES', { weekday: 'long' });
  //     const daySchedule = {
  //       date: new Date(currentDate),
  //       dayOfWeek: dayOfWeek,
  //       assignments: []
  //     };
  
  //     // Calcular días desde el inicio de la hoja de ruta
  //     const diffTime = currentDate.getTime() - routeStartDate.getTime();
  //     const daysFromStart = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
  //     if (daysFromStart < 0) {
  //       // Si la fecha es anterior al inicio de la hoja de ruta, saltar al siguiente día
  //       currentDate.setDate(currentDate.getDate() + 1);
  //       continue;
  //     }
  
  //     // Calcular el ciclo actual y el desplazamiento
  //     const currentCycle = Math.floor(daysFromStart / busesPerCycle);
  //     const frequencyOffset = daysFromStart % totalFrequencies;
  //     const startIndex = (currentCycle * busesPerCycle) % totalBuses;
  
  //     // Determinar buses activos
  //     const activeBuses = [];
  //     for (let i = 0; i < busesPerCycle; i++) {
  //       const busIndex = (startIndex + i) % totalBuses;
  //       activeBuses.push({
  //         bus: allBuses[busIndex],
  //         frequencyIndex: (i + frequencyOffset) % totalFrequencies
  //       });
  //     }
  
  //     // Crear asignaciones para cada frecuencia
  //     for (const frequency of allFrequencies) {
  //       const assignment = activeBuses.find(ab => 
  //         allFrequencies[ab.frequencyIndex]?.id === frequency.id
  //       );
  
  //       if (assignment) {
  //         daySchedule.assignments.push({
  //           frequencyId: frequency.id,
  //           frequencyName: `De ${frequency.originCity?.name || 'Origen'} a ${frequency.destinationCity?.name || 'Destino'}`,
  //           busId: assignment.bus.id,
  //           busName: `Bus ${assignment.bus.id}`,
  //           departureTime: frequency.departureTime
  //         });
  //       }
  //     }
  
  //     schedule.push(daySchedule);
  //     currentDate.setDate(currentDate.getDate() + 1);
  //   }
  
  //   return {
  //     routeSheetId: dto.routeSheetHeaderId,
  //     startDate: start,
  //     endDate: end,
  //     schedule
  //   };
  // }

  async getRouteSheetSchedule(dto: GetRouteSheetScheduleDto) {
    if (dto.startDate > dto.endDate) {
      throw new BadRequestException('La fecha de inicio no puede ser posterior a la fecha de fin');
    }
  
    // Obtener las frecuencias únicas de la hoja de ruta
    const routeSheet = await this.prisma.routeSheetHeader.findUnique({
      where: { id: dto.routeSheetHeaderId },
      include: {
        routeSheetDetails: {
          where: { status: Status.ACTIVE },
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
  
    // Ajustar las fechas
    const start = new Date(dto.startDate);
    
    const end = new Date(dto.endDate);
    end.setHours(23, 59, 59, 999);
  
    // Generar el horario para cada día
    const schedule = [];
    const currentDate = new Date(start);
    
    while (currentDate <= end) {
      const dayOfWeek = currentDate.toLocaleDateString('es-ES', { weekday: 'long' });
      const daySchedule = {
        date: new Date(currentDate),
        dayOfWeek: dayOfWeek,
        assignments: []
      };
  
      // Para cada frecuencia, obtener el bus asignado usando la función existente
      const assignments = await Promise.all(
        allFrequencies.map(async (frequency) => {
          try {
            const result = await this.getBusForFrequencyOnDate({
              routeSheetHeaderId: dto.routeSheetHeaderId,
              frequencyId: frequency.id,
              targetDate: currentDate.toISOString()
            });
            
            return {
              frequencyId: frequency.id,
              frequencyName: `De ${frequency.originCity?.name || 'Origen'} a ${frequency.destinationCity?.name || 'Destino'}`,
              busId: result.bus.id,
              busName: `Bus ${result.bus.id}`,
              departureTime: frequency.departureTime
            };
          } catch (error) {
            // Si hay un error (ej. no hay bus asignado), devolvemos null
            return null;
          }
        })
      );
  
      // Filtrar asignaciones nulas y agregar al horario del día
      daySchedule.assignments = assignments.filter(Boolean);
      schedule.push(daySchedule);
      
      // Pasar al siguiente día
      currentDate.setDate(currentDate.getDate() + 1);
    }
  
    return {
      routeSheetId: dto.routeSheetHeaderId,
      startDate: start,
      endDate: end,
      schedule
    };
  }
}
