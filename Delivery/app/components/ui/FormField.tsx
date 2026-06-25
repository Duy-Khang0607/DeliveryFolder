// app/components/ui/FormField.tsx
type FormFieldProps = {
    error?: string
    children: React.ReactNode
}

export const FormField = ({ error, children }: FormFieldProps) => (
    <div className='relative w-full flex flex-col gap-1'>
        {children}
        {error && <p className='text-red-500 text-xs text-left'>{error}</p>}
    </div>
)