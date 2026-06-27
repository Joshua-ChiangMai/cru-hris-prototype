import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { validateEnv } from './config/env.validation';
import { APP_GUARD } from '@nestjs/core';
import { ApprovalModule } from './modules/approval/approval.module';
import { AuditModule } from './modules/audit/audit.module';
import { AuthModule } from './modules/auth/auth.module';
import { EmployeesModule } from './modules/employees/employees.module';
import { FamilyModule } from './modules/family/family.module';
import { MarriageModule } from './modules/marriage/marriage.module';
import { ProfileModule } from './modules/profile/profile.module';
import { ReportsModule } from './modules/reports/reports.module';
import { TrainingModule } from './modules/training/training.module';
import { UsersModule } from './modules/users/users.module';
import { AuthContextGuard } from './common/guards/auth-context.guard';
import { CityAccessGuard } from './common/guards/city-access.guard';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { PermissionsGuard } from './common/guards/permissions.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { ScopeGuard } from './common/guards/scope.guard';
import { CommonModule } from './common/common.module';
import { JwtInfraModule } from './common/modules/jwt-infra.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
    CommonModule,
    JwtInfraModule,
    PrismaModule,
    AuthModule,
    UsersModule,
    EmployeesModule,
    ApprovalModule,
    AuditModule,
    FamilyModule,
    MarriageModule,
    ProfileModule,
    TrainingModule,
    ReportsModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: AuthContextGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard },
    { provide: APP_GUARD, useClass: ScopeGuard },
    { provide: APP_GUARD, useClass: CityAccessGuard },
  ],
})
export class AppModule {}
