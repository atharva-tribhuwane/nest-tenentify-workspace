/**
 * The Core Identity Model
 * Using generics devs can pass thier own enums or unions, to allow fexibility and ides autocomplete support
 */

export interface AuthenticatedActor<
  TRole = string,
  TPermissiom = string,
  TTenantId = string | number,
  TAttributes = Record<string, any>
> {
  /** Unique Identifier for the user */
  id: string;

  /** The Tenant context this actor belongs to */
  type: string;

  /** The Tenant context this actor belongs to */
  tenantID: TTenantId;

  /** Array of roles (e.g., UserRoles.ADMIN) */
  roles: TRole[];

  /** Array of granular permissions (e.g., 'reports:write') */
  permissions: TPermissiom[];

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
export interface IAuthStrategy<T extends AuthenticatedActor = AuthenticatedActor> {
  /** Unique name to identify the strategy (e.g., 'jwt', 'api-key') */
  readonly name: string;
  
  /**
   * Orchestrates the authentication logic.
   * Returns a normalized Actor or null if the strategy doesn't apply.
   */
  authenticate(request: any): Promise<T | null>;
}