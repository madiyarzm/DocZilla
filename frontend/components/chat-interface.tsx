"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Send, Bot, User, Upload, File, X } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export function ChatInterface({ fileUploaded, onFileUpload }) {
  const [messages, setMessages] = useState([])
  const [inputValue, setInputValue] = useState("")
  const [uploadedFiles, setUploadedFiles] = useState([])
  const [isDragging, setIsDragging] = useState(false)
  const messagesEndRef = useRef(null)
  const fileInputRef = useRef(null)

  useEffect(() => {
    if (fileUploaded && messages.length === 0) {
      // Add initial messages for demo mode
      setMessages([
        {
          role: "assistant",
          content: "Welcome to the Echo demo! I've analyzed the AlphaTech Service Agreement for you.",
          suggestions: ["Summarize the key points", "What are the payment terms?", "Check for policy compliance"],
        },
        {
          role: "assistant",
          content:
            "This is a 12-month service agreement with AlphaTech, dated March 2024. It includes standard terms for SaaS services with a total value of $24,000.",
          suggestions: ["Show me the key dates", "Any unusual clauses?", "Compare to our template"],
        },
      ])

      // Add demo file
      if (uploadedFiles.length === 0) {
        const demoFile = {
          name: "AlphaTech_Contract_2024.pdf",
          size: 1024 * 256, // 256 KB
          type: "application/pdf",
        }
        setUploadedFiles([demoFile])
      }
    }
  }, [fileUploaded, messages.length, uploadedFiles.length])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const handleSendMessage = (e) => {
    e.preventDefault()

    if (!inputValue.trim()) return

    // Add user message
    setMessages([...messages, { role: "user", content: inputValue }])

    // Simulate Echo response
    setTimeout(() => {
      const responses = [
        {
          content:
            "This contract includes a 30-day termination clause in section 8.2. Would you like me to check if this aligns with your company policy?",
          suggestions: ["Yes, check policy compliance", "What other termination conditions exist?"],
        },
        {
          content:
            "I've identified that this agreement has a 12-month auto-renewal term. Would you like me to set a calendar reminder for 60 days before renewal?",
          suggestions: ["Set calendar reminder", "What are the renewal terms?"],
        },
        {
          content:
            "The payment terms require net-45 payment schedule, which is longer than your standard net-30 terms. Would you like me to flag this for review?",
          suggestions: ["Flag for review", "Compare to previous contract"],
        },
      ]

      const randomResponse = responses[Math.floor(Math.random() * responses.length)]

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: randomResponse.content,
          suggestions: randomResponse.suggestions,
        },
      ])
    }, 1000)

    setInputValue("")
  }

  const handleSuggestionClick = (suggestion) => {
    setMessages([...messages, { role: "user", content: suggestion }])

    // Simulate Echo response
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `I'm processing your request to "${suggestion}". This will take just a moment...`,
          suggestions: ["Show me more details", "What else should I know?"],
        },
      ])
    }, 800)
  }

  const handleFileUpload = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files).map((file) => ({
        name: file.name,
        size: file.size,
        type: file.type,
      }))

      setUploadedFiles((prev) => [...prev, ...newFiles])
      onFileUpload(newFiles)

      // Add a message about the uploaded file
      setMessages((prev) => [
        ...prev,
        {
          role: "user",
          content: `I've uploaded ${newFiles.map((f) => f.name).join(", ")}`,
        },
      ])

      // Simulate Echo response
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `I've received your document${newFiles.length > 1 ? "s" : ""}. Let me analyze ${newFiles.length > 1 ? "them" : "it"} for you...`,
          },
        ])

        setTimeout(() => {
          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              content: `I've analyzed ${newFiles.length > 1 ? "your documents" : "your document"}. This appears to be a service agreement with standard terms. What would you like to know about it?`,
              suggestions: ["Summarize key points", "Check for risks", "Compare to our template"],
            },
          ])
        }, 1500)
      }, 1000)
    }
  }

  const removeFile = (index) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const openFileDialog = () => {
    fileInputRef.current?.click()
  }

  return (
    <div
      className="flex flex-col h-full"
      onDragOver={(e) => {
        e.preventDefault()
        setIsDragging(true)
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(e) => {
        e.preventDefault()
        setIsDragging(false)
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
          const newFiles = Array.from(e.dataTransfer.files).map((file) => ({
            name: file.name,
            size: file.size,
            type: file.type,
          }))
          setUploadedFiles((prev) => [...prev, ...newFiles])
          onFileUpload(newFiles)
        }
      }}
    >
      {isDragging && (
        <div className="absolute inset-0 bg-blue-500/10 border-2 border-dashed border-blue-500 rounded-lg z-10 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-lg text-center">
            <Upload className="h-12 w-12 text-blue-500 mx-auto mb-4" />
            <p className="text-lg font-medium">Drop your files here</p>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {!fileUploaded && messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6">
            <div className="bg-gray-100 p-4 rounded-full mb-4">
              <Bot className="h-8 w-8 text-gray-500" />
            </div>
            <h3 className="text-lg font-medium mb-2">Upload a document to get started</h3>
            <p className="text-gray-500 max-w-md mb-6">
              Echo will analyze your document and help you understand, compare, and act on it.
            </p>
            <Button onClick={openFileDialog} className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Upload Document
            </Button>
          </div>
        ) : (
          <>
            {uploadedFiles.length > 0 && (
              <div className="bg-gray-50 p-3 rounded-lg mb-4">
                <h4 className="text-sm font-medium mb-2">Uploaded Documents</h4>
                <ul className="space-y-2">
                  {uploadedFiles.map((file, index) => (
                    <li key={index} className="flex items-center text-sm bg-white p-2 rounded border">
                      <File className="h-4 w-4 mr-2 text-blue-600" />
                      <span className="truncate flex-1">{file.name}</span>
                      <span className="text-xs text-gray-500 mr-2">{(file.size / 1024).toFixed(0)} KB</span>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeFile(index)}>
                        <X className="h-3 w-3" />
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {messages.map((message, index) => (
              <div key={index} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`flex max-w-[80%] ${message.role === "user" ? "flex-row-reverse" : ""}`}>
                  <div
                    className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${
                      message.role === "user" ? "bg-blue-100 ml-2" : "bg-gray-100 mr-2"
                    }`}
                  >
                    {message.role === "user" ? (
                      <User className="h-4 w-4 text-blue-600" />
                    ) : (
                      <Bot className="h-4 w-4 text-gray-600" />
                    )}
                  </div>

                  <div
                    className={`p-3 rounded-lg ${
                      message.role === "user" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    <p>{message.content}</p>

                    {message.suggestions && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {message.suggestions.map((suggestion, i) => (
                          <button
                            key={i}
                            onClick={() => handleSuggestionClick(suggestion)}
                            className={`text-xs px-3 py-1 rounded-full ${
                              message.role === "user"
                                ? "bg-blue-700 text-blue-100"
                                : "bg-white text-gray-800 border border-gray-200"
                            }`}
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t">
        <form onSubmit={handleSendMessage} className="flex space-x-2">
          <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" multiple />

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button type="button" variant="outline" size="icon" onClick={openFileDialog}>
                  <Upload className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Upload document</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask a question about your document..."
            className="flex-1"
          />

          <Button type="submit" size="icon" disabled={!inputValue.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  )
}
