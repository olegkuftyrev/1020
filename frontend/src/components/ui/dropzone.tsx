import * as React from "react"
import { cn } from "@/lib/utils"

interface DropzoneProps extends React.HTMLAttributes<HTMLDivElement> {
  onFileSelect: (file: File) => void
  accept?: string
  disabled?: boolean
  maxSize?: number // in bytes
}

export function Dropzone({
  className,
  onFileSelect,
  accept,
  disabled,
  maxSize,
  ...props
}: DropzoneProps) {
  const [isDragging, setIsDragging] = React.useState(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    if (!disabled) {
      setIsDragging(true)
    }
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    if (disabled) return

    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFile(files[0])
    }
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFile(files[0])
    }
  }

  const handleFile = (file: File) => {
    if (maxSize && file.size > maxSize) {
      return
    }
    onFileSelect(file)
  }

  const handleClick = () => {
    if (!disabled) {
      fileInputRef.current?.click()
    }
  }

  return (
    <div
      {...props}
      className={cn(
        "relative flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg transition-colors cursor-pointer",
        isDragging
          ? "border-primary bg-primary/10"
          : "border-primary/30 bg-card/40 hover:border-primary/50 hover:bg-card/60",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileInputChange}
        disabled={disabled}
        className="hidden"
      />
      <div className="flex flex-col items-center justify-center gap-2 text-center">
        <div className="text-sm font-medium text-foreground">
          {isDragging ? "Drop file here" : "Drag and drop file here"}
        </div>
        <div className="text-xs text-muted-foreground">
          or click to browse
        </div>
      </div>
    </div>
  )
}


