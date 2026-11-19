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
      url: "#",
     
      isActive: true,
      
    },
    {
      title: "Book Appointment",
      url: "/services",
 

    },
    {
      title: "My Appointments",
      url: "/dashboard/my-appointments",
      
    },
    {
      title: "Booking History",
      url: "/dashboard/booking-history",
     
    },
    {
      title: "Favourites",
      url: "/dashboard/favourites",
     
    },
    {
      title: "My offers",
      url: "#",
     
    },
    {
      title: "Report an issue",
      url: "/dashboard/report-an-issue",
     
    },
  ],
 
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data: session } = authClient.useSession()

  const user = session
    ? {
        name: session.user.name,
        email: session.user.email,
        avatar: session.user.image ?? "",
      }
    : data.user

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
       
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
       
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
