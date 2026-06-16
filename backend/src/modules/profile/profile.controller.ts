import { Body, Controller, Get, Param, Patch, Req } from '@nestjs/common';
import { Request } from 'express';
import { PERMISSIONS } from '../../common/constants/permissions';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { AuthUser } from '../../common/interfaces/auth-user.interface';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ProfileService } from './profile.service';

@Controller('employees')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get('me/profile')
  @RequirePermissions(PERMISSIONS.employeeView)
  getMyProfile(@Req() request: Request) {
    return this.profileService.getMyProfile(request.user as AuthUser);
  }

  @Patch('me/profile')
  @RequirePermissions(PERMISSIONS.employeeEdit)
  updateMyProfile(@Body() payload: UpdateProfileDto, @Req() request: Request) {
    return this.profileService.updateMyProfile(payload, request.user as AuthUser);
  }

  @Get(':id/profile')
  @RequirePermissions(PERMISSIONS.employeeView)
  getProfile(@Param('id') id: string, @Req() request: Request) {
    return this.profileService.getProfile(id, request.user as AuthUser);
  }

  @Patch(':id/profile')
  @RequirePermissions(PERMISSIONS.employeeEdit)
  updateProfile(
    @Param('id') id: string,
    @Body() payload: UpdateProfileDto,
    @Req() request: Request,
  ) {
    return this.profileService.updateProfile(id, payload, request.user as AuthUser);
  }
}
