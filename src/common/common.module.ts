import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [],
    providers: [],
    exports: [PrismaModule],
})
export class CommonModule {}
