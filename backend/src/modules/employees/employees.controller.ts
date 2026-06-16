import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { RoleCode } from '@prisma/client';
import { PERMISSIONS } from '../../common/constants/permissions';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { RequireScope } from '../../common/decorators/scope.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { AuthUser } from '../../common/interfaces/auth-user.interface';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { ListEmployeesQueryDto } from './dto/list-employees-query.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { EmployeesService } from './employees.service';

@Controller('employees')
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.employeeView)
  listEmployees(
    @Query() query: ListEmployeesQueryDto,
    @Req() request: Request,
  ) {
    return this.employeesService.listEmployees(
      query,
      request.user as AuthUser,
    );
  }

  @Get('me')
  @RequirePermissions(PERMISSIONS.employeeView)
  getMe(@Req() request: Request) {
    return this.employeesService.getMe(request.user as AuthUser);
  }

  @Get('cities')
  @RequirePermissions(PERMISSIONS.employeeView)
  listCities(@Req() request: Request) {
    return this.employeesService.listCitiesForFilter(request.user as AuthUser);
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.employeeView)
  getEmployeeById(@Param('id') id: string, @Req() request: Request) {
    return this.employeesService.getEmployeeById(id, request.user as AuthUser);
  }

  @Post()
  @Roles(RoleCode.HR, RoleCode.ADMIN)
  @RequireScope('CITY', 'ALL')
  @RequirePermissions(PERMISSIONS.employeeEdit)
  createEmployee(@Body() payload: CreateEmployeeDto, @Req() request: Request) {
    return this.employeesService.createEmployee(
      payload,
      request.user as AuthUser,
    );
  }

  @Patch(':id')
  @RequirePermissions(PERMISSIONS.employeeEdit)
  updateEmployee(
    @Param('id') id: string,
    @Body() payload: UpdateEmployeeDto,
    @Req() request: Request,
  ) {
    return this.employeesService.updateEmployee(
      id,
      payload,
      request.user as AuthUser,
    );
  }
}
