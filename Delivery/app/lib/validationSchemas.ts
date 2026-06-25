// app/lib/validationSchemas.ts
import * as yup from 'yup'

const emailSchema = yup.string()
    .required('Email is required')
    .email('Invalid email format')

const passwordSchema = yup.string()
    .required('Password is required')
    .min(6, 'Password must be at least 6 characters')

//  Password Reset Form
export const forgotPasswordSchema = yup.object({ email: emailSchema })

//  Login Form
export const loginSchema = yup.object({
    email: emailSchema,
    password: passwordSchema,
})

//  Register Form
export const registerSchema = yup.object({
    name: yup.string().required('Name is required').min(2, 'Too short'),
    email: emailSchema,
    password: passwordSchema,
})

//  Reset Password Form
export const resetPasswordSchema = yup.object({
    password: passwordSchema,
    confirmPassword: yup.string()
        .required('Please confirm password')
        .oneOf([yup.ref('password')], 'Passwords do not match'),
})

// Type exports cho từng form
export type LoginFormValues = yup.InferType<typeof loginSchema>
export type RegisterFormValues = yup.InferType<typeof registerSchema>
export type ForgotPasswordFormValues = yup.InferType<typeof forgotPasswordSchema>
export type ResetPasswordFormValues = yup.InferType<typeof resetPasswordSchema>