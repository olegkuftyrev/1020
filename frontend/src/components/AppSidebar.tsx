import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"

export function AppSidebar() {
  return (
    <Sidebar className="bg-card/80 backdrop-blur-md border-r border-primary/20" variant="inset" collapsible="icon">
      <SidebarHeader className="border-b border-primary/10 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 text-primary font-bold text-lg iron-glow">
            PE
          </div>
          <div className="flex flex-col gap-0.5 group-data-[collapsible=icon]:hidden">
            <div className="text-sm font-bold text-foreground iron-text-glow tracking-wide">
              PANDA EXPRESS
            </div>
            <div className="text-xs text-muted-foreground">
              Dashboard
            </div>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent className="p-2">
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold text-primary/80 iron-text-glow px-2 mb-2">
            NAVIGATION
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  className="rounded-lg border border-primary/20 bg-transparent hover:bg-primary/10 hover:border-primary/40 hover:text-primary transition-all duration-200"
                  isActive
                >
                  <span className="font-medium">Dashboard</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  className="rounded-lg border border-primary/20 bg-transparent hover:bg-primary/10 hover:border-primary/40 hover:text-primary transition-all duration-200"
                >
                  <span className="font-medium">Store Data</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  className="rounded-lg border border-primary/20 bg-transparent hover:bg-primary/10 hover:border-primary/40 hover:text-primary transition-all duration-200"
                >
                  <span className="font-medium">Reports</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  className="rounded-lg border border-primary/20 bg-transparent hover:bg-primary/10 hover:border-primary/40 hover:text-primary transition-all duration-200"
                >
                  <span className="font-medium">Settings</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}
