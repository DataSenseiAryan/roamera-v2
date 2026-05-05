import { z } from 'zod';

export const IdSchema = z.object({
  id: z.string().uuid(),
});

export const CursorSchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const PaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const SuccessResponseSchema = z.object({
  success: z.literal(true),
  message: z.string().optional(),
});

export const ErrorResponseSchema = z.object({
  success: z.literal(false),
  error: z.string(),
  code: z.string().optional(),
});

export type Id = z.infer<typeof IdSchema>;
export type Cursor = z.infer<typeof CursorSchema>;
export type Pagination = z.infer<typeof PaginationSchema>;
export type SuccessResponse = z.infer<typeof SuccessResponseSchema>;
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
