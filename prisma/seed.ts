import { Logger } from '@nestjs/common';
import { PrismaClient, Province, Role, DocumentType, SeatType, SeatLocation, Status, TicketStatus, PassengerType } from '@prisma/client';
import { hash } from 'bcrypt';

const prisma = new PrismaClient();

// Función para generar asientos de bus
function generateBusSeats(floor: number, rows: number, seatsPerRow: number, startNumber: number = 1) {
  const seats = [];
  const letters = ['A', 'B', 'C', 'D', 'E', 'F'];
  
  for (let row = 1; row <= rows; row++) {
    for (let seat = 0; seat < seatsPerRow; seat++) {
      const seatNumber = startNumber + (row - 1) * seatsPerRow + seat;
      const letter = letters[seat];
      
      seats.push({
        floor,
        number: `${row}${letter}`,
        type: [SeatType.VIP, SeatType.NORMAL][Math.floor(Math.random() * 2)],
        location: 
          seat === 0 ? SeatLocation.WINDOW :
          seat === seatsPerRow - 1 ? SeatLocation.WINDOW :
          seat === Math.floor(seatsPerRow / 2) ? SeatLocation.AISLE :
          SeatLocation.MIDDLE,
        status: Status.ACTIVE
      });
    }
  }
  
  return seats;
}

