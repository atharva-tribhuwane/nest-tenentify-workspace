/**
 * The Core Identity Model
 * Using generics devs can pass their own enums or unions, 
 * to allow flexibility and IDE autocomplete support.
 */
export interface AuthenticatedActor<
  TRole = string,
  TPermission = string, // Fixed typo: 'm' to 'n'
  TTenantId = string | number,
  TAttributes = Record<string, unknown>
> {
  /** Unique Identifier for the user */
  id: string;

  /** The type of actor: 'user', 'service', etc. */
  type: string;

  /** 
   * The Tenant context this actor belongs to.
   * Fixed naming: changed 'tenantID' to 'tenantId' to match Guard logic.
   */
  tenantId: TTenantId;

  /** Array of roles (e.g., UserRoles.ADMIN) */
  roles: TRole[];

  /** Array of granular permissions (e.g., 'reports:write') */
  permissions: TPermission[];

  /** 
   * Dynamic metadata for ABAC evaluation.
   * e.g., { department: 'finance', clearLevel: 5 }
   */
  attributes: TAttributes;
}

/**
 * Strategy Interface
 * Every auth method (JWT, API Key) must satisfy this contract.
 */
export interface IAuthStrategy<T extends AuthenticatedActor<any, any, any, any> = AuthenticatedActor<any, any, any, any>> {
  /** Unique name to identify the strategy (e.g., 'jwt', 'api-key') */
  readonly name: string;

  /**
   * Orchestrates the authentication logic.
   * Returns a normalized Actor or null if the strategy doesn't apply.
   */
  authenticate(request: unknown): Promise<T | null>;
}