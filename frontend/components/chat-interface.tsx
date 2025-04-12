"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { FileUp, Send, FileText, ImageIcon, Bot, User, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { FileUploader } from "@/components/file-uploader"
import { motion, AnimatePresence } from "framer-motion"

interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
  attachments?: {
    type: "pdf" | "image"
    name: string
    size: string
  }[]
  suggestion?: {
    text: string
    action: string
  }
}

interface ChatInterfaceProps {
  onDocumentProcessed: (documentType: string) => void
  documentType: string | null
  onToggleActionSidebar: () => void
  showActionSidebar: boolean
}

export function ChatInterface({
  onDocumentProcessed,
  documentType,
  onToggleActionSidebar,
  showActionSidebar,
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      role: "assistant",
      content:
        "Hello! I'm your document assistant. Upload a document, and I'll help you analyze it and suggest actions.",
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState("")
  const [isUploading, setIsUploading] = useState(false)
  const [showUploader, setShowUploader] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSendMessage = () => {
    if (!input.trim()) return

    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")

    // Simulate AI response
    setTimeout(() => {
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "I'm analyzing your request. Is there a specific document you'd like me to help with?",
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, assistantMessage])
    }, 1000)
  }

  const handleFileUpload = (files: File[]) => {
    setIsUploading(true)
    setShowUploader(false)

    // Simulate file upload and processing
    setTimeout(() => {
      const file = files[0]
      const fileSize = (file.size / 1024).toFixed(0) + " KB"
      const fileType = file.name.endsWith(".pdf") ? "pdf" : "image"

      // Add user message with attachment
      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        role: "user",
        content: "I've uploaded a document for analysis.",
        timestamp: new Date(),
        attachments: [
          {
            type: fileType as "pdf" | "image",
            name: file.name,
            size: fileSize,
          },
        ],
      }

      setMessages((prev) => [...prev, userMessage])
      setIsUploading(false)

      // Simulate AI processing and response
      setTimeout(() => {
        // Determine document type based on filename (in a real app, this would be done by AI)
        let docType = "unknown"
        let suggestion = ""

        if (file.name.toLowerCase().includes("meeting") || file.name.toLowerCase().includes("notes")) {
          docType = "meeting_notes"
          suggestion = "Would you like me to extract action items from these meeting notes?"
        } else if (file.name.toLowerCase().includes("financial") || file.name.toLowerCase().includes("report")) {
          docType = "financial"
          suggestion = "Would you like me to visualize the key financial data in this report?"
        } else if (file.name.toLowerCase().includes("project") || file.name.toLowerCase().includes("roadmap")) {
          docType = "planning"
          suggestion = "Would you like me to create a timeline from this project document?"
        } else {
          docType = "document"
          suggestion = "Would you like me to summarize this document?"
        }

        // Update parent component with document type
        onDocumentProcessed(docType)

        // Generate appropriate response based on document type
        let responseContent = ""
        if (docType === "meeting_notes") {
          responseContent =
            "I've analyzed your meeting notes. I can see this is from a product team discussion with several action items and decisions about the Q3 roadmap."
        } else if (docType === "financial") {
          responseContent =
            "I've analyzed your financial report. This appears to be a quarterly financial summary with revenue figures, expenses, and projections for the next quarter."
        } else if (docType === "planning") {
          responseContent =
            "I've analyzed your project planning document. This contains project milestones, team assignments, and deadlines for the upcoming product launch."
        } else {
          responseContent = "I've analyzed your document and extracted the key information."
        }

        const assistantMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: responseContent,
          timestamp: new Date(),
          suggestion: {
            text: suggestion,
            action:
              docType === "meeting_notes"
                ? "extract_action_items"
                : docType === "financial"
                  ? "visualize_data"
                  : docType === "planning"
                    ? "create_timeline"
                    : "summarize",
          },
        }

        setMessages((prev) => [...prev, assistantMessage])
      }, 1500)
    }, 2000)
  }

  const handleSuggestionAction = (action: string) => {
    // Add user message accepting the suggestion
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: "Yes, please do that.",
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])

    // Simulate AI processing the action
    setTimeout(() => {
      let responseContent = ""

      switch (action) {
        case "extract_action_items":
          responseContent =
            "I've extracted the following action items from your meeting notes:\n\n1. @John to finalize the Q3 product roadmap by Friday\n2. @Sarah to schedule user testing sessions for the new feature\n3. @Team to review the competitor analysis before next meeting\n4. @Michael to update the project timeline in Jira"
          break
        case "visualize_data":
          responseContent =
            "I've created visualizations based on your financial data. The charts show a 15% increase in revenue compared to last quarter, with marketing expenses decreasing by 8%. Would you like me to send these visualizations to your team?"
          break
        case "create_timeline":
          responseContent =
            "I've created a project timeline based on your planning document. The critical path shows the product launch is scheduled for October 15th, with beta testing beginning on September 1st. Would you like me to export this timeline to your project management tool?"
          break
        case "summarize":
          responseContent =
            "Here's a summary of your document:\n\nThe document outlines the company's strategic initiatives for the upcoming fiscal year, focusing on market expansion, product innovation, and operational efficiency. Key points include entering two new markets in Q2, launching three product enhancements in Q3, and implementing a new CRM system by year-end."
          break
        default:
          responseContent =
            "I've processed your request. Is there anything else you'd like me to do with this document?"
      }

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: responseContent,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, assistantMessage])
    }, 1500)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <div className="flex h-full flex-col bg-gradient-to-b from-background to-background/50">
      <div className="border-b border-border/50 p-4 flex justify-between items-center bg-background/80 backdrop-blur-sm">
        <h2 className="text-xl font-semibold">DocAssist</h2>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="text-muted-foreground">
            New Chat
          </Button>
          {/* Add a mobile-only button to toggle the action sidebar */}
          <Button variant="outline" size="sm" className="md:hidden" onClick={onToggleActionSidebar}>
            Actions
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 md:p-6" ref={chatContainerRef}>
        <div className="max-w-3xl mx-auto space-y-6">
          <AnimatePresence initial={false}>
            {messages.map((message, index) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`flex max-w-[85%] gap-3 rounded-2xl p-4 ${
                    message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                  }`}
                >
                  <div className="mt-1 shrink-0">
                    {message.role === "assistant" ? (
                      <div className="rounded-full bg-primary/10 p-1">
                        <Bot className="h-5 w-5 text-primary" />
                      </div>
                    ) : (
                      <div className="rounded-full bg-primary-foreground/20 p-1">
                        <User className="h-5 w-5" />
                      </div>
                    )}
                  </div>
                  <div className="space-y-3 overflow-hidden">
                    {message.attachments?.map((attachment, index) => (
                      <div key={index} className="flex items-center gap-2 rounded-md bg-background/20 p-2">
                        {attachment.type === "pdf" ? (
                          <FileText className="h-4 w-4" />
                        ) : (
                          <ImageIcon className="h-4 w-4" />
                        )}
                        <div className="flex flex-col overflow-hidden">
                          <span className="text-sm font-medium truncate">{attachment.name}</span>
                          <span className="text-xs opacity-70">{attachment.size}</span>
                        </div>
                      </div>
                    ))}
                    <div className="whitespace-pre-wrap text-sm">{message.content}</div>

                    {message.suggestion && (
                      <div className="mt-4 pt-3 border-t border-border/20">
                        <p className="text-sm font-medium mb-3">{message.suggestion.text}</p>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            className="rounded-full px-4 shadow-sm"
                            onClick={() => handleSuggestionAction(message.suggestion!.action)}
                          >
                            Yes
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="rounded-full px-4"
                            onClick={onToggleActionSidebar}
                          >
                            More actions <ChevronRight className="ml-1 h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}

                    <div className="text-right text-xs opacity-70">
                      {message.timestamp.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>
      </div>

      {showUploader && (
        <div className="border-t border-border/50 p-4 bg-background/80 backdrop-blur-sm">
          <FileUploader onUpload={handleFileUpload} onCancel={() => setShowUploader(false)} isUploading={isUploading} />
        </div>
      )}

      <div className="border-t border-border/50 p-4 bg-background/80 backdrop-blur-sm">
        <div className="max-w-3xl mx-auto">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowUploader(!showUploader)}
              className="shrink-0 rounded-full"
            >
              <FileUp className="h-4 w-4" />
            </Button>
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              className="min-h-10 resize-none rounded-xl border-muted bg-background"
            />
            <Button onClick={handleSendMessage} disabled={!input.trim()} className="shrink-0 rounded-full">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
