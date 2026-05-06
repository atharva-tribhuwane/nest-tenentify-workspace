import { Injectable } from "@nestjs/common";
import { AsyncLocalStorage } from "async_hooks";

@Injectable()
export class TenantContext {
  private static readonly storage = new AsyncLocalStorage<Map<string, any>>();

  /**
   * Updated to accept string | number to match the AuthenticatedActor interface
   */
  run<T>(tenantId: string | number, callback: () => T | Promise<T>): T | Promise<T> {
    const store = new Map().set('tenantId', tenantId);
    return TenantContext.storage.run(store, callback);
  }

  getTenantId(): string | number | undefined {
    const store = TenantContext.storage.getStore();
    return store?.get('tenantId');
  }

  getTenantIdOrThrow(): string | number {
    const id = this.getTenantId();
    if (id === undefined) {
      throw new Error('Operation attempted outside of a valid Tenant Context');
    }
    return id;
  }
}