import { z } from 'zod';
import type { PaginationQuery, AlertAction, RevokeEntitlementRequest, NotificationPreferences, RevenueCatCredentials, AppRegistration } from '@refundradar/shared';
import {
  PaginationQuerySchema,
  AlertActionSchema,
  RevokeEntitlementSchema,
  NotificationPreferencesSchema,
  RevenueCatCredentialsSchema,
  AppRegistrationSchema,
} from '@refundradar/shared';

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const signupSchema = loginSchema.extend({
  full_name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const resetPasswordSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

// Re-export shared schemas
export {
  PaginationQuerySchema,
  AlertActionSchema,
  RevokeEntitlementSchema,
  NotificationPreferencesSchema,
  RevenueCatCredentialsSchema,
  AppRegistrationSchema,
};

export type {
  PaginationQuery,
  AlertAction,
  RevokeEntitlementRequest,
  NotificationPreferences,
  RevenueCatCredentials,
  AppRegistration,
};