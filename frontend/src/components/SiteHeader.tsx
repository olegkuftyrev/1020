import { useState } from "react"
import { Link, useLocation } from "react-router-dom"
import { useAuthStore } from "@/stores/authStore"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { cn } from "@/lib/utils"

const navigation = [
  { name: "Dashboard", href: "/dashboard" },
  { name: "Store Data", href: "/store-data" },
  { name: "Reports", href: "/reports" },
  { name: "Settings", href: "/settings" },
]

export function SiteHeader() {
  const { logout } = useAuthStore()
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="border-b border-primary/20 bg-card/60 backdrop-blur-md sticky top-0 z-30">
      <div className="flex h-14 shrink-0 items-center gap-4 px-6">
        <div className="flex items-center gap-3 flex-1">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 text-primary font-bold text-sm iron-glow">
            PE
          </div>
          
          <nav className="hidden md:flex items-center gap-1">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-primary/10 text-primary border border-primary/30"
                      : "text-muted-foreground hover:text-foreground hover:bg-primary/5"
                  )}
                >
                  {item.name}
                </Link>
              )
            })}
          </nav>

          {/* Mobile Menu */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="md:hidden text-muted-foreground hover:text-foreground hover:bg-primary/5"
              >
                Menu
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="bg-card border-primary/20 w-[250px]">
              <SheetHeader>
                <SheetTitle className="text-primary iron-text-glow">Navigation</SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-2 mt-6">
                {navigation.map((item) => {
                  const isActive = location.pathname === item.href
                  return (
                    <Link
                      key={item.href}
                      to={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        "px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200",
                        isActive
                          ? "bg-primary/20 text-primary border border-primary/30 iron-glow"
                          : "text-muted-foreground hover:text-foreground hover:bg-primary/10"
                      )}
                    >
                      {item.name}
                    </Link>
                  )
                })}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
        
        <div className="flex items-center gap-3">
          <Separator orientation="vertical" className="h-5 bg-primary/20" />
          <Button
            onClick={logout}
            variant="outline"
            className="rounded-lg border border-primary/20 bg-transparent hover:bg-primary/10 hover:border-primary/40 hover:text-primary transition-all duration-200 font-medium"
          >
            Logout
          </Button>
        </div>
      </div>
    </header>
  )
}
