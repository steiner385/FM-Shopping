type ShoppingErrorCode = 
  | 'VALIDATION_ERROR'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'LIST_NOT_FOUND'
  | 'ITEM_NOT_FOUND'
  | 'USER_NOT_FOUND'
  | 'FAMILY_NOT_FOUND'
  | 'DUPLICATE_ITEM'
  | 'INVALID_QUANTITY'
  | 'INVALID_STATUS'
  | 'LIST_ITEM_NOT_FOUND'
  | 'INTERNAL_ERROR';

interface ShoppingErrorParams {
  code: ShoppingErrorCode;
  message: string;
  entity?: string;
  details?: unknown;
}

export class ShoppingError extends Error {
  readonly code: ShoppingErrorCode;
  readonly entity: string;
  readonly details?: unknown;
  readonly statusCode: number;

  constructor({ code, message, entity = 'SHOPPING', details }: ShoppingErrorParams) {
    super(message);
    this.name = 'ShoppingError';
    this.code = code;
    this.entity = entity;
    this.details = details;

    // Map error codes to HTTP status codes
    this.statusCode = {
      'VALIDATION_ERROR': 400,
      'UNAUTHORIZED': 401,
      'FORBIDDEN': 403,
      'NOT_FOUND': 404,
      'LIST_NOT_FOUND': 404,
      'ITEM_NOT_FOUND': 404,
      'USER_NOT_FOUND': 404,
      'FAMILY_NOT_FOUND': 404,
      'DUPLICATE_ITEM': 400,
      'INVALID_QUANTITY': 400,
      'INVALID_STATUS': 400,
      'LIST_ITEM_NOT_FOUND': 404,
      'INTERNAL_ERROR': 500
    }[code];

    // Capture stack trace
    Error.captureStackTrace(this, ShoppingError);
  }

  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      entity: this.entity,
      details: this.details,
      statusCode: this.statusCode
    };
  }
}
