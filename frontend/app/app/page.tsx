"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { ChatInterface } from "@/components/chat-interface"
import { AppHeader } from "@/components/app-header"
import { FileDiffIcon as FileCompare, CheckSquare, NotebookPen, MessageSquare, Calendar } from "lucide-react"

export default function AppPage() {
  // For demo purposes, we'll start with fileUploaded set to true
  const [fileUploaded, setFileUploaded] = useState(true)
  const [documentType, setDocumentType] = useState("contract")
  const [documentSummary, setDocumentSummary] = useState({
    company: "AlphaTech",
    date: "March 2024",
    type: "Service Agreement",
  })

  const handleFileUpload = (files) => {
    console.log("Files uploaded:", files)
    setFileUploaded(true)
  }

  return (
    <div className="flex flex-col h-screen">
      <AppHeader />

      <div className="flex flex-1 overflow-hidden">
        {/* Left 2/3 - Chat Interface */}
        <div className="w-full lg:w-2/3 flex flex-col border-r">
          <div className="flex-1 overflow-hidden">
            <ChatInterface fileUploaded={fileUploaded} onFileUpload={handleFileUpload} />
          </div>
        </div>

        {/* Right 1/3 - Smart Action Panel */}
        <div className="hidden lg:flex lg:w-1/3 flex-col p-6 bg-gray-50">
          {fileUploaded && (
            <div className="mb-6 p-4 bg-white rounded-lg shadow-sm">
              <h3 className="font-medium text-gray-900 mb-1">Document Summary</h3>
              <p className="text-gray-600 text-sm">
                This is a {documentSummary.type} from {documentSummary.company}, {documentSummary.date}
              </p>
            </div>
          )}

          <h3 className="font-medium text-gray-900 mb-4">Smart Actions</h3>

          <div className="space-y-3">
            <SmartActionButton
              icon={<FileCompare />}
              label="Compare to Previous Contract"
              disabled={!fileUploaded}
              tooltip="Compare this document with previous versions"
            />

            <SmartActionButton
              icon={<CheckSquare />}
              label="Check Policy Compliance"
              disabled={!fileUploaded}
              tooltip="Verify if this document complies with company policies"
            />

            <SmartActionButton
              icon={<NotebookPen />}
              label="Create Notion Task"
              disabled={!fileUploaded}
              tooltip="Create a task in Notion based on this document"
            />

            <SmartActionButton
              icon={<MessageSquare />}
              label="Send to Slack"
              disabled={!fileUploaded}
              tooltip="Share this document or insights in Slack"
            />

            <SmartActionButton
              icon={<Calendar />}
              label="Set Calendar Reminder"
              disabled={!fileUploaded}
              tooltip="Create a calendar reminder for important dates"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

function SmartActionButton({ icon, label, disabled, tooltip }) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline" className="w-full justify-start" disabled={disabled}>
            <span className="mr-2">{icon}</span>
            {label}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
