"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  ScrollText,
  Scale,
  MessageSquareQuote,
  ArrowUpRight,
} from "lucide-react"

const NAV = [
  { href: "/app", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/app/compliance", label: "Compliance", icon: ScrollText },
  { href: "/app/licenses", label: "Licenses", icon: Scale },
  { href: "/app/assistant", label: "Assistant", icon: MessageSquareQuote },
]

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const active = (item: (typeof NAV)[number]) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href)

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex max-w-[1400px]">
        {/* Sidebar */}
        <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-border px-3 py-5 md:flex">
          <Link href="/" className="mb-8 flex items-center gap-2 px-2 font-display text-lg font-semibold">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-primary text-primary-foreground">
              🦖
            </span>
            DocZilla
          </Link>
          <nav className="flex flex-1 flex-col gap-1">
            {NAV.map((item) => {
              const Icon = item.icon
              const isActive = active(item)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
                    isActive
                      ? "bg-primary/10 font-medium text-primary"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              )
            })}
          </nav>
          <Link
            href="/"
            className="flex items-center justify-between rounded-lg px-3 py-2 text-xs text-muted-foreground transition hover:text-foreground"
          >
            Back to site <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </aside>

        {/* Mobile top nav */}
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-center gap-1 overflow-x-auto border-b border-border px-3 py-2 md:hidden">
            {NAV.map((item) => {
              const isActive = active(item)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-sm ${
                    isActive ? "bg-primary/10 text-primary" : "text-muted-foreground"
                  }`}
                >
                  {item.label}
                </Link>
              )
            })}
          </div>
          <main className="min-w-0 flex-1">{children}</main>
        </div>
      </div>
    </div>
  )
}

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string
  description?: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border px-6 py-6 lg:px-10">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight">{title}</h1>
        {description && (
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {action}
    </div>
  )
}
