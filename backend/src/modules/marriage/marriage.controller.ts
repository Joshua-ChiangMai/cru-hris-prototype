import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { PERMISSIONS } from '../../common/constants/permissions';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { RequireScope } from '../../common/decorators/scope.decorator';
import { AuthUser } from '../../common/interfaces/auth-user.interface';
import { ListMarriageRequestsQueryDto } from './dto/list-marriage-requests-query.dto';
import { RejectMarriageRequestDto } from './dto/reject-marriage-request.dto';
import { SubmitMarriageRequestDto } from './dto/submit-marriage-request.dto';
import { MarriageService } from './marriage.service';

@Controller('marriage')
export class MarriageController {
  constructor(private readonly marriageService: MarriageService) {}

  @Get('requests/me')
  @RequirePermissions(PERMISSIONS.employeeView)
  listMyRequests(
    @Query() query: ListMarriageRequestsQueryDto,
    @Req() request: Request,
  ) {
    return this.marriageService.listMyRequests(
      query,
      request.user as AuthUser,
    );
  }

  @Get('requests/queue')
  @RequireScope('CITY', 'ALL')
  @RequirePermissions(PERMISSIONS.approvalApprove)
  listApprovalQueue(
    @Query() query: ListMarriageRequestsQueryDto,
    @Req() request: Request,
  ) {
    return this.marriageService.listApprovalQueue(
      query,
      request.user as AuthUser,
    );
  }

  @Get('eligible-spouses')
  @RequirePermissions(PERMISSIONS.employeeView)
  listEligibleSpouses(
    @Query('search') search: string | undefined,
    @Req() request: Request,
  ) {
    return this.marriageService.listEligibleSpouses(
      request.user as AuthUser,
      search,
    );
  }

  @Get('requests/:id')
  @RequirePermissions(PERMISSIONS.employeeView)
  getRequestById(@Param('id') id: string, @Req() request: Request) {
    return this.marriageService.getRequestById(id, request.user as AuthUser);
  }

  @Post('requests')
  @RequirePermissions(PERMISSIONS.employeeEdit)
  submitRequest(
    @Body() payload: SubmitMarriageRequestDto,
    @Req() request: Request,
  ) {
    return this.marriageService.submitRequest(
      payload,
      request.user as AuthUser,
    );
  }

  @Post('requests/:id/approve')
  @RequireScope('CITY', 'ALL')
  @RequirePermissions(PERMISSIONS.approvalApprove)
  approveRequest(@Param('id') id: string, @Req() request: Request) {
    return this.marriageService.approveRequest(id, request.user as AuthUser);
  }

  @Post('requests/:id/reject')
  @RequireScope('CITY', 'ALL')
  @RequirePermissions(PERMISSIONS.approvalApprove)
  rejectRequest(
    @Param('id') id: string,
    @Body() payload: RejectMarriageRequestDto,
    @Req() request: Request,
  ) {
    return this.marriageService.rejectRequest(
      id,
      payload,
      request.user as AuthUser,
    );
  }

  @Post('requests/:id/cancel')
  @RequirePermissions(PERMISSIONS.employeeView)
  cancelRequest(@Param('id') id: string, @Req() request: Request) {
    return this.marriageService.cancelRequest(id, request.user as AuthUser);
  }
}
