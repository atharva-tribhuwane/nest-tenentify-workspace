import {
    CanActivate,
    ExecutionContext,
    ForbiddenException,
    Inject,
    Injectable,
    Type,
    UnauthorizedException,
} from "@nestjs/common";
import { ModuleRef, Reflector } from "@nestjs/core";
import { STRATEGY_REGISTRY } from "../../../constants";
import {
    CHECK_POLICIES_KEY,
    PERMISSIONS_KEY,
    ROLES_KEY,
} from "../../../constants/metadata.constants";
import {
    AuthenticatedActor,
    IAuthStrategy,
} from "../../../interfaces/auth.interface";
import {
    IPolicyHandler,
    Policy,
} from "../../../interfaces/policy.interface";
import { TenantContext } from "../../../tenent/tenent-context.service";

type TenentifyRequest = Record<string, unknown> & {
    actor?: AuthenticatedActor;
};

function isPolicyHandlerClass(value: Policy): value is Type<IPolicyHandler> {
    if (typeof value !== "function") return false;
    const proto = (value as unknown as { prototype?: unknown }).prototype as
        | { handle?: unknown }
        | undefined;
    return typeof proto?.handle === "function";
}

@Injectable()
export class TenentifyGuard implements CanActivate {
    constructor(
        private readonly reflector: Reflector,
        private readonly tenantContext: TenantContext,
        private readonly moduleRef: ModuleRef,
        @Inject(STRATEGY_REGISTRY) private readonly strategies: IAuthStrategy[]
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest<TenentifyRequest>();

        // 1. AUTHENTICATION PHASE
        const actor = await this.authenticateRequest(request);
        if (!actor) throw new UnauthorizedException();

        request.actor = actor; // Attach for @CurrentActor()

        return this.tenantContext.run(actor.tenantId, async () => {
            await this.verifyRoles(context, actor);
            await this.verifyPermissions(context, actor);
            await this.verifyPolicies(context, actor);
            return true;
        });
    }

    private async authenticateRequest(
        request: TenentifyRequest
    ): Promise<AuthenticatedActor | null> {
        for (const strategy of this.strategies) {
            try {
                const actor = await strategy.authenticate(request);
                if (actor) return actor;
            } catch {
                continue;
            }
        }
        return null;
    }

    private async verifyRoles(
        context: ExecutionContext,
        actor: AuthenticatedActor<any, any, any, any>
    ): Promise<void> {
        const roles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (roles?.length && !roles.some((role) => actor.roles?.includes(role))) {
            throw new ForbiddenException("Access Denied: Insufficient Role Level");
        }
    }

    private async verifyPermissions(
        context: ExecutionContext,
        actor: AuthenticatedActor
    ): Promise<void> {
        const permissions = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (
            permissions?.length &&
            !permissions.every((p) => actor.permissions?.includes(p))
        ) {
            throw new ForbiddenException("Access Denied: Missing Required Permissions");
        }
    }

    private async verifyPolicies(
        context: ExecutionContext,
        actor: AuthenticatedActor
    ): Promise<void> {
        const policies = this.reflector.getAllAndOverride<Policy[]>(
            CHECK_POLICIES_KEY,
            [context.getHandler(), context.getClass()]
        );

        if (!policies) return;

        for (const policy of policies) {
            let result: boolean;

            if (isPolicyHandlerClass(policy)) {
                // Resolve the class instance from the DI container
                const policyClass = policy;
                const handler = await this.moduleRef.get(policyClass, { strict: false });
                result = await handler.handle(actor, context);
            } else {
                result = await policy(actor, context);
            }

            if (!result) {
                throw new ForbiddenException("Access Denied: Policy Requirement Not Met");
            }
        }
    }
}