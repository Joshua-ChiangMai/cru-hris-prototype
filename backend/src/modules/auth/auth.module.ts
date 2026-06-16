import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PermissionsService } from './permissions.service';

@Module({
  controllers: [AuthController],
  providers: [AuthService, PermissionsService],
  exports: [AuthService, PermissionsService],
})
export class AuthModule {}
