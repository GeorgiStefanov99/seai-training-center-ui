import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Toaster } from "@/components/ui/sonner"
import { AuthProvider } from "@/hooks/useAuth"
import { RootLayoutContent } from "@/components/root-layout-content"
import { AuthHeaderProvider } from "@/components/auth-header-provider"
import Script from "next/script"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "SeAI Training Center",
  description: "Comprehensive management platform for maritime training",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <Script
          id="microsoft-clarity"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function(c,l,a,r,i,t,y){
                c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
              })(window, document, "clarity", "script", "qxylqvr9e5");
            `
          }}
        />
      </head>
      <body className={inter.className} suppressHydrationWarning>
        <AuthProvider>
          <AuthHeaderProvider />
          <RootLayoutContent>
            {children}
          </RootLayoutContent>
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  )
}