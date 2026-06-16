import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AuthUser } from '../../common/interfaces/auth-user.interface';
import { RbacService } from '../../common/services/rbac.service';

/** Approval queue scope filters — delegates to {@link RbacService}. */
@Injectable()
export class ApprovalScopeService {
  constructor(private readonly rbac: RbacService) {}

  buildListWhere(authUser: AuthUser): Promise<Prisma.UpdateRequestWhereInput> {
    return this.rbac.buildUpdateRequestWhere(authUser);
  }

  assertCanAccessRequest(
    authUser: AuthUser,
    request: {
      cityId: string;
      requesterEmployeeId: string;
      requester?: { userId: string | null };
    },
  ) {
    return this.rbac.assertCanAccessUpdateRequest(authUser, request);
  }

  canReview(authUser: AuthUser): boolean {
    return this.rbac.canReviewApprovals(authUser);
  }
}
