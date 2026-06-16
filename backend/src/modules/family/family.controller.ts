import { Controller, Get, Param, Query, Req } from '@nestjs/common';
import { Request } from 'express';
import { PERMISSIONS } from '../../common/constants/permissions';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { AuthUser } from '../../common/interfaces/auth-user.interface';
import { ListFamiliesQueryDto } from './dto/list-families-query.dto';
import { FamilyService } from './family.service';

@Controller('families')
export class FamilyController {
  constructor(private readonly familyService: FamilyService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.employeeView)
  listFamilies(
    @Query() query: ListFamiliesQueryDto,
    @Req() request: Request,
  ) {
    return this.familyService.listFamilies(
      query,
      request.user as AuthUser,
    );
  }

  @Get('me')
  @RequirePermissions(PERMISSIONS.employeeView)
  getMyFamily(@Req() request: Request) {
    return this.familyService.getMyFamily(request.user as AuthUser);
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.employeeView)
  getFamilyById(@Param('id') id: string, @Req() request: Request) {
    return this.familyService.getFamilyById(id, request.user as AuthUser);
  }
}
