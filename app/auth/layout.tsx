"use client"

import { Card } from "@/components/ui/card"
import { MegaphoneIcon } from "lucide-react"
import Link from "next/link"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center text-center">
          <Link href="/" className="flex items-center space-x-2">
            <MegaphoneIcon className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold">DSEU Student Voice</span>
          </Link>
        </div>
        <Card className="p-6">
          {children}
        </Card>
      </div>
    </div>
  )
}