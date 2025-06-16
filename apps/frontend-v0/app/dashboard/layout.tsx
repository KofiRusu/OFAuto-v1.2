import { Navigation } from "@/components/navigation"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="h-full relative">
      <div className="hidden h-full md:flex md:w-72 md:flex-col md:fixed md:inset-y-0 z-[80]">
        <Navigation />
      </div>
      <main className="md:pl-72 pb-10">
        <div className="h-full">{children}</div>
      </main>
    </div>
  )
}