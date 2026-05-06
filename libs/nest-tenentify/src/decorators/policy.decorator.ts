import { SetMetadata } from '@nestjs/common';
import { CHECK_POLICIES_KEY } from '../constants/metadata.constants';
import { Policy } from '../interfaces/policy.interface';

export const CheckPolicies = (...policies: Policy[]) =>
    SetMetadata(CHECK_POLICIES_KEY, policies);