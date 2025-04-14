import { z } from 'zod';
import type { ZodType, ZodTypeDef } from 'zod';

/**
 * Form validation utility using Zod schemas
 */

/**
 * Basic form validation utility
 * @param schema Zod schema for validation
 * @param data Data to validate
 * @returns Validation result with errors if any
 */
export function validateForm<T>(schema: ZodType<T, ZodTypeDef, any>, data: any): {
  success: boolean;
  data?: T;
  errors?: Record<string, string>;
} {
  try {
    const validData = schema.parse(data);
    return {
      success: true,
      data: validData
    };
  } catch (error: any) {
    if (error.errors) {
      const formattedErrors: Record<string, string> = {};
      
      error.errors.forEach((err: any) => {
        const path = err.path.join('.');
        formattedErrors[path] = err.message;
      });
      
      return {
        success: false,
        errors: formattedErrors
      };
    }
    
    return {
      success: false,
      errors: { _form: 'Invalid form data' }
    };
  }
}

/**
 * Common validation schemas
 */
export const ValidationSchemas = {
  // User validation
  user: {
    login: z.object({
      email: z.string().email('Please enter a valid email address'),
      password: z.string().min(8, 'Password must be at least 8 characters')
    }),
    
    register: z.object({
      email: z.string().email('Please enter a valid email address'),
      password: z
        .string()
        .min(8, 'Password must be at least 8 characters')
        .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
        .regex(/[0-9]/, 'Password must contain at least one number')
        .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
      confirmPassword: z.string()
    }).refine(data => data.password === data.confirmPassword, {
      message: 'Passwords do not match',
      path: ['confirmPassword']
    }),
    
    profile: z.object({
      name: z.string().min(2, 'Name must be at least 2 characters'),
      bio: z.string().optional(),
      organization: z.string().optional()
    })
  },
  
  // Organization validation
  organization: z.object({
    name: z.string().min(2, 'Organization name must be at least 2 characters'),
    description: z.string().optional(),
    website: z.string().url('Please enter a valid URL').optional().or(z.literal(''))
  }),
  
  // Project validation
  project: z.object({
    title: z.string().min(3, 'Project title must be at least 3 characters'),
    description: z.string().min(10, 'Please provide a more detailed description'),
    tags: z.array(z.string()).optional(),
    status: z.enum(['draft', 'active', 'completed', 'archived'])
  }),
  
  // Contact form validation
  contact: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Please enter a valid email address'),
    subject: z.string().min(5, 'Subject must be at least 5 characters'),
    message: z.string().min(20, 'Message must be at least 20 characters')
  })
};

/**
 * Client-side form validation utility with real-time feedback
 * @param schema Zod schema for validation
 * @returns Validation utilities and state
 */
export function createFormValidator<T>(schema: ZodType<T, ZodTypeDef, any>) {
  const errors: Record<string, string> = {};
  const touched: Set<string> = new Set();
  
  const validate = (data: any, field?: string): boolean => {
    try {
      if (field) {
        // Extract the specific field schema and validate just that field
        const fieldSchema = schema.shape[field as keyof typeof schema.shape];
        if (fieldSchema) {
          fieldSchema.parse(data[field]);
          delete errors[field];
        }
      } else {
        // Validate the entire form
        schema.parse(data);
        Object.keys(errors).forEach(key => delete errors[key]);
      }
      return true;
    } catch (error: any) {
      if (error.errors) {
        error.errors.forEach((err: any) => {
          const path = err.path.join('.');
          if (!field || path === field) {
            errors[path] = err.message;
          }
        });
      }
      return false;
    }
  };
  
  const touchField = (field: string): void => {
    touched.add(field);
  };
  
  const isTouched = (field: string): boolean => {
    return touched.has(field);
  };
  
  const getError = (field: string): string | undefined => {
    return errors[field];
  };
  
  const hasErrors = (): boolean => {
    return Object.keys(errors).length > 0;
  };
  
  return {
    validate,
    touchField,
    isTouched,
    getError,
    hasErrors,
    errors
  };
}