'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { Box, Camera, Link2, Loader2 } from 'lucide-react'
import Image from 'next/image'
import { ChangeEvent, useCallback, useEffect, useId, useState } from 'react'
import PopupImage from '@/app/HOC/PopupImage'
import { extractImageUrl, isValidHttpUrl } from '@/app/lib/imageUrl'

export type GroceryImageValue = {
    file: File | null
    imageUrl: string | null
    preview: string | null
}

type GroceryImagePickerProps = {
    value: GroceryImageValue
    onChange: (value: GroceryImageValue) => void
    loading?: boolean
    onLoadingChange?: (loading: boolean) => void
    onError?: (message: string) => void
    fileInputId?: string
}

const GroceryImagePicker = ({
    value,
    onChange,
    loading = false,
    onLoadingChange,
    onError,
    fileInputId,
}: GroceryImagePickerProps) => {
    const autoId = useId()
    const inputId = fileInputId ?? `grocery-image-${autoId.replace(/:/g, '')}`
    const [urlInput, setUrlInput] = useState('')
    const [openPreview, setOpenPreview] = useState(false)

    const applyUrl = useCallback((raw: string) => {
        const url = extractImageUrl(raw)
        if (!url || !isValidHttpUrl(url)) {
            onError?.('Invalid image URL')
            return
        }
        onChange({ file: null, imageUrl: url, preview: url })
        setUrlInput(url)
    }, [onChange, onError])

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files
        if (!files?.length) return

        onLoadingChange?.(true)
        try {
            const file = files[0]
            onChange({
                file,
                imageUrl: null,
                preview: URL.createObjectURL(file),
            })
            setUrlInput('')
        } catch {
            onError?.('Upload image failed')
        } finally {
            onLoadingChange?.(false)
            e.target.value = ''
        }
    }

    const handlePaste = useCallback((e: ClipboardEvent) => {
        const items = e.clipboardData?.items
        if (!items?.length) return

        for (const item of Array.from(items)) {
            if (item.type.startsWith('image/')) {
                e.preventDefault()
                const file = item.getAsFile()
                if (!file) return

                onLoadingChange?.(true)
                onChange({
                    file,
                    imageUrl: null,
                    preview: URL.createObjectURL(file),
                })
                setUrlInput('')
                onLoadingChange?.(false)
                return
            }
        }

        const text = e.clipboardData?.getData('text') ?? ''
        const url = extractImageUrl(text)
        if (url) {
            e.preventDefault()
            applyUrl(url)
        }
    }, [applyUrl, onChange, onLoadingChange])

    useEffect(() => {
        document.addEventListener('paste', handlePaste)
        return () => document.removeEventListener('paste', handlePaste)
    }, [handlePaste])

    // Reset URL input khi parent clear value (sau submit thành công)
    useEffect(() => {
        if (!value.preview && !value.imageUrl && !value.file) {
            setUrlInput('')
            setOpenPreview(false)
        }
    }, [value.preview, value.imageUrl, value.file])

    const previewSrc = value.preview
    const isBlobPreview = previewSrc?.startsWith('blob:') || previewSrc?.startsWith('data:')

    return (
        <div className='flex flex-col gap-3'>
            <div className='relative shrink-0 w-fit'>
                <div className='w-20 h-20 rounded-2xl border-4 border-white shadow-xl overflow-hidden bg-gray-100'>
                    {loading ? (
                        <div className='w-full h-full flex items-center justify-center'>
                            <Loader2 className='w-6 h-6 animate-spin text-green-600' />
                        </div>
                    ) : previewSrc ? (
                        isBlobPreview ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                                src={previewSrc}
                                alt='Preview'
                                onClick={() => setOpenPreview(true)}
                                className='object-cover w-full h-full cursor-pointer'
                            />
                        ) : (
                            <Image
                                onClick={() => setOpenPreview(true)}
                                src={previewSrc}
                                width={80}
                                height={80}
                                alt='Preview'
                                unoptimized
                                className='object-cover w-full h-full cursor-pointer'
                            />
                        )
                    ) : (
                        <div className='w-full h-full flex items-center justify-center bg-linear-to-br from-green-100 to-emerald-200'>
                            <Box className='w-8 h-8 text-green-600' />
                        </div>
                    )}
                </div>

                <label
                    htmlFor={inputId}
                    className='absolute top-0 right-0 bg-green-600 hover:bg-green-700 text-white rounded-lg p-1.5 cursor-pointer shadow-md transition-all'
                    onClick={(e) => e.stopPropagation()}
                >
                    <Camera className='w-5 h-5' />
                </label>
                <input
                    type='file'
                    id={inputId}
                    className='hidden'
                    onChange={handleFileChange}
                    accept='image/*'
                />
            </div>

            <div className='flex flex-col gap-1.5'>
                <label className='text-[11px] font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1'>
                    <Link2 className='w-3.5 h-3.5' />
                    Paste image URL
                </label>
                <div className='flex gap-2'>
                    <input
                        type='url'
                        value={urlInput}
                        onChange={(e) => setUrlInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), applyUrl(urlInput))}
                        placeholder='https://... or paste (Ctrl+V)'
                        className='flex-1 px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-green-500'
                    />
                    <motion.button
                        type='button'
                        whileTap={{ scale: 0.96 }}
                        onClick={() => applyUrl(urlInput)}
                        className='px-3 py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white text-xs font-bold shrink-0'
                    >
                        Apply
                    </motion.button>
                </div>
                <p className='text-[10px] text-gray-400'>
                    Upload file, paste link, or Ctrl+V image from clipboard
                </p>
            </div>

            <AnimatePresence>
                {openPreview && previewSrc && (
                    <PopupImage image={previewSrc} setOpen={setOpenPreview} />
                )}
            </AnimatePresence>
        </div>
    )
}

export default GroceryImagePicker
