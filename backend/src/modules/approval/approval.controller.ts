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
import { ApprovalService } from './approval.service';
import { CreateUpdateRequestDto } from './dto/create-update-request.dto';
import { ListApprovalQueryDto } from './dto/list-approval-query.dto';
import { RejectRequestDto } from './dto/reject-request.dto';
import { ReviewRequestDto } from './dto/review-request.dto';
import { UpdateFamilyDto } from '../family/dto/update-family.dto';
import { SubmitProfileUpdateRequestDto } from '../profile/dto/submit-profile-update-request.dto';
import { SubmitChangeRequestDto } from './dto/submit-change-request.dto';
import { SubmitSensitiveUpdateRequestDto } from './dto/submit-sensitive-update-request.dto';

@Controller('approval')
export class ApprovalController {
  constructor(private readonly approvalService: ApprovalService) {}

  @Get('requests')
  @RequirePermissions(PERMISSIONS.approvalView)
  listRequests(
    @Query() query: ListApprovalQueryDto,
    @Req() request: Request,
  ) {
    return this.approvalService.listRequests(query, request.user as AuthUser);
  }

  @Post('requests/changes')
  @RequirePermissions(PERMISSIONS.employeeEdit)
  submitChangeRequest(
    @Body() payload: SubmitChangeRequestDto,
    @Req() request: Request,
  ) {
    return this.approvalService.submitChangeRequest(
      payload,
      request.user as AuthUser,
      this.auditFromRequest(request),
    );
  }

  @Post('requests/family')
  @RequirePermissions(PERMISSIONS.employeeEdit)
  submitFamilyUpdate(
    @Body()
    payload: {
      targetEmployeeId: string;
      family: UpdateFamilyDto;
      comment?: string;
    },
    @Req() request: Request,
  ) {
    return this.approvalService.submitFamilyUpdate(
      payload.targetEmployeeId,
      payload.family,
      request.user as AuthUser,
      this.auditFromRequest(request),
      payload.comment,
    );
  }

  @Post('requests/profile')
  @RequirePermissions(PERMISSIONS.employeeEdit)
  submitProfileUpdate(
    @Body() payload: SubmitProfileUpdateRequestDto,
    @Req() request: Request,
  ) {
    return this.approvalService.submitProfileUpdate(
      payload,
      request.user as AuthUser,
      this.auditFromRequest(request),
    );
  }

  @Post('requests/sensitive')
  @RequirePermissions(PERMISSIONS.employeeEdit)
  submitSensitiveUpdate(
    @Body() payload: SubmitSensitiveUpdateRequestDto,
    @Req() request: Request,
  ) {
    return this.approvalService.submitSensitiveUpdate(
      payload,
      request.user as AuthUser,
      this.auditFromRequest(request),
    );
  }

  @Post('requests')
  @RequirePermissions(PERMISSIONS.employeeEdit)
  createRequest(@Body() payload: CreateUpdateRequestDto, @Req() request: Request) {
    return this.approvalService.createRequest(
      payload,
      request.user as AuthUser,
      this.auditFromRequest(request),
    );
  }

  @Get('requests/:id')
  @RequirePermissions(PERMISSIONS.approvalView)
  getRequest(@Param('id') id: string, @Req() request: Request) {
    return this.approvalService.getRequestById(id, request.user as AuthUser);
  }

  @Post('requests/:id/approve')
  @RequireScope('CITY', 'ALL')
  @RequirePermissions(PERMISSIONS.approvalApprove)
  approve(
    @Param('id') requestId: string,
    @Body() payload: ReviewRequestDto,
    @Req() request: Request,
  ) {
    return this.approvalService.approveRequest(
      requestId,
      payload,
      request.user as AuthUser,
      this.auditFromRequest(request),
    );
  }

  @Post('requests/:id/reject')
  @RequireScope('CITY', 'ALL')
  @RequirePermissions(PERMISSIONS.approvalApprove)
  reject(
    @Param('id') requestId: string,
    @Body() payload: RejectRequestDto,
    @Req() request: Request,
  ) {
    return this.approvalService.rejectRequest(
      requestId,
      payload,
      request.user as AuthUser,
      this.auditFromRequest(request),
    );
  }

  @Post('requests/:id/cancel')
  @RequirePermissions(PERMISSIONS.approvalView)
  cancel(
    @Param('id') requestId: string,
    @Body() payload: ReviewRequestDto,
    @Req() request: Request,
  ) {
    return this.approvalService.cancelRequest(
      requestId,
      payload,
      request.user as AuthUser,
      this.auditFromRequest(request),
    );
  }

  private auditFromRequest(request: Request) {
    return {
      ipAddress: request.ip,
      userAgent: request.headers['user-agent'],
      correlationId: request.headers['x-correlation-id'] as string | undefined,
    };
  }
}