async function main() {
  // Limpiar datos existentes (ten cuidado en producción)
  Logger.log('🧹 Limpiando datos existentes...');
  await prisma.ticketPassenger.deleteMany({});
  await prisma.payment.deleteMany({});
  await prisma.purchaseTransaction.deleteMany({});
  await prisma.ticket.deleteMany({});
  await prisma.routeSheetDetail.deleteMany({});
  await prisma.routeSheetHeader.deleteMany({});
  await prisma.routePrice.deleteMany({});
  await prisma.intermediateStop.deleteMany({});
  await prisma.frequency.deleteMany({});
  await prisma.busSeat.deleteMany({});
  await prisma.busType.deleteMany({});
  await prisma.bus.deleteMany({});
  await prisma.busType.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.cooperative.deleteMany({});
  await prisma.city.deleteMany({});

  // Crear ciudades de Ecuador
  Logger.log('Creando ciudades...');
  const cities = await prisma.$transaction([
    prisma.city.create({ data: { name: 'Quito', province: Province.PICHINCHA } }),
    prisma.city.create({ data: { name: 'Guayaquil', province: Province.GUAYAS } }),
    prisma.city.create({ data: { name: 'Cuenca', province: Province.AZUAY } }),
    prisma.city.create({ data: { name: 'Santo Domingo', province: Province.SANTO_DOMINGO_DE_LOS_TSACHILAS } }),
    prisma.city.create({ data: { name: 'Manta', province: Province.MANABI } }),
    prisma.city.create({ data: { name: 'Ambato', province: Province.TUNGURAHUA } }),
    prisma.city.create({ data: { name: 'Riobamba', province: Province.CHIMBORAZO } }),
    prisma.city.create({ data: { name: 'Machala', province: Province.EL_ORO } }),
    prisma.city.create({ data: { name: 'Esmeraldas', province: Province.ESMERALDAS } }),
    prisma.city.create({ data: { name: 'Loja', province: Province.LOJA } })
  ]);

  // Crear tipos de buses
  Logger.log('Creando tipos de buses...');
  const busTypes = await prisma.$transaction([
    prisma.busType.create({
      data: {
        name: 'Convencional',
        description: 'Servicio estándar con capacidad para 46 pasajeros',
        floorCount: 1,
        seatsFloor1: 47,
        seatsFloor2: 0,
        aditionalPrice: 1.00
      }
    }),
    prisma.busType.create({
      data: {
        name: 'Ejecutivo',
        description: 'Servicio ejecutivo con asientos más cómodos',
        floorCount: 1,
        seatsFloor1: 41,
        seatsFloor2: 0,
        aditionalPrice: 1.50
      }
    }),
    prisma.busType.create({
      data: {
        name: 'Semi Cama',
        description: 'Asientos reclinables para mayor comodidad',
        floorCount: 1,
        seatsFloor1: 37,
        seatsFloor2: 0,
        aditionalPrice: 2.00
      }
    }),
    prisma.busType.create({
      data: {
        name: 'Cama',
        description: 'Asientos completamente reclinables para viajes largos',
        floorCount: 1,
        seatsFloor1: 30,
        seatsFloor2: 0,
        aditionalPrice: 4.00
      }
    }),
    prisma.busType.create({
      data: {
        name: 'Doble Piso Económico',
        description: 'Dos pisos para mayor capacidad de pasajeros',
        floorCount: 2,
        seatsFloor1: 30,
        seatsFloor2: 30,
        aditionalPrice: 2.00
      }
    }),
    prisma.busType.create({
      data: {
        name: 'Doble Piso Ejecutivo',
        description: 'Dos pisos con servicios ejecutivos',
        floorCount: 2,
        seatsFloor1: 24,
        seatsFloor2: 24,
        aditionalPrice: 4.00
      }
    }),
    prisma.busType.create({
      data: {
        name: 'Microbus',
        description: 'Vehículo más pequeño para rutas cortas',
        floorCount: 1,
        seatsFloor1: 30,
        seatsFloor2: 0,
        aditionalPrice: 0.50
      }
    })
  ]);

  // Crear cooperativas
  Logger.log('Creando cooperativas...');
  const cooperatives = await prisma.$transaction([
    prisma.cooperative.create({
      data: {
        name: 'Cooperativa de Transportes Ecuador',
        address: 'Av. Amazonas N23-45 y Veintimilla',
        phone: '022222222',
        email: 'info@cooptecec.com',
        logo: 'coop1.png',
        facebook: 'https://www.facebook.com/share/g/1AYRGX7aNr/',
        instagram: 'https://www.instagram.com/reel/DKpreMQvH1G/?igsh=enJ5c3VjM2c0b3lp',
        X: 'https://x.com/shachimu',
        website: 'https://cooptecec.com.ec'
      }
    }),
    prisma.cooperative.create({
      data: {
        name: 'Transportes Andinos',
        address: 'Av. 6 de Diciembre N34-123 y La Niña',
        phone: '023333333',
        email: 'contacto@transportesandinos.ec',
        logo: 'coop2.png',
        facebook: 'https://www.facebook.com/share/g/1AYRGX7aNr/',
        instagram: 'https://www.instagram.com/reel/DKpreMQvH1G/?igsh=enJ5c3VjM2c0b3lp',
        X: 'https://x.com/shachimu',
        website: 'https://transportesandinos.com.ec'
      }
    })
  ]);

  // Crear buses
  Logger.log('Creando buses...');
  const buses = [];
  const plates = ['ABC-1234', 'XYZ-5678', 'QWE-9012', 'RTY-3456', 'UIO-7890', 'ASD-1234'];
  
  for (let i = 0; i < 6; i++) {
    const busType = busTypes[i % busTypes.length];
    const bus = await prisma.bus.create({
      data: {
        cooperativeId: cooperatives[0].id,
        licensePlate: plates[i],
        chassisBrand: ['Mercedes-Benz', 'Volvo', 'Scania', 'Hino', 'Foton'][i % 5],
        bodyworkBrand: 'Carrocerías del Sur',
        photo: `bus-${i+1}.jpg`,
        busTypeId: busType.id
      },
      include: {
        busType: true
      }
    });
    
    // Crear asientos para el bus
    const seatsData = [];
    
    if (bus.busType.floorCount >= 1) {
      const seatsFloor1 = generateBusSeats(1, 10, 4, 1);
      seatsData.push(...seatsFloor1);
    }
    
    if (bus.busType.floorCount >= 2) {
      const seatsFloor2 = generateBusSeats(2, 10, 3, 41);
      seatsData.push(...seatsFloor2);
    }
    
    await prisma.busSeat.createMany({
      data: seatsData.map(seat => ({
        ...seat,
        busId: bus.id
      }))
    });
    
    buses.push(bus);
  }

  // Crear frecuencias de viaje
  Logger.log('Creando frecuencias de viaje...');
  
  // Ruta Quito - Guayaquil
  const frequency1 = await prisma.frequency.create({
    data: {
      cooperativeId: cooperatives[0].id,
      originCityId: cities[0].id, // Quito
      destinationCityId: cities[1].id, // Guayaquil
      departureTime: new Date('2023-01-01T08:00:00'),
      status: Status.ACTIVE,
      antResolution: `ANT-RES-${Date.now()}-1`
    }
  });
  
  // Ruta Guayaquil - Cuenca
  const frequency2 = await prisma.frequency.create({
    data: {
      cooperativeId: cooperatives[0].id,
      originCityId: cities[1].id, // Guayaquil
      destinationCityId: cities[2].id, // Cuenca
      departureTime: new Date('2023-01-01T10:00:00'),
      status: Status.ACTIVE,
      antResolution: `ANT-RES-${Date.now()}-2`
    }
  });
  
  // Ruta Cuenca - Ambato
  const frequency3 = await prisma.frequency.create({
    data: {
      cooperativeId: cooperatives[1].id,
      originCityId: cities[2].id, // Cuenca
      destinationCityId: cities[4].id, // Ambato
      departureTime: new Date('2023-01-01T14:00:00'),
      status: Status.ACTIVE,
      antResolution: `ANT-RES-${Date.now()}-3`
    }
  });

  // Ruta Ambato - Quito
  const frequency4 = await prisma.frequency.create({
    data: {
      cooperativeId: cooperatives[1].id,
      originCityId: cities[4].id, // Ambato
      destinationCityId: cities[0].id, // Quito
      departureTime: new Date('2023-01-01T14:00:00'),
      status: Status.ACTIVE,
      antResolution: `ANT-RES-${Date.now()}-4`
    }
  });
  
  // Agregar paradas intermedias para la ruta Quito - Guayaquil
  await prisma.intermediateStop.createMany({
    data: [
      {
        frequencyId: frequency1.id,
        cityId: cities[5].id, // Ambato
        order: 1
      },
      {
        frequencyId: frequency1.id,
        cityId: cities[6].id, // Riobamba
        order: 2
      },
    ]
  });
  
  // Crear precios de rutas
  await prisma.routePrice.create({
    data: {
      frequencyId: frequency1.id,
      normalPrice: 4.00,
      vipPrice: 6.00,
      childDiscount: 50.0,
      seniorDiscount: 25.0,
      handicappedDiscount: 30.0,
      taxRate: 15.0,
      includesTax: false
    }
  });
  
  await prisma.routePrice.create({
    data: {
      frequencyId: frequency2.id,
      normalPrice: 2.00,
      vipPrice: 3.00,
      childDiscount: 50.0,
      seniorDiscount: 25.0,
      handicappedDiscount: 30.0,
      taxRate: 15.0,
      includesTax: false
    }
  });
  
  await prisma.routePrice.create({
    data: {
      frequencyId: frequency3.id,
      normalPrice: 2.00,
      vipPrice: 3.00,
      childDiscount: 50.0,
      seniorDiscount: 25.0,
      handicappedDiscount: 30.0,
      taxRate: 15.0,
      includesTax: false
    }
  });

  await prisma.routePrice.create({
    data: {
      frequencyId: frequency4.id,
      normalPrice: 2.00,
      vipPrice: 3.00,
      childDiscount: 50.0,
      seniorDiscount: 25.0,
      handicappedDiscount: 30.0,
      taxRate: 15.0,
      includesTax: false
    }
  });
  
  // Crear hojas de ruta
  const routeSheetHeader = await prisma.routeSheetHeader.create({
    data: {
      cooperativeId: cooperatives[0].id,
      startDate: new Date('2025-06-30'),
      status: Status.ACTIVE
    }
  });
  
  // Agregar detalles a la hoja de ruta
  await prisma.routeSheetDetail.create({
    data: {
      routeSheetHeaderId: routeSheetHeader.id,
      frequencyId: frequency1.id,
      busId: buses[0].id,
      status: Status.ACTIVE
    }
  });

  await prisma.routeSheetDetail.create({
    data: {
      routeSheetHeaderId: routeSheetHeader.id,
      frequencyId: frequency2.id,
      busId: buses[1].id,
      status: Status.ACTIVE
    }
  });

  await prisma.routeSheetDetail.create({
    data: {
      routeSheetHeaderId: routeSheetHeader.id,
      frequencyId: frequency3.id,
      busId: buses[2].id,
      status: Status.ACTIVE
    }
  });

  await prisma.routeSheetDetail.create({
    data: {
      routeSheetHeaderId: routeSheetHeader.id,
      frequencyId: frequency4.id,
      busId: buses[3].id,
      status: Status.ACTIVE
    }
  });

  await prisma.routeSheetDetail.create({
    data: {
      routeSheetHeaderId: routeSheetHeader.id,
      frequencyId: frequency1.id,
      busId: buses[4].id,
      status: Status.ACTIVE
    }
  });

  await prisma.routeSheetDetail.create({
    data: {
      routeSheetHeaderId: routeSheetHeader.id,
      frequencyId: frequency2.id,
      busId: buses[5].id,
      status: Status.ACTIVE
    }
  });

  // Hashear contraseña común para usuarios de prueba
  const passwordHash = await hash('admin4566', 10);

  const users = await Promise.all([
    // 🔑 Administradores
    prisma.user.create({
      data: {
        idNumber: '1805472386',
        documentType: 'cedula', // ✅ String según tu esquema
        firstName: 'David',
        lastName: 'Administrador',
        email: 'admin@chasquigo.com',
        password: passwordHash,
        phone: '0999123456',
        role: Role.ADMIN,
        cooperativeId: cooperatives[0].id
      }
    }),
    prisma.user.create({
      data: {
        idNumber: '0928374651',
        documentType: 'cedula',
        firstName: 'María',
        lastName: 'Supervisor',
        email: 'supervisor@andinos.com',
        password: passwordHash,
        phone: '0987654321',
        role: Role.ADMIN,
        cooperativeId: cooperatives[1].id
      }
    }),

    // 🚗 Conductores
    prisma.user.create({
      data: {
        idNumber: '1712345678',
        documentType: 'cedula',
        firstName: 'Carlos',
        lastName: 'Conductor',
        email: 'carlos.conductor@chasquigo.com',
        password: passwordHash,
        phone: '0995555111',
        role: Role.DRIVER,
        cooperativeId: cooperatives[0].id
      }
    }),
    prisma.user.create({
      data: {
        idNumber: '0987654320', // ✅ Diferente para evitar duplicados
        documentType: 'cedula',
        firstName: 'Ana',
        lastName: 'Conductora',
        email: 'ana.conductora@andinos.com',
        password: passwordHash,
        phone: '0966666222',
        role: Role.DRIVER,
        cooperativeId: cooperatives[1].id
      }
    }),

    // 👥 Clientes para testing
    prisma.user.create({
      data: {
        idNumber: '1234567890',
        documentType: 'cedula',
        firstName: 'Juan',
        lastName: 'Pérez',
        email: 'juan.perez@email.com',
        password: passwordHash,
        phone: '0987123456',
        role: Role.CLIENT,
      }
    }),
    prisma.user.create({
      data: {
        idNumber: '0987654322', // ✅ Diferente
        documentType: 'cedula',
        firstName: 'María',
        lastName: 'González',
        email: 'maria.gonzalez@email.com',
        password: passwordHash,
        phone: '0976543210',
        role: Role.CLIENT,
      }
    }),
    prisma.user.create({
      data: {
        idNumber: '1122334455',
        documentType: 'cedula',
        firstName: 'Pedro',
        lastName: 'Rodríguez',
        email: 'pedro.rodriguez@email.com',
        password: passwordHash,
        phone: '0965432109',
        role: Role.CLIENT,
      }
    }),

    // 🧑‍💼 Staff para confirmar pagos en efectivo
    prisma.user.create({
      data: {
        idNumber: '1805123456',
        documentType: 'cedula',
        firstName: 'Luis',
        lastName: 'Vendedor',
        email: 'vendedor@chasquigo.com',
        password: passwordHash,
        phone: '0977777333',
        role: Role.WORKER,
        cooperativeId: cooperatives[0].id
      }
    }),
    prisma.user.create({
      data: {
        idNumber: '0912345678',
        documentType: 'cedula',
        firstName: 'Carmen',
        lastName: 'Vendedora',
        email: 'vendedora@andinos.com',
        password: passwordHash,
        phone: '0988888444',
        role: Role.WORKER,
        cooperativeId: cooperatives[1].id
      }
    })
  ]);

  // Mostrar resumen
  const citiesCount = await prisma.city.count();
  const busesCount = await prisma.bus.count();
  const seatsCount = await prisma.busSeat.count();
  const frequenciesCount = await prisma.frequency.count();
  const routeSheetsCount = await prisma.routeSheetHeader.count();
  
  console.log('\nResumen de datos creados:');
  console.log('-------------------------');
  console.log(`Ciudades: ${citiesCount}`);
  console.log(`Cooperativas: ${cooperatives.length}`);
  console.log(`Tipos de buses: ${busTypes.length}`);
  console.log(`Buses: ${busesCount}`);
  console.log(`Asientos: ${seatsCount}`);
  console.log(`Frecuencias: ${frequenciesCount}`);
  console.log(`Hojas de ruta: ${routeSheetsCount}`);
  console.log('\nCredenciales de acceso:');
  console.log('----------------------');
  console.log('Admin: admin@chasquigo.com / admin4566');
  console.log('Conductor: driver1@chasquigo.com / admin4566');
  console.log('Cliente: cliente@chasquigo.com / admin4566');
  
  Logger.log('¡Datos de prueba creados exitosamente!');


  // ========================================
  // 🎫 CREAR ALGUNOS TICKETS DE EJEMPLO
  // ========================================
  Logger.log('🎫 Creando tickets de ejemplo...');
  
  const exampleTickets = await Promise.all([
    // Ticket 1: Juan Pérez en Quito → Guayaquil 08:30
    prisma.purchaseTransaction.create({
      data: {
        buyerUserId: users[4].id, // Juan Pérez
        totalAmount: 25.00,
        taxAmount: 3.75,
        discountAmount: 0.00,
        finalAmount: 28.75,
        status: 'completed',
      }
    }).then(async (transaction) => {
      const ticket = await prisma.ticket.create({
        data: {
          buyerUserId: users[4].id,
          busId: buses[0].id,
          frequencyId: frequency1.id,
          totalBasePrice: 25.00,
          totalDiscountAmount: 0.00,
          totalTaxAmount: 3.75,
          finalTotalPrice: 28.75,
          status: TicketStatus.CONFIRMED, // ✅ Usar enum
          passengerCount: 1,
          originStopId: cities[0].id,
          destinationStopId: cities[1].id,
          purchaseTransactionId: transaction.id,
          qrCode: `TKT_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`, // ✅ substring en lugar de substr
        }
      });

      // Crear pasajero para este ticket
      const firstSeat = await prisma.busSeat.findFirst({
        where: { busId: buses[0].id, number: '1A' }
      });

      await prisma.ticketPassenger.create({
        data: {
          ticketId: ticket.id,
          passengerUserId: users[4].id,
          seatId: firstSeat!.id,
          seatType: SeatType.VIP, // ✅ Usar enum
          passengerType: PassengerType.NORMAL, // ✅ Usar enum
          basePrice: 35.00,
          discountAmount: 0.00,
          taxAmount: 5.25,
          finalPrice: 40.25,
        }
      });

      return ticket;
    }),

    // Ticket 2: María González en Guayaquil → Cuenca
    prisma.purchaseTransaction.create({
      data: {
        buyerUserId: users[5].id, // María González
        totalAmount: 18.00,
        taxAmount: 2.70,
        discountAmount: 0.00,
        finalAmount: 20.70,
        status: 'completed',
      }
    }).then(async (transaction) => {
      const ticket = await prisma.ticket.create({
        data: {
          buyerUserId: users[5].id,
          busId: buses[2].id,
          frequencyId: frequency2.id,
          totalBasePrice: 18.00,
          totalDiscountAmount: 0.00,
          totalTaxAmount: 2.70,
          finalTotalPrice: 20.70,
          status: TicketStatus.CONFIRMED,
          passengerCount: 1,
          originStopId: cities[1].id,
          destinationStopId: cities[2].id,
          purchaseTransactionId: transaction.id,
          qrCode: `TKT_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        }
      });

      const firstNormalSeat = await prisma.busSeat.findFirst({
        where: { busId: buses[2].id, type: SeatType.NORMAL }
      });

      await prisma.ticketPassenger.create({
        data: {
          ticketId: ticket.id,
          passengerUserId: users[5].id,
          seatId: firstNormalSeat!.id,
          seatType: SeatType.NORMAL,
          passengerType: PassengerType.NORMAL,
          basePrice: 18.00,
          discountAmount: 0.00,
          taxAmount: 2.70,
          finalPrice: 20.70,
        }
      });

      return ticket;
    })
  ]);


}

main()
  .catch((e) => {
    console.error('❌ Error en la semilla:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });