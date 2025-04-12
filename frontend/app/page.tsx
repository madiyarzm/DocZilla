import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Search, FileText, CheckCircle, Bell } from "lucide-react"

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Navigation */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <FileText className="h-6 w-6 text-blue-600" />
            <span className="text-xl font-semibold">Echo</span>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/auth/login">
              <Button variant="ghost" size="sm">
                Login
              </Button>
            </Link>
            <Link href="/auth/signup">
              <Button size="sm">Sign Up</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="flex-1">
        <div className="container mx-auto px-4 py-20 text-center max-w-4xl">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">Echo – Your AI-Powered Contract Analyst</h1>
          <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
            Understand, compare, and act on legal or financial documents with confidence
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/signup">
              <Button size="lg" className="px-8 py-6 text-lg">
                Get Started
              </Button>
            </Link>
            <Link href="/app">
              <Button size="lg" className="px-8 py-6 text-lg" variant="outline">
                Try Demo
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-gray-50 py-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <FeatureCard
              icon={<Search className="h-10 w-10 text-blue-600" />}
              title="Compare contracts"
              description="Compare contracts and highlight key changes between versions to quickly identify important differences."
            />
            <FeatureCard
              icon={<CheckCircle className="h-10 w-10 text-blue-600" />}
              title="Check compliance"
              description="Check documents against internal policies to ensure they meet your organization's standards."
            />
            <FeatureCard
              icon={<Bell className="h-10 w-10 text-blue-600" />}
              title="Trigger smart actions"
              description="Trigger smart actions like Notion tasks or Slack alerts based on document content."
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <FileText className="h-5 w-5 text-blue-600" />
              <span className="font-semibold">Echo</span>
            </div>
            <div className="flex space-x-6">
              <Link href="#" className="text-sm text-gray-600 hover:text-gray-900">
                Terms
              </Link>
              <Link href="#" className="text-sm text-gray-600 hover:text-gray-900">
                Privacy
              </Link>
              <Link href="#" className="text-sm text-gray-600 hover:text-gray-900">
                Contact
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({ icon, title, description }) {
  return (
    <div className="bg-white p-8 rounded-xl shadow-sm flex flex-col items-center text-center">
      <div className="mb-4">{icon}</div>
      <h3 className="text-xl font-semibold mb-3">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  )
}
