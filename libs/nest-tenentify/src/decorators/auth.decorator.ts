import { SetMetadata, CustomDecorator } from "@nestjs/common";
import { ROLES_KEY, PERMISSIONS_KEY } from "../constants/metadata.constants";

/**
 * RBAC Decorator
 */
export const RequireRoles = <T = string>(...roles: T[]): CustomDecorator =>
    SetMetadata(ROLES_KEY, roles);

/**
 * Granular Permission Decorator
 */
export const RequirePermissions = <T = string>(...permissions: T[]): CustomDecorator =>
    SetMetadata(PERMISSIONS_KEY, permissions);