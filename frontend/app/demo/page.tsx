import { redirect } from "next/navigation"

// The 3-tab demo has been folded into the unified /app workspace.
export default function DemoRedirect() {
  redirect("/app/compliance")
}
