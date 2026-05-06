import { ExecutionContext, Type } from "@nestjs/common";
import { AuthenticatedActor } from "./auth.interface";

export interface IPolicyHandler {
    /**
   * @param actor The normalized user/service
   * @param context The NestJS ExecutionContext (gives access to Request, Params, etc.)
   */
    handle(actor: AuthenticatedActor, context: ExecutionContext): boolean | Promise<boolean>;

}

// Allow users to pass a class OR a simple functional callback
export type Policy =
    | Type<IPolicyHandler>
    | ((actor: AuthenticatedActor, context: ExecutionContext) => boolean | Promise<boolean>);
