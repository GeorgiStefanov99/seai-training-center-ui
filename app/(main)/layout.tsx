import { RootLayoutContent } from "@/components/root-layout-content"

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <RootLayoutContent>
      {children}
    </RootLayoutContent>
  )
}
