"use client"

import * as React from "react"

import { NavMain } from "@/components/nav-main"

import { NavUser } from "@/components/nav-user"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import { authClient } from "@/app/lib/auth-client"


// This is sample data.
const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  
  navMain: [
    {
      title: "Overview",
      url: "/admin-dashboard",
     
      isActive: true,
      
    },
    {
      title: "Manage Services",
      url: "admin-dashboard/manage-services",
 

    },
    {
      title: "Manage Appointments",
      url: "/admin-dashboard/manage-appointments",
      
    },
    {
      title: "Manage offers",
      url: "/admin-dashboard/manage-offers",
     
    },

    {
      title: "Manage Reports",
      url: "/admin-dashboard/manage-reports",

    },
    {
      title: "Admin Profile",
      url: "/admin-dashboard/admin-profile",

    },
    
    
  ],
 
}

export function AdminSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data: session } = authClient.useSession()

  const user = session
  ? {
      name: session.user.name,
      email: session.user.email,
      avatar: session.user.image ?? "",
    }
  : data.user

const navItems = data.navMain
   

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
       
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navItems} />
       
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
