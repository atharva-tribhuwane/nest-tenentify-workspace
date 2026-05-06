# nest-tenentify

A small, **production-minded** multi-tenant + auth toolkit for NestJS:

- **Authentication orchestration** via pluggable strategies (`IAuthStrategy`)
- **RBAC** via `@RequireRoles(...)`
- **Permission checks** via `@RequirePermissions(...)`
- **Policy checks (ABAC / custom rules)** via `@CheckPolicies(...)` (function or DI class)
- **Tenant context** via `AsyncLocalStorage` (`TenantContext`)

## Install

```bash
npm i nest-tenentify
```

## Setup

Register the module and provide your strategy classes:

```ts
import { Module } from "@nestjs/common";
import { NestTenentifyModule } from "nest-tenentify";
import { JwtAuthStrategy } from "./auth/jwt.strategy";

@Module({
  imports: [
    NestTenentifyModule.register({
      strategies: [JwtAuthStrategy],
      // applies TenentifyGuard globally if true
      isGlobalGuard: true,
    }),
  ],
})
export class AppModule {}
```

If you don’t want a global guard, set `isGlobalGuard: false` and apply it per-route:

```ts
import { Controller, Get, UseGuards } from "@nestjs/common";
import { TenentifyGuard } from "nest-tenentify";

@Controller("reports")
@UseGuards(TenentifyGuard)
export class ReportsController {
  @Get()
  list() {
    return { ok: true };
  }
}
```

## Writing a strategy (`IAuthStrategy`)

A strategy should:
- return an `AuthenticatedActor` when it can authenticate the request
- return `null` when it does not apply (so another strategy can try)

```ts
import { Injectable } from "@nestjs/common";
import { AuthenticatedActor, IAuthStrategy } from "nest-tenentify";

@Injectable()
export class ApiKeyStrategy implements IAuthStrategy {
  readonly name = "api-key";

  async authenticate(request: unknown): Promise<AuthenticatedActor | null> {
    const req = request as { headers?: Record<string, string | undefined> };
    const apiKey = req.headers?.["x-api-key"];
    if (!apiKey) return null;

    // validate apiKey...
    return {
      id: "svc_123",
      type: "service",
      tenantId: "tenant_1",
      roles: ["SERVICE"],
      permissions: ["reports:read"],
      attributes: {},
    };
  }
}
```

## Decorators

### `@CurrentActor()`

```ts
import { Controller, Get } from "@nestjs/common";
import { AuthenticatedActor, CurrentActor } from "nest-tenentify";

@Controller("me")
export class MeController {
  @Get()
  me(@CurrentActor() actor: AuthenticatedActor) {
    return actor;
  }
}
```

### `@RequireRoles(...)`

```ts
import { Controller, Get } from "@nestjs/common";
import { RequireRoles } from "nest-tenentify";

@Controller("admin")
export class AdminController {
  @Get()
  @RequireRoles("ADMIN")
  adminOnly() {
    return { ok: true };
  }
}
```

### `@RequirePermissions(...)`

```ts
import { Controller, Post } from "@nestjs/common";
import { RequirePermissions } from "nest-tenentify";

@Controller("reports")
export class ReportsController {
  @Post()
  @RequirePermissions("reports:write")
  create() {
    return { ok: true };
  }
}
```

## Policies (`@CheckPolicies(...)`)

Policies can be:
- a **function** policy: `(actor, context) => boolean | Promise<boolean>`
- a **class** policy handler: `class X implements IPolicyHandler { handle(...) }` (DI-friendly)

### Function policy

```ts
import type { ExecutionContext } from "@nestjs/common";
import { AuthenticatedActor, CheckPolicies } from "nest-tenentify";

const isInternalUser = (actor: AuthenticatedActor, _ctx: ExecutionContext) =>
  actor.attributes?.["isInternal"] === true;

@CheckPolicies(isInternalUser)
```

### Class policy (recommended)

```ts
import { Injectable, ExecutionContext } from "@nestjs/common";
import { AuthenticatedActor, CheckPolicies, IPolicyHandler } from "nest-tenentify";

@Injectable()
export class CanReadBillingPolicy implements IPolicyHandler {
  async handle(actor: AuthenticatedActor, _ctx: ExecutionContext): Promise<boolean> {
    return actor.permissions.includes("billing:read");
  }
}

// Ensure CanReadBillingPolicy is provided in your module
@CheckPolicies(CanReadBillingPolicy)
```

## Tenant context (`TenantContext`)

Read the tenant id inside services/repositories:

```ts
import { Injectable } from "@nestjs/common";
import { TenantContext } from "nest-tenentify";

@Injectable()
export class OrdersService {
  constructor(private readonly tenantContext: TenantContext) {}

  async listOrders() {
    const tenantId = this.tenantContext.getTenantIdOrThrow();
    return { tenantId };
  }
}
```

## Public API

```ts
import {
  NestTenentifyModule,
  TenentifyGuard,
  TenantContext,
  CurrentActor,
  RequireRoles,
  RequirePermissions,
  CheckPolicies,
  AuthenticatedActor,
  IAuthStrategy,
  IPolicyHandler,
} from "nest-tenentify";
```

