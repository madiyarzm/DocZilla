"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Upload, File } from "lucide-react"

export function FileUpload({ onUpload }) {
  const [isDragging, setIsDragging] = useState(false)
  const [files, setFiles] = useState([])
  const fileInputRef = useRef(null)

  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files)
    }
  }

  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files)
    }
  }

  const handleFiles = (fileList) => {
    const newFiles = Array.from(fileList)
    setFiles(newFiles)
    onUpload(newFiles)
  }

  // Add a useEffect to simulate a file upload in demo mode
  useEffect(() => {
    // Only run on the client side where File is available
    if (typeof window !== "undefined" && files.length === 0) {
      // Instead of creating an actual File object, just use a simple object
      // that has the same properties we need
      const demoFile = {
        name: "AlphaTech_Contract_2024.pdf",
        size: 1024 * 256, // 256 KB
        type: "application/pdf",
      }

      setFiles([demoFile])
      // Notify parent component
      onUpload([demoFile])
    }
  }, [files.length, onUpload])

  const openFileDialog = () => {
    fileInputRef.current?.click()
  }

  return (
    <div>
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center ${
          isDragging ? "border-blue-500 bg-blue-50" : "border-gray-300"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input type="file" ref={fileInputRef} onChange={handleFileInputChange} className="hidden" multiple />

        <div className="flex flex-col items-center justify-center space-y-3">
          <div className="bg-gray-100 p-3 rounded-full">
            <Upload className="h-6 w-6 text-gray-500" />
          </div>

          <div>
            <p className="text-sm font-medium">Drag and drop your files here or</p>
            <p className="text-xs text-gray-500 mt-1">PDF, DOCX, TXT, and other document formats supported</p>
          </div>

          <Button variant="outline" size="sm" onClick={openFileDialog}>
            Browse Files
          </Button>
        </div>
      </div>

      {files.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-medium mb-2">Uploaded Files</h4>
          <ul className="space-y-2">
            {files.map((file, index) => (
              <li key={index} className="flex items-center text-sm bg-gray-50 p-2 rounded">
                <File className="h-4 w-4 mr-2 text-blue-600" />
                <span className="truncate">{file.name}</span>
                <span className="ml-auto text-xs text-gray-500">{(file.size / 1024).toFixed(0)} KB</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
