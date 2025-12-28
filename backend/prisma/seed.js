import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create sectors
  const sectors = await Promise.all([
    prisma.sector.upsert({
      where: { id: 'sector-clinico-geral' },
      update: {},
      create: {
        id: 'sector-clinico-geral',
        name: 'Clínico Geral',
        room: 'Sala 101',
        type: 'CONSULTATION'
      }
    }),
    prisma.sector.upsert({
      where: { id: 'sector-pediatria' },
      update: {},
      create: {
        id: 'sector-pediatria',
        name: 'Pediatria',
        room: 'Sala 102',
        type: 'CONSULTATION'
      }
    }),
    prisma.sector.upsert({
      where: { id: 'sector-cardiologia' },
      update: {},
      create: {
        id: 'sector-cardiologia',
        name: 'Cardiologia',
        room: 'Sala 103',
        type: 'CONSULTATION'
      }
    }),
    prisma.sector.upsert({
      where: { id: 'sector-pronto-socorro' },
      update: {},
      create: {
        id: 'sector-pronto-socorro',
        name: 'Pronto Socorro',
        room: 'PS - Sala 1',
        type: 'EMERGENCY'
      }
    }),
    prisma.sector.upsert({
      where: { id: 'sector-ortopedia' },
      update: {},
      create: {
        id: 'sector-ortopedia',
        name: 'Ortopedia',
        room: 'Sala 104',
        type: 'CONSULTATION'
      }
    })
  ]);

  console.log('Sectors created:', sectors.length);

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@clinica.com' },
    update: {},
    create: {
      name: 'Administrador',
      email: 'admin@clinica.com',
      password: hashedPassword,
      role: 'ADMIN'
    }
  });

  console.log('Admin created:', admin.email);

  // Create receptionist users
  const receptionistPassword = await bcrypt.hash('recep123', 10);

  const receptionist1 = await prisma.user.upsert({
    where: { email: 'recepcionista1@clinica.com' },
    update: {},
    create: {
      name: 'Maria Recepcionista',
      email: 'recepcionista1@clinica.com',
      password: receptionistPassword,
      role: 'RECEPTIONIST',
      desk: 'Guichê 1'
    }
  });

  const receptionist2 = await prisma.user.upsert({
    where: { email: 'recepcionista2@clinica.com' },
    update: {},
    create: {
      name: 'João Recepcionista',
      email: 'recepcionista2@clinica.com',
      password: receptionistPassword,
      role: 'RECEPTIONIST',
      desk: 'Guichê 2'
    }
  });

  console.log('Receptionists created:', 2);

  // Create doctor users
  const doctorPassword = await bcrypt.hash('doctor123', 10);

  const doctors = await Promise.all([
    prisma.user.upsert({
      where: { email: 'dr.silva@clinica.com' },
      update: {},
      create: {
        name: 'Dr. Carlos Silva',
        email: 'dr.silva@clinica.com',
        password: doctorPassword,
        role: 'DOCTOR',
        sectorId: 'sector-clinico-geral'
      }
    }),
    prisma.user.upsert({
      where: { email: 'dra.santos@clinica.com' },
      update: {},
      create: {
        name: 'Dra. Ana Santos',
        email: 'dra.santos@clinica.com',
        password: doctorPassword,
        role: 'DOCTOR',
        sectorId: 'sector-pediatria'
      }
    }),
    prisma.user.upsert({
      where: { email: 'dr.oliveira@clinica.com' },
      update: {},
      create: {
        name: 'Dr. Pedro Oliveira',
        email: 'dr.oliveira@clinica.com',
        password: doctorPassword,
        role: 'DOCTOR',
        sectorId: 'sector-cardiologia'
      }
    }),
    prisma.user.upsert({
      where: { email: 'dr.costa@clinica.com' },
      update: {},
      create: {
        name: 'Dr. Fernando Costa',
        email: 'dr.costa@clinica.com',
        password: doctorPassword,
        role: 'DOCTOR',
        sectorId: 'sector-pronto-socorro'
      }
    })
  ]);

  console.log('Doctors created:', doctors.length);

  console.log('Seed completed!');
  console.log('\n--- Login Credentials ---');
  console.log('Admin: admin@clinica.com / admin123');
  console.log('Recepcionista: recepcionista1@clinica.com / recep123');
  console.log('Médico: dr.silva@clinica.com / doctor123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
