import React, { useEffect, useState, useRef } from 'react'
import { CloudUpload, File, FileText, FileImage, FileAudio, FileVideo, FileArchive,
  Folder, Download, RefreshCw, X, Loader2 } from 'lucide-react'

const API = import.meta.env.VITE_API || 'http://localhost:4000'

export default function App() {
  const [files, setFiles] = useState([])
  const [selection, setSelection] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [downloading, setDownloading] = useState({})
  const inputRef = useRef(null)

  useEffect(() => { fetchFiles() }, [])

  async function fetchFiles() {
    try {
      const res = await fetch(API + '/files')
      const data = await res.json()
      setFiles(data.files || [])
    } catch (err) {
      console.error('fetchFiles', err)
    }
  }

  async function uploadSelected() {
    if (!selection || selection.length === 0) return
    
    setUploading(true)
    try {
      const form = new FormData()
      for (const f of selection) form.append('files', f)
      
      const res = await fetch(API + '/upload', { 
        method: 'POST', 
        body: form 
      })
      
      if (!res.ok) throw new Error('Upload failed')
      
      setSelection(null)
      if (inputRef.current) inputRef.current.value = null
      await fetchFiles()
    } catch (err) {
      console.error('upload error:', err)
      alert('Error al subir los archivos')
    } finally {
      setUploading(false)
    }
  }

  async function downloadFile(key, fileName) {
    setDownloading(prev => ({ ...prev, [key]: true }))
    
    try {
      const response = await fetch(`${API}/download?key=${encodeURIComponent(key)}`)
      
      if (!response.ok) throw new Error('Download failed')
      
      const contentDisposition = response.headers.get('content-disposition')
      let finalFileName = fileName
      
      if (contentDisposition) {
        const filenameStarMatch = contentDisposition.match(/filename\*=UTF-8''([^;]+)/)
        if (filenameStarMatch && filenameStarMatch[1]) {
          finalFileName = decodeURIComponent(filenameStarMatch[1])
        } else {
          const filenameMatch = contentDisposition.match(/filename="?([^";]+)"?/)
          if (filenameMatch && filenameMatch[1]) {
            finalFileName = filenameMatch[1]
          }
        }
      }
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = finalFileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      
    } catch (error) {
      console.error('Download error:', error)
      alert('Error al descargar el archivo')
    } finally {
      setDownloading(prev => ({ ...prev, [key]: false }))
    }
  }

  function onDrop(ev) {
    ev.preventDefault()
    const dt = ev.dataTransfer
    if (dt && dt.files && dt.files.length) {
      setSelection(Array.from(dt.files))
    }
  }

  function onBrowse() {
    inputRef.current.click()
  }

  function onFilesChosen(list) {
    setSelection(Array.from(list))
  }

  function getFileIcon(filename) {
    const ext = filename.split('.').pop().toLowerCase()
    
    switch(ext) {
      case 'pdf':
        return FileText
      case 'doc':
      case 'docx':
      case 'txt':
      case 'rtf':
        return FileText
      case 'xls':
      case 'xlsx':
      case 'csv':
        return FileText
      case 'ppt':
      case 'pptx':
        return FileText
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'svg':
      case 'webp':
        return FileImage
      case 'mp3':
      case 'wav':
      case 'aac':
      case 'flac':
        return FileAudio
      case 'mp4':
      case 'avi':
      case 'mov':
      case 'wmv':
      case 'flv':
      case 'mkv':
        return FileVideo
      case 'zip':
      case 'rar':
      case '7z':
      case 'tar':
      case 'gz':
        return FileArchive
      default:
        return File
    }
  }

  function formatFileSize(bytes) {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="page">
      <h1>Drive Clone</h1>

      <div className="grid">
        <div className="card upload-card">
          <div className="card-header">Carga de documentos</div>
          <div className="card-sub">Arrastra o selecciona archivos para subir</div>

          <div 
            className={`dropbox ${selection && selection.length > 0 ? 'has-files' : ''}`} 
            onDrop={onDrop} 
            onDragOver={e => e.preventDefault()} 
            onClick={onBrowse}
          >
            {selection && selection.length > 0 ? (
              <div className="drop-selected">
                <CloudUpload size={28} className="drop-icon" />
                <div className="drop-title">{selection.length} archivo{selection.length > 1 ? 's' : ''} seleccionado{selection.length > 1 ? 's' : ''}</div>
                <div className="drop-sub">
                  {selection.map(f => f.name).join(', ').substring(0, 60)}
                  {selection.reduce((acc, f) => acc + f.size, 0) > 0 && 
                    ` (${formatFileSize(selection.reduce((acc, f) => acc + f.size, 0))})`
                  }
                </div>
              </div>
            ) : (
              <>
                <CloudUpload size={28} className="drop-icon" />
                <div className="drop-title">Arrastra archivos aquí</div>
                <div className="drop-sub">o haz clic para seleccionar</div>
                <div className="drop-hint">Documentos, imágenes, videos</div>
              </>
            )}
          </div>

          <div className="actions">
            <input 
              ref={inputRef} 
              type="file" 
              multiple 
              style={{ display: 'none' }} 
              onChange={e => onFilesChosen(e.target.files)} 
            />
            <button 
              className="btn-upload" 
              onClick={uploadSelected} 
              disabled={!selection || selection.length === 0 || uploading}
            >
              {uploading ? (
                <>
                  <Loader2 size={16} className="spinner" />
                  Subiendo...
                </>
              ) : (
                'Cargar'
              )}
            </button>
            {selection && selection.length > 0 && (
              <button 
                className="btn-clear" 
                onClick={() => {
                  setSelection(null)
                  if (inputRef.current) inputRef.current.value = null
                }}
              >
                <X size={16} />
                Limpiar
              </button>
            )}
          </div>
        </div>

        <div className="card recent-card">
          <div className="card-header">
            <span>Archivos recientes</span>
            <button className="btn-refresh" onClick={fetchFiles} aria-label="refrescar">
              <RefreshCw size={18} />
            </button>
          </div>

          <div className="recent-body">
            {files.length === 0 && (
              <div className="recent-empty">
                <Folder size={34} className="recent-empty-icon" />
                <div className="recent-empty-title">No hay archivos recientes</div>
                <div className="recent-empty-sub">Los archivos cargados aparecerán aquí</div>
              </div>
            )}

            {files.map(f => {
              const nombreLimpio = f.key.split('_').slice(1).join('_') || f.key;
              const FileIcon = getFileIcon(nombreLimpio);
              
              return (
                <div className="recent-row" key={f.key}>
                  <div className="recent-info">
                    <FileIcon size={20} className="recent-icon" />
                    <div className="recent-meta">
                      <div className="recent-name" title={nombreLimpio}>
                        {nombreLimpio.length > 30 ? nombreLimpio.substring(0, 30) + '...' : nombreLimpio}
                      </div>
                      <div className="recent-date">
                        {new Date(f.lastModified).toLocaleString()} • {formatFileSize(f.size)}
                      </div>
                    </div>
                  </div>
                  <button 
                    className="btn-download" 
                    onClick={() => downloadFile(f.key, nombreLimpio)}
                    disabled={downloading[f.key]}
                  >
                    {downloading[f.key] ? (
                      <>
                        <Loader2 size={16} className="spinner" />
                        Descargando...
                      </>
                    ) : (
                      <>
                        <Download size={16} />
                        Descargar
                      </>
                    )}
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}