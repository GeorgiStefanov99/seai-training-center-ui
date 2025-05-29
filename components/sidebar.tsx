"use client"

import { useState, useEffect } from "react"
import {
  BarChart2,
  GraduationCap,
  User,
  X,
  ChevronRight,
  ChevronLeft,
} from "lucide-react"
import { usePathname } from "next/navigation"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from "@/hooks/useAuth"

const getMenuItems = (userType: string) => {
  const commonItems = [
    { name: "Dashboard", icon: BarChart2, href: "/dashboard" },
    { name: "Attendees", icon: User, href: "/attendees" },
  ]

  return commonItems

  }


export function Sidebar() {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [sidebarExpanded, setSidebarExpanded] = useState(false)
  const { user, logout } = useAuth()
  const menuItems = getMenuItems("user")

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen)
  }

  const toggleSidebar = () => {
    setSidebarExpanded(!sidebarExpanded)
  }

  useEffect(() => {
    setMobileMenuOpen(false)
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setSidebarExpanded(false)
      }
    }
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  return (
    <TooltipProvider delayDuration={0}>
      <div className="fixed top-0 left-0 h-full bg-primary text-primary-foreground shadow-lg flex flex-col transition-all duration-300 ease-in-out z-30">
        <div className={`flex-1 overflow-y-auto pt-16 ${sidebarExpanded ? "w-44" : "w-14"}`}>
          <div className="flex flex-col space-y-1 mt-2 px-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSidebar}
              className="w-full flex justify-center items-center p-1 mb-2 h-8 text-primary-foreground hover:bg-primary-foreground/10"
            >
              {sidebarExpanded ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </Button>
            {menuItems.map((item) => (
              <a
                key={item.name}
                href={`${item.href}/`}
                className={`flex items-center gap-2 rounded-md px-2 py-2 text-sm transition-colors hover:bg-primary-foreground/10 ${
                  pathname === item.href ? "bg-primary-foreground/20" : ""
                } ${sidebarExpanded ? "justify-start" : "justify-center"}`}
                onClick={() => {
                  if (sidebarExpanded) {
                    setSidebarExpanded(false)
                  }
                }}
              >
                <item.icon className="h-5 w-5" />
                {sidebarExpanded && <span>{item.name}</span>}
              </a>
            ))}
          </div>
        </div>
        {user && (
          <div className="border-t border-primary-foreground/20 p-4">
            <div className="flex items-center gap-2">
              <Avatar>
                <AvatarImage alt={user?.email || ''} />
                <AvatarFallback>{user?.email ? user.email[0].toUpperCase() : 'U'}</AvatarFallback>
              </Avatar>
              {sidebarExpanded && (
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{user.email}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={logout}
                    className="text-primary-foreground hover:bg-primary-foreground/10"
                  >
                    Logout
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Mobile Menu */}
      <div
        className={`fixed inset-0 z-50 bg-background/80 backdrop-blur-sm transition-all duration-100 data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=open]:fade-in md:hidden ${
          mobileMenuOpen ? "block" : "hidden"
        }`}
      >
        <div className="fixed inset-y-0 left-0 z-50 h-full w-2/3 overflow-y-auto bg-primary p-6 shadow-lg animate-in slide-in-from-left">
          <div className="flex items-center justify-between">
            <a href="/" className="flex items-center gap-2 font-semibold text-primary-foreground">
              <img
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/seai-white-logo-GFPDoVoIqDrc4iNcbZ6LSzgWXQameO.png"
                alt="SeAI Logo"
                className="h-8 w-auto"
              />
            </a>
            <Button variant="ghost" size="icon" onClick={toggleMobileMenu} className="text-primary-foreground">
              <X />
            </Button>
          </div>
          <nav className="mt-8">
            {menuItems.map((item) => (
              <a
                key={item.name}
                href={`${item.href}/`}
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-primary-foreground transition-colors hover:bg-primary-foreground/10"
                onClick={toggleMobileMenu}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.name}</span>
              </a>
            ))}
          </nav>
          {user && (
            <div className="mt-8 flex items-center gap-2">
              <Avatar>
                <AvatarImage alt={user?.email || ''} />
                <AvatarFallback>{user?.email ? user.email[0].toUpperCase() : 'U'}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-primary-foreground">{user.email}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={logout}
                  className="text-primary-foreground hover:bg-primary-foreground/10"
                >
                  Logout
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </TooltipProvider>
  )
}
