import { Logger } from '@nestjs/common';
import { PrismaClient, Province, Role, DocumentType, PassengerType, SeatType, TicketStatus } from '@prisma/client';
import { hash } from 'bcrypt';

const prisma = new PrismaClient();

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
  await prisma.user.deleteMany({});
  await prisma.cooperative.deleteMany({});
  await prisma.city.deleteMany({});

  // ========================================
  // 🏙️ CREAR CIUDADES DE ECUADOR
  // ========================================
  Logger.log('🏙️ Creando ciudades...');
  const cities = await Promise.all([
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

  // ========================================
  // 🚌 CREAR COOPERATIVAS
  // ========================================
  Logger.log('🚌 Creando cooperativas...');
  const cooperatives = await Promise.all([
    prisma.cooperative.create({
      data: {
        name: 'Cooperativa Chasquigo Express',
        address: 'Terminal Terrestre de Quito, Oficina 15-A',
        phone: '022891234',
        email: 'reservas@chasquigoexpress.com',
        logo: 'https://example.com/logos/chasquigo-express.png'
      }
    }),
    prisma.cooperative.create({
      data: {
        name: 'Transportes Andinos del Ecuador',
        address: 'Terminal Terrestre de Guayaquil, Local 28-B',
        phone: '042567890',
        email: 'info@andinosecuador.com',
        logo: 'https://example.com/logos/andinos-ecuador.png'
      }
    })
  ]);

  // ========================================
  // 👥 CREAR USUARIOS PARA TESTING
  // ========================================
  Logger.log('👥 Creando usuarios...');
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

  // ========================================
  // 🚍 CREAR TIPOS DE BUS
  // ========================================
  Logger.log('🚍 Creando tipos de bus...');
  const busTypes = await Promise.all([
    prisma.busType.create({
      data: { name: 'Ejecutivo Plus', floorCount: 1, capacity: 40 }
    }),
    prisma.busType.create({
      data: { name: 'Premium Doble Piso', floorCount: 2, capacity: 48 }
    }),
    prisma.busType.create({
      data: { name: 'VIP Semicama', floorCount: 1, capacity: 36 }
    }),
    prisma.busType.create({
      data: { name: 'Económico', floorCount: 1, capacity: 46 }
    })
  ]);

  // ========================================
  // 🚌 CREAR BUSES
  // ========================================
  Logger.log('🚌 Creando buses...');
  const buses = await Promise.all([
    prisma.bus.create({
      data: {
        cooperativeId: cooperatives[0].id,
        licensePlate: 'CHQ-001',
        chassisBrand: 'Mercedes-Benz',
        bodyworkBrand: 'Marcopolo',
        photo: 'https://example.com/buses/chq001.jpg',
        stoppageDays: 1,
        busTypeId: busTypes[0].id,
      }
    }),
    prisma.bus.create({
      data: {
        cooperativeId: cooperatives[0].id,
        licensePlate: 'CHQ-002',
        chassisBrand: 'Scania',
        bodyworkBrand: 'Busscar',
        photo: 'https://example.com/buses/chq002.jpg',
        stoppageDays: 2,
        busTypeId: busTypes[1].id,
      }
    }),
    prisma.bus.create({
      data: {
        cooperativeId: cooperatives[1].id,
        licensePlate: 'AND-001',
        chassisBrand: 'Volvo',
        bodyworkBrand: 'Irizar',
        photo: 'https://example.com/buses/and001.jpg',
        stoppageDays: 1,
        busTypeId: busTypes[2].id,
      }
    }),
    prisma.bus.create({
      data: {
        cooperativeId: cooperatives[1].id,
        licensePlate: 'AND-002',
        chassisBrand: 'Mercedes-Benz',
        bodyworkBrand: 'Comil',
        photo: 'https://example.com/buses/and002.jpg',
        stoppageDays: 2,
        busTypeId: busTypes[3].id,
      }
    })
  ]);

  // ========================================
  // 💺 CREAR ASIENTOS PARA CADA BUS
  // ========================================
  Logger.log('💺 Creando asientos...');
  for (const bus of buses) {
    const busType = await prisma.busType.findUnique({ where: { id: bus.busTypeId } });
    const capacity = busType?.capacity || 40;
    
    // 20% de asientos VIP (primeros asientos)
    const vipSeats = Math.floor(capacity * 0.2);
    
    for (let i = 1; i <= capacity; i++) {
      const isVip = i <= vipSeats;
      const seatNumber = busType?.floorCount === 2 
        ? (i <= Math.ceil(capacity / 2) ? `${i}A` : `${i - Math.ceil(capacity / 2)}B`)
        : `${i}${i % 4 <= 1 ? 'A' : 'B'}`;

      await prisma.busSeat.create({
        data: {
          number: seatNumber,
          type: isVip ? SeatType.VIP : SeatType.NORMAL, // ✅ Usar enum
          location: i % 4 <= 1 ? 'ventana' : 'pasillo',
          busId: bus.id
        }
      });
    }
  }

  // ========================================
  // 🛣️ CREAR FRECUENCIAS
  // ========================================
  Logger.log('🛣️ Creando frecuencias...');
  const frequencies = await Promise.all([
    prisma.frequency.create({
      data: {
        departureTime: new Date('1970-01-01T08:30:00'), // ✅ Solo hora como Time
        status: 'activo',
        antResolution: 'ANT-2025-QTO-GYE-001',
        cooperativeId: cooperatives[0].id,
        originCityId: cities[0].id,
        destinationCityId: cities[1].id
      }
    }),
    prisma.frequency.create({
      data: {
        departureTime: new Date('1970-01-01T15:00:00'), // ✅ Solo hora
        status: 'activo',
        antResolution: 'ANT-2025-QTO-GYE-002',
        cooperativeId: cooperatives[0].id,
        originCityId: cities[0].id,
        destinationCityId: cities[1].id
      }
    }),
    prisma.frequency.create({
      data: {
        departureTime: new Date('1970-01-01T09:00:00'),
        status: 'activo',
        antResolution: 'ANT-2025-GYE-CUE-001',
        cooperativeId: cooperatives[1].id,
        originCityId: cities[1].id,
        destinationCityId: cities[2].id
      }
    }),
    prisma.frequency.create({
      data: {
        departureTime: new Date('1970-01-01T14:30:00'),
        status: 'activo',
        antResolution: 'ANT-2025-CUE-QTO-001',
        cooperativeId: cooperatives[1].id,
        originCityId: cities[2].id,
        destinationCityId: cities[0].id
      }
    })
  ]);

  // ========================================
  // 🛑 CREAR PARADAS INTERMEDIAS
  // ========================================
  Logger.log('🛑 Creando paradas intermedias...');
  await Promise.all([
    // Paradas para Quito → Guayaquil
    ...frequencies.slice(0, 2).flatMap((freq) => [
      prisma.intermediateStop.create({
        data: {
          frequencyId: freq.id,
          cityId: cities[3].id, // Santo Domingo
          order: 1
        }
      }),
      prisma.intermediateStop.create({
        data: {
          frequencyId: freq.id,
          cityId: cities[6].id, // Riobamba
          order: 2
        }
      })
    ]),

    // Paradas para Guayaquil → Cuenca
    prisma.intermediateStop.create({
      data: {
        frequencyId: frequencies[2].id,
        cityId: cities[7].id, // Machala
        order: 1
      }
    }),

    // Paradas para Cuenca → Quito
    prisma.intermediateStop.create({
      data: {
        frequencyId: frequencies[3].id,
        cityId: cities[5].id, // Ambato
        order: 1
      }
    }),
    prisma.intermediateStop.create({
      data: {
        frequencyId: frequencies[3].id,
        cityId: cities[6].id, // Riobamba
        order: 2
      }
    })
  ]);

  // ========================================
  // 💰 CREAR CONFIGURACIÓN DE PRECIOS
  // ========================================
  Logger.log('💰 Creando configuración de precios...');
  await Promise.all([
    // Precios para Quito → Guayaquil
    ...frequencies.slice(0, 2).map(freq => 
      prisma.routePrice.create({
        data: {
          frequencyId: freq.id,
          normalPrice: 25.00,
          vipPrice: 35.00,
          childDiscount: 50.0,
          seniorDiscount: 25.0,
          handicappedDiscount: 30.0,
          taxRate: 15.0, // ✅ CORREGIDO: taxRate en lugar de taxPercentage
          includesTax: false // ✅ El precio NO incluye IVA
        }
      })
    ),

    // Precios para Guayaquil → Cuenca
    prisma.routePrice.create({
      data: {
        frequencyId: frequencies[2].id,
        normalPrice: 18.00,
        vipPrice: 28.00,
        childDiscount: 50.0,
        seniorDiscount: 25.0,
        handicappedDiscount: 30.0,
        taxRate: 15.0,
        includesTax: false
      }
    }),

    // Precios para Cuenca → Quito
    prisma.routePrice.create({
      data: {
        frequencyId: frequencies[3].id,
        normalPrice: 22.00,
        vipPrice: 32.00,
        childDiscount: 50.0,
        seniorDiscount: 25.0,
        handicappedDiscount: 30.0,
        taxRate: 15.0,
        includesTax: false
      }
    })
  ]);

  // ========================================
  // 📋 CREAR HOJAS DE RUTA PARA HOY (29 JUNIO 2025)
  // ========================================
  Logger.log('📋 Creando hojas de ruta para HOY...');
  const today = new Date('2025-06-29');
  
  const routeSheetHeaders = await Promise.all([
    prisma.routeSheetHeader.create({
      data: {
        startDate: today, // ✅ CORREGIDO: startDate en lugar de date
        endDate: today,   // ✅ CORREGIDO: endDate
        cooperativeId: cooperatives[0].id,
        status: 'activo'
      }
    }),
    prisma.routeSheetHeader.create({
      data: {
        startDate: today,
        endDate: today,
        cooperativeId: cooperatives[1].id,
        status: 'activo'
      }
    })
  ]);

  // ========================================
  // 📄 CREAR DETALLES DE HOJA DE RUTA
  // ========================================
  Logger.log('📄 Creando detalles de hoja de ruta...');
  const routeSheetDetails = await Promise.all([
    // Detalle 1: Quito → Guayaquil 08:30 (Bus CHQ-001)
    prisma.routeSheetDetail.create({
      data: {
        date: today,
        status: 'activo',
        availableNormalSeats: 32,
        availableVIPSeats: 8,
        totalNormalSeats: 32,
        totalVIPSeats: 8,
        routeSheetHeaderId: routeSheetHeaders[0].id,
        frequencyId: frequencies[0].id,
        busId: buses[0].id,
        // ❌ REMOVIDO: driverId no existe en tu esquema
      }
    }),

    // Detalle 2: Quito → Guayaquil 15:00 (Bus CHQ-002)
    prisma.routeSheetDetail.create({
      data: {
        date: today,
        status: 'activo',
        availableNormalSeats: 38,
        availableVIPSeats: 10,
        totalNormalSeats: 38,
        totalVIPSeats: 10,
        routeSheetHeaderId: routeSheetHeaders[0].id,
        frequencyId: frequencies[1].id,
        busId: buses[1].id,
      }
    }),

    // Detalle 3: Guayaquil → Cuenca 09:00 (Bus AND-001)
    prisma.routeSheetDetail.create({
      data: {
        date: today,
        status: 'activo',
        availableNormalSeats: 29,
        availableVIPSeats: 7,
        totalNormalSeats: 29,
        totalVIPSeats: 7,
        routeSheetHeaderId: routeSheetHeaders[1].id,
        frequencyId: frequencies[2].id,
        busId: buses[2].id,
      }
    }),

    // Detalle 4: Cuenca → Quito 14:30 (Bus AND-002)
    prisma.routeSheetDetail.create({
      data: {
        date: today,
        status: 'activo',
        availableNormalSeats: 37,
        availableVIPSeats: 9,
        totalNormalSeats: 37,
        totalVIPSeats: 9,
        routeSheetHeaderId: routeSheetHeaders[1].id,
        frequencyId: frequencies[3].id,
        busId: buses[3].id,
      }
    })
  ]);

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
          routeSheetId: routeSheetDetails[0].id,
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
          routeSheetId: routeSheetDetails[2].id,
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

  // ========================================
  // ✅ RESUMEN FINAL
  // ========================================
  Logger.log('');
  Logger.log('🎉 ¡SEED COMPLETADO EXITOSAMENTE!');
  Logger.log('=====================================');
  Logger.log('📊 RESUMEN DE DATOS CREADOS:');
  Logger.log(`🏙️  Ciudades: ${cities.length}`);
  Logger.log(`🚌  Cooperativas: ${cooperatives.length}`);
  Logger.log(`👥  Usuarios: ${users.length}`);
  Logger.log(`🚍  Tipos de bus: ${busTypes.length}`);
  Logger.log(`🚌  Buses: ${buses.length}`);
  Logger.log(`🛣️  Frecuencias: ${frequencies.length}`);
  Logger.log(`📄  Hojas de ruta para HOY: ${routeSheetDetails.length}`);
  Logger.log(`🎫  Tickets de ejemplo: ${exampleTickets.length}`);
  Logger.log('=====================================');
  Logger.log('');
  Logger.log('🔑 CREDENCIALES DE ACCESO:');
  Logger.log('Email: admin@chasquigo.com');
  Logger.log('Password: admin4566');
  Logger.log('');
  Logger.log('📱 RUTAS DISPONIBLES PARA TESTING:');
  Logger.log('1. Quito → Guayaquil (08:30) - Bus CHQ-001');
  Logger.log('2. Quito → Guayaquil (15:00) - Bus CHQ-002');
  Logger.log('3. Guayaquil → Cuenca (09:00) - Bus AND-001');
  Logger.log('4. Cuenca → Quito (14:30) - Bus AND-002');
  Logger.log('');
  Logger.log('🎯 FECHA DE LAS RUTAS: 29 de Junio de 2025');
  Logger.log('');
  Logger.log('✅ ¡Listo para testear compra de tickets!');
}

main()
  .catch((e) => {
    console.error('❌ Error en la semilla:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });