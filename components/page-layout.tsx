import type React from "react"

interface PageLayoutProps {
  children: React.ReactNode
  title?: string
  fullWidth?: boolean
  reducedPadding?: boolean
}

export function PageLayout({ children, title, fullWidth = false, reducedPadding = false }: PageLayoutProps) {
  return (
    <div className={`pl-16 ${reducedPadding ? 'pt-8' : 'pt-16'} min-h-screen bg-background`}>
      <div className={`${fullWidth ? 'max-w-[95%]' : 'max-w-[1400px]'} mx-auto ${reducedPadding ? 'p-3' : 'p-6'}`}>
        {title && (
          <h1 className="text-2xl font-bold tracking-tight mb-6">{title}</h1>
        )}
        {children}
      </div>
    </div>
  )
}
