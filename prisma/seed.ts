import { Logger } from '@nestjs/common';
import { PrismaClient, Province, Role, DocumentType, SeatType, SeatLocation, Status } from '@prisma/client';
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
  Logger.log('Limpiando datos existentes...');
  await prisma.ticket.deleteMany({});
  await prisma.routeSheetDetail.deleteMany({});
  await prisma.routeSheetHeader.deleteMany({});
  await prisma.intermediateStop.deleteMany({});
  await prisma.routePrice.deleteMany({});
  await prisma.frequency.deleteMany({});
  await prisma.busSeat.deleteMany({});
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
    prisma.city.create({ data: { name: 'Ibarra', province: Province.IMBABURA } }),
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
      childDiscount: 0.5,
      seniorDiscount: 0.25,
      handicappedDiscount: 0.5,
    }
  });
  
  await prisma.routePrice.create({
    data: {
      frequencyId: frequency2.id,
      normalPrice: 2.00,
      vipPrice: 3.00,
      childDiscount: 0.5,
      seniorDiscount: 0.25,
      handicappedDiscount: 0.5,
    }
  });
  
  await prisma.routePrice.create({
    data: {
      frequencyId: frequency3.id,
      normalPrice: 2.00,
      vipPrice: 3.00,
      childDiscount: 0.5,
      seniorDiscount: 0.25,
      handicappedDiscount: 0.5,
    }
  });

  await prisma.routePrice.create({
    data: {
      frequencyId: frequency4.id,
      normalPrice: 2.00,
      vipPrice: 3.00,
      childDiscount: 0.5,
      seniorDiscount: 0.25,
      handicappedDiscount: 0.5,
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

  // Crear usuarios para cada rol
  Logger.log('Creando usuarios...');
  await Promise.all([
    // Admin
    prisma.user.create({
      data: {
        idNumber: '1805472386',
        documentType: DocumentType.CEDULA,
        firstName: 'Admin',
        lastName: 'Sistema',
        email: 'admin@chasquigo.com',
        password: passwordHash,
        phone: '0999999999',
        role: Role.ADMIN,
        cooperativeId: cooperatives[0].id
      }
    }),
    prisma.user.create({
      data: {
        idNumber: '1805271937',
        documentType: DocumentType.CEDULA,
        firstName: 'Admin',
        lastName: 'Sistema',
        email: 'admin2@chasquigo.com',
        password: passwordHash,
        phone: '0976543210',
        role: Role.ADMIN,
        cooperativeId: cooperatives[0].id
      }
    }),
    prisma.user.create({
      data: {
        idNumber: '1805359203',
        documentType: DocumentType.CEDULA,
        firstName: 'Admin',
        lastName: 'Sistema',
        email: 'admin3@chasquigo.com',
        password: passwordHash,
        phone: '0976543210',
        role: Role.ADMIN,
        cooperativeId: cooperatives[0].id
      }
    }),
    prisma.user.create({
      data: {
        idNumber: '1805465489',
        documentType: DocumentType.CEDULA,
        firstName: 'Admin',
        lastName: 'Sistema',
        email: 'admin4@chasquigo.com',
        password: passwordHash,
        phone: '0976543210',
        role: Role.ADMIN,
        cooperativeId: cooperatives[0].id
      }
    }),
    prisma.user.create({
      data: {
        idNumber: '1850137918',
        documentType: DocumentType.CEDULA,
        firstName: 'Admin',
        lastName: 'Sistema',
        email: 'admin5@chasquigo.com',
        password: passwordHash,
        phone: '0976543210',
        role: Role.ADMIN,
        cooperativeId: cooperatives[0].id
      }
    }),
    
    // Drivers
    prisma.user.create({
      data: {
        idNumber: '1805472386001',
        documentType: DocumentType.RUC,
        firstName: 'Driver',
        lastName: 'Sistema',
        email: 'driver1@chasquigo.com',
        password: passwordHash,
        phone: '0987654321',
        role: Role.DRIVER,
        cooperativeId: cooperatives[0].id
      }
    }),
    prisma.user.create({
      data: {
        idNumber: '1805271937001',
        documentType: DocumentType.RUC,
        firstName: 'Driver',
        lastName: 'Sistema',
        email: 'driver2@chasquigo.com',
        password: passwordHash,
        phone: '0987654321',
        role: Role.DRIVER,
        cooperativeId: cooperatives[0].id
      }
    }),
    prisma.user.create({
      data: {
        idNumber: '1805359203001',
        documentType: DocumentType.RUC,
        firstName: 'Driver',
        lastName: 'Sistema',
        email: 'driver3@chasquigo.com',
        password: passwordHash,
        phone: '0987654321',
        role: Role.DRIVER,
        cooperativeId: cooperatives[0].id
      }
    }),
    prisma.user.create({
      data: {
        idNumber: '1850137918001',
        documentType: DocumentType.RUC,
        firstName: 'Driver',
        lastName: 'Sistema',
        email: 'driver4@chasquigo.com',
        password: passwordHash,
        phone: '0987654321',
        role: Role.DRIVER,
        cooperativeId: cooperatives[0].id
      }
    }),
    prisma.user.create({
      data: {
        idNumber: '1805465489001',
        documentType: DocumentType.RUC,
        firstName: 'Driver',
        lastName: 'Sistema',
        email: 'driver5@chasquigo.com',
        password: passwordHash,
        phone: '0987654321',
        role: Role.DRIVER,
        cooperativeId: cooperatives[0].id
      }
    }),
    
    // Clientes
    prisma.user.create({
      data: {
        idNumber: '9999999999',
        documentType: DocumentType.CEDULA,
        firstName: 'CONSUMIDOR',
        lastName: 'FINAL',
        email: 'consumidorfinal@chasquigo.com',
        password: passwordHash,
        phone: '0965432109',
        role: Role.CLIENT,
      }
    }),
    prisma.user.create({
      data: {
        idNumber: '9999999999999',
        documentType: DocumentType.RUC,
        firstName: 'CONSUMIDOR',
        lastName: 'FINAL',
        email: 'consumidorfinal@chasquigo.com',
        password: passwordHash,
        phone: '0954321098',
        role: Role.CLIENT,
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
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
