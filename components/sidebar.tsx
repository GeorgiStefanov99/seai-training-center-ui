"use client"

import { useState, useEffect } from "react"
import {
  BarChart2,
  GraduationCap,
  User,
  X,
  ChevronRight,
  ChevronLeft,
  BookOpen,
  ClipboardList,
  Calendar,
  Video,
  Archive,
  FileText,
  DollarSign,
  Scan,
  NotebookTabs,
  FolderOpen,
  Key
  
} from "lucide-react"
import { usePathname } from "next/navigation"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from "@/hooks/useAuth"

const getMenuItems = (userType: string) => {
  const commonItems = [
    { name: "Smart Scanner", icon: Scan, href: "/smart-scanner" },
    { name: "Dashboard", icon: BarChart2, href: "/dashboard" },
    { name: "Financial Dashboard", icon: DollarSign, href: "/financial-dashboard" },
    { name: "Attendees", icon: User, href: "/attendees" },
    { name: "Contacts", icon: NotebookTabs, href: "/contacts" },
    { name: "Course Templates", icon: BookOpen, href: "/course-templates" },
    { name: "Active Courses", icon: Calendar, href: "/active-courses" },
    { name: "Online Courses", icon: Video, href: "/online-courses" },
    { name: "Waitlist", icon: ClipboardList, href: "/waitlist" },
            { name: "Archive", icon: Archive, href: "/active-courses/archive" },
    { name: "Documents", icon: FileText, href: "/documents" },
    { name: "Internal Documents", icon: FolderOpen, href: "/internal-documents" },
  ]

  return commonItems

  }


interface SidebarProps {
  mobileMenuOpen?: boolean
  onMobileMenuToggle?: () => void
}

export function Sidebar({ mobileMenuOpen = false, onMobileMenuToggle }: SidebarProps) {
  const pathname = usePathname()
  const [sidebarExpanded, setSidebarExpanded] = useState(false)
  const { user, logout } = useAuth()
  const menuItems = getMenuItems("user")

  const toggleMobileMenu = () => {
    onMobileMenuToggle?.()
  }

  const toggleSidebar = () => {
    setSidebarExpanded(!sidebarExpanded)
  }

  useEffect(() => {
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
      {/* Desktop Sidebar */}
      <div className="hidden md:block fixed top-0 left-0 h-full bg-primary text-primary-foreground shadow-lg flex flex-col transition-all duration-300 ease-in-out z-30">
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
                href={item.href}
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
                  <div className="flex flex-col gap-1 mt-1">
                    <a href="/change-password">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-primary-foreground hover:bg-primary-foreground/10 w-full justify-start h-7 px-2"
                      >
                        <Key className="h-3 w-3 mr-2" />
                        Change Password
                      </Button>
                    </a>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={logout}
                      className="text-primary-foreground hover:bg-primary-foreground/10 w-full justify-start h-7 px-2"
                    >
                      Logout
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Mobile Menu */}
      <div
        className={`fixed inset-0 z-[60] bg-background/80 backdrop-blur-sm transition-all duration-200 md:hidden ${
          mobileMenuOpen ? "block" : "hidden"
        }`}
        onClick={toggleMobileMenu}
      >
        <div 
          className="fixed inset-y-0 left-0 z-[61] h-full w-64 sm:w-72 overflow-y-auto bg-primary p-4 shadow-2xl transform transition-transform duration-300 ease-out"
          style={{
            transform: mobileMenuOpen ? 'translateX(0)' : 'translateX(-100%)'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-6">
            <a href="/" className="flex items-center gap-2 font-semibold text-primary-foreground">
              <img
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/seai-white-logo-GFPDoVoIqDrc4iNcbZ6LSzgWXQameO.png"
                alt="SeAI Logo"
                className="h-7 w-auto"
              />
            </a>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={toggleMobileMenu} 
              className="text-primary-foreground hover:bg-primary-foreground/10 h-8 w-8"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          <nav className="space-y-1">
            {menuItems.map((item) => (
              <a
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-3 text-primary-foreground transition-colors hover:bg-primary-foreground/10 ${
                  pathname === item.href ? "bg-primary-foreground/20" : ""
                }`}
                onClick={toggleMobileMenu}
              >
                <item.icon className="h-5 w-5" />
                <span className="font-medium">{item.name}</span>
              </a>
            ))}
          </nav>
          {user && (
            <div className="mt-6 pt-4 border-t border-primary-foreground/20">
              <div className="flex items-center gap-3 px-3 py-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage alt={user?.email || ''} />
                  <AvatarFallback className="text-xs">{user?.email ? user.email[0].toUpperCase() : 'U'}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col flex-1 min-w-0">
                  <span className="text-sm font-medium text-primary-foreground truncate">{user.email}</span>
                  <div className="flex flex-col gap-1 mt-1">
                    <a href="/change-password" onClick={toggleMobileMenu}>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs text-primary-foreground hover:bg-primary-foreground/10 h-6 px-0 justify-start w-full"
                      >
                        <Key className="h-3 w-3 mr-2" />
                        Change Password
                      </Button>
                    </a>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={logout}
                      className="text-xs text-primary-foreground hover:bg-primary-foreground/10 h-6 px-0 justify-start"
                    >
                      Logout
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </TooltipProvider>
  )
}
