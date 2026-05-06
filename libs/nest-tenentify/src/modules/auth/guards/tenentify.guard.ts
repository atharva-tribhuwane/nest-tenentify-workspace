import { CanActivate, ExecutionContext, ForbiddenException, Inject, Injectable, UnauthorizedException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { STRATEGY_REGISTRY } from "tenentify/nest-tenentify/constants";
import { CHECK_POLICIES_KEY, PERMISSIONS_KEY, ROLES_KEY } from "tenentify/nest-tenentify/constants/metadata.constants";
import { AuthenticatedActor, IAuthStrategy } from "tenentify/nest-tenentify/interfaces/auth.interface";
import { Policy } from "tenentify/nest-tenentify/interfaces/policy.interface";

@Injectable()
export class TenentifyGuard implements CanActivate {
    constructor(
        private readonly reflector: Reflector,
        @Inject(STRATEGY_REGISTRY) private readonly strategies: IAuthStrategy[]
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();

        // 1. AUTHENTICATION PHASE
        const actor = await this.authenticateRequest(request);
        if (!actor) throw new UnauthorizedException();

        request['actor'] = actor; // Attach for @CurrentActor()

        // 2. RBAC PHASE (Roles)
        const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (requiredRoles && !requiredRoles.some((role) => actor.roles?.includes(role))) {
            throw new ForbiddenException('Insufficient Role Level');
        }

        // 3. PERMISSION PHASE (ABAC Lite)
        const requiredPermissions = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (requiredPermissions && !requiredPermissions.every((perm) => actor.permissions?.includes(perm))) {
            throw new ForbiddenException('Missing Required Permissions');
        }

        const policies = this.reflector.getAllAndOverride<Policy[]>(CHECK_POLICIES_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (policies) {
            for (const policy of policies) {
                const result = typeof policy === 'function'
                    ? await policy(actor, context)
                    : await policy.handle(actor, context);

                if (!result) {
                    throw new ForbiddenException('Policy Requirement Not Met');
                }
            }
        }
        return true;
    }

    private async authenticateRequest(request: any): Promise<AuthenticatedActor | null> {
        for (const strategy of this.strategies) {
            const actor = await strategy.authenticate(request);
            if (actor) return actor;
        }
        return null;
    }
}