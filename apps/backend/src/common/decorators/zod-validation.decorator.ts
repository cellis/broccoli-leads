import { UsePipes } from '@nestjs/common';
import { ZodValidationPipe } from '../pipes/zod-validation.pipe';
import type { ZodSchema } from 'zod';

export function UseZodValidation(schema: ZodSchema) {
  return UsePipes(new ZodValidationPipe(schema));
}
