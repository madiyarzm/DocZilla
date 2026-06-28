import { redirect } from "next/navigation"

// The standalone dashboard chat now lives in the unified workspace.
export default function DashboardRedirect() {
  redirect("/app/assistant")
}
