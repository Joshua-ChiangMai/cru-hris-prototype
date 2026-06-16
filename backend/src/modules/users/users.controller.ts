import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { RoleCode } from '@prisma/client';
import { PERMISSIONS } from '../../common/constants/permissions';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { RequireScope } from '../../common/decorators/scope.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { AuthUser } from '../../common/interfaces/auth-user.interface';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserRolesDto } from './dto/update-user-roles.dto';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.userView)
  @RequireScope('CITY', 'ALL')
  listUsers(@CurrentUser() user: AuthUser) {
    return this.usersService.listUsers(user);
  }

  @Post()
  @Roles(RoleCode.ADMIN)
  @RequireScope('ALL')
  @RequirePermissions(PERMISSIONS.userEdit)
  createUser(@Body() payload: CreateUserDto) {
    return this.usersService.createUser(payload);
  }

  @Patch(':id/roles')
  @RequireScope('CITY', 'ALL')
  @RequirePermissions(PERMISSIONS.userEdit)
  updateUserRoles(
    @Param('id') userId: string,
    @Body() payload: UpdateUserRolesDto,
  ) {
    return this.usersService.updateUserRoles(userId, payload);
  }
}
