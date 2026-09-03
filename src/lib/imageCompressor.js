/**
 * Fast client-side image compression utility
 * Compresses large images before upload to make uploads super fast (< 1s)
 */

export const compressImage = async (file, options = {}) => {
  if (!file || !(file instanceof File || file instanceof Blob)) {
    return file
  }

  // Do not compress SVGs, GIFs (preserve animation), or PDFs
  if (file.type === 'image/svg+xml' || file.type === 'image/gif' || file.type === 'application/pdf') {
    return file
  }

  // If already small (< 150 KB), no need to recompress
  if (file.size <= 150 * 1024) {
    return file
  }

  const {
    maxWidth = 1920,
    maxHeight = 1080,
    quality = 0.85,
    format = 'image/webp'
  } = options

  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = (e) => {
      const img = new Image()
      img.src = e.target.result
      img.onload = () => {
        let { width, height } = img

        // Calculate new dimensions keeping aspect ratio
        if (width > maxWidth || height > maxHeight) {
          if (width / height > maxWidth / maxHeight) {
            height = Math.round((height * maxWidth) / width)
            width = maxWidth
          } else {
            width = Math.round((width * maxHeight) / height)
            height = maxHeight
          }
        }

        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          resolve(file)
          return
        }

        // Draw image smoothly
        ctx.drawImage(img, 0, 0, width, height)

        canvas.toBlob(
          (blob) => {
            if (!blob || blob.size >= file.size) {
              // If compressed size is larger, keep original
              resolve(file)
              return
            }

            const ext = blob.type === 'image/webp' ? '.webp' : '.jpg'
            const originalName = file.name || 'image'
            const fileName = originalName.replace(/\.[^/.]+$/, '') + ext

            const compressedFile = new File([blob], fileName, {
              type: blob.type,
              lastModified: Date.now(),
            })

            resolve(compressedFile)
          },
          format,
          quality
        )
      }

      img.onerror = () => resolve(file)
    }

    reader.onerror = () => resolve(file)
  })
}

/**
 * Helper to compress multiple files concurrently
 */
export const compressImages = async (files, options = {}) => {
  if (!Array.isArray(files)) return []
  return Promise.all(files.map((file) => compressImage(file, options)))
}
