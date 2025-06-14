import { Logger } from '@nestjs/common';
import { PrismaClient, Province, Role, DocumentType } from '@prisma/client';
import { hash } from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Limpiar datos existentes (ten cuidado en producción)
  Logger.log('Limpiando datos existentes...');
  await prisma.intermediateStop.deleteMany({});
  await prisma.ticket.deleteMany({});
  await prisma.routeSheetDetail.deleteMany({});
  await prisma.routeSheetHeader.deleteMany({});
  await prisma.frequency.deleteMany({});
  await prisma.busSeat.deleteMany({});
  await prisma.bus.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.cooperative.deleteMany({});
  await prisma.city.deleteMany({});

  // Crear ciudades de Ecuador
  Logger.log('Creando ciudades...');
  const cities = await Promise.all([
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

  // Crear cooperativas
  Logger.log('Creando cooperativas...');
  const cooperatives = await Promise.all([
    prisma.cooperative.create({
      data: {
        name: 'Cooperativa de Transportes Ecuador',
        address: 'Av. Amazonas N23-45 y Veintimilla',
        phone: '022222222',
        email: 'info@cooptecec.com',
        logo: 'coop1.png'
      }
    }),
    prisma.cooperative.create({
      data: {
        name: 'Transportes Andinos',
        address: 'Av. 6 de Diciembre N34-123 y La Niña',
        phone: '023333333',
        email: 'contacto@transportesandinos.ec',
        logo: 'coop2.png'
      }
    })
  ]);

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

  // Crear tipos de bus primero
  Logger.log('Creando tipos de bus...');
  const busTypes = await Promise.all([
    prisma.busType.create({
      data: {
        name: 'Convencional', floorCount: 1, capacity: 46 },
    }),
    prisma.busType.create({
      data: {
        name: 'Ejecutivo', floorCount: 1, capacity: 40 },
    }),
    prisma.busType.create({
      data: {
        name: 'Semi Cama', floorCount: 1, capacity: 36 },
    }),
    prisma.busType.create({
      data: {
        name: 'Cama', floorCount: 1, capacity: 30 },
    }),
    prisma.busType.create({
      data: {
        name: 'Doble Piso Económico', floorCount: 2, capacity: 60 },
    }),
    prisma.busType.create({
      data: {
        name: 'Doble Piso Ejecutivo', floorCount: 2, capacity: 48 },
    }),
    prisma.busType.create({
      data: {
        name: 'Microbus', floorCount: 1, capacity: 30 },
    }),
  ]);

  // Crear buses para cada cooperativa
  Logger.log('Creando buses...');
  const buses = await Promise.all([
    // Buses para la primera cooperativa
    prisma.bus.create({
      data: {
        cooperativeId: cooperatives[0].id,
        licensePlate: 'ABC-1234',
        chassisBrand: 'Mercedes Benz',
        bodyworkBrand: 'Busscar',
        stoppageDays: 2,
        busTypeId: busTypes[0].id,
      }
    }),
    prisma.bus.create({
      data: {
        cooperativeId: cooperatives[0].id,
        licensePlate: 'ABC-1235',
        chassisBrand: 'Mercedes Benz',
        bodyworkBrand: 'Busscar',
        stoppageDays: 2,
        busTypeId: busTypes[1].id,
      }
    }),
    prisma.bus.create({
      data: {
        cooperativeId: cooperatives[0].id,
        licensePlate: 'ABC-1236',
        chassisBrand: 'Mercedes Benz',
        bodyworkBrand: 'Busscar',
        stoppageDays: 2,
        busTypeId: busTypes[2].id,
      }
    }),
    prisma.bus.create({
      data: {
        cooperativeId: cooperatives[0].id,
        licensePlate: 'ABC-1237',
        chassisBrand: 'Mercedes Benz',
        bodyworkBrand: 'Busscar',
        stoppageDays: 2,
        busTypeId: busTypes[3].id,
      }
    }),
    prisma.bus.create({
      data: {
        cooperativeId: cooperatives[0].id,
        licensePlate: 'ABC-1238',
        chassisBrand: 'Mercedes Benz',
        bodyworkBrand: 'Busscar',
        stoppageDays: 2,
        busTypeId: busTypes[4].id,
      }
    }),
    prisma.bus.create({
      data: {
        cooperativeId: cooperatives[0].id,
        licensePlate: 'ABC-1239',
        chassisBrand: 'Mercedes Benz',
        bodyworkBrand: 'Busscar',
        stoppageDays: 2,
        busTypeId: busTypes[5].id,
      }
    }),
    prisma.bus.create({
      data: {
        cooperativeId: cooperatives[0].id,
        licensePlate: 'ABC-1240',
        chassisBrand: 'Mercedes Benz',
        bodyworkBrand: 'Busscar',
        stoppageDays: 2,
        busTypeId: busTypes[6].id,
      }
    }),
  ]);

  // Crear asientos para cada bus
  Logger.log('Creando asientos...');
  for (const bus of buses) {
    const busType = await prisma.busType.findUnique({ where: { id: bus.busTypeId } });
    const capacity = busType?.capacity;
    for (let i = 1; i <= capacity; i++) {
      const isVip = i <= Math.floor(capacity * 0.25); // 25% asientos VIP
      await prisma.busSeat.create({
        data: {
          number: i.toString(),
          type: isVip ? 'VIP' : 'NORMAL',
          location: i % 2 === 0 ? 'ventana' : 'pasillo',
          busId: bus.id
        }
      });
    }
  }

  // Crear frecuencias entre ciudades
  Logger.log('Creando frecuencias...');
  const frequencies = await Promise.all([
    // Quito - Guayaquil
    prisma.frequency.create({
      data: {
        departureTime: new Date('2023-01-01T08:00:00'),
        status: 'activo',
        antResolution: 'RES-2023-001',
        cooperativeId: cooperatives[0].id,
        originCityId: cities[0].id,    // Quito
        destinationCityId: cities[1].id // Guayaquil
      }
    }),
    // Guayaquil - Cuenca
    prisma.frequency.create({
      data: {
        departureTime: new Date('2023-01-01T10:00:00'),
        status: 'activo',
        antResolution: 'RES-2023-002',
        cooperativeId: cooperatives[1].id,
        originCityId: cities[1].id,    // Guayaquil
        destinationCityId: cities[2].id // Cuenca
      }
    })
  ]);

  // Crear paradas intermedias para las frecuencias
  Logger.log('Creando paradas intermedias...');
  await Promise.all([
    // Paradas para Quito - Guayaquil
    prisma.intermediateStop.create({
      data: {
        frequency: { connect: { id: frequencies[0].id } },
        city: { connect: { id: cities[3].id } }, // Santo Domingo
        order: 1
      }
    }),
    prisma.intermediateStop.create({
      data: {
        frequency: { connect: { id: frequencies[0].id } },
        city: { connect: { id: cities[4].id } }, // Manta
        order: 2
      }
    }),
    
    // Paradas para Guayaquil - Cuenca
    prisma.intermediateStop.create({
      data: {
        frequency: { connect: { id: frequencies[1].id } },
        city: { connect: { id: cities[5].id } }, // Ambato
        order: 1
      }
    })
  ]);

  Logger.log('¡Semilla completada exitosamente!');
}

main()
  .catch((e) => {
    console.error('Error en la semilla:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
