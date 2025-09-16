import { useDropzone } from 'react-dropzone'

interface UploadCardProps {
  onSelect: (file: File | null) => void
  file: File | null
}

export default function UploadCard({ onSelect, file }: UploadCardProps) {
  const onDrop = (accepted: File[]) => {
    const f = accepted[0]
    if (!f) return
    if (f.size > 50 * 1024 * 1024) return alert('Max 50 MB')
    onSelect(f)
  }
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'audio/*': ['.wav', '.mp3', '.flac', '.m4a'] },
    multiple: false,
  })

  return (
    <div
      {...getRootProps()}
      className={`rounded-2xl border border-dashed p-8 text-center cursor-pointer ${
        isDragActive ? 'border-brand' : 'border-white/10'
      }`}
      aria-label="Audio file upload"
    >
      <input {...getInputProps()} />
      {file ? (
        <div className="space-y-2">
          <p className="text-sm">{file.name}</p>
          <button onClick={(e) => { e.preventDefault(); onSelect(null) }} className="text-xs underline">Clear</button>
        </div>
      ) : (
        <p className="text-sm text-neutral-300">Drop audio here, or click to select</p>
      )}
    </div>
  )
}


