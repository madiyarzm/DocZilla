import { redirect } from "next/navigation"

export default function SignupPage() {
  redirect("/auth/login")
  return null
}
