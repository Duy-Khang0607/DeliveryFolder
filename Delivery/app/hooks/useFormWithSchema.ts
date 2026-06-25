// app/hooks/useFormWithSchema.ts
import { useForm, UseFormReturn } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
export function useFormWithSchema<T extends yup.AnyObjectSchema>(
    schema: T,
    defaultValues?: Partial<yup.InferType<T>>,
    mode: 'onTouched' | 'onBlur' | 'onChange' | 'onSubmit' = 'onTouched'
): UseFormReturn<yup.InferType<T>> {
    return useForm<yup.InferType<T>>({
        resolver: yupResolver(schema),
        defaultValues: defaultValues as any,
        mode: mode ,  // default mode cho tất cả forms
    })
}