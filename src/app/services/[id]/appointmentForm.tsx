"use client"

import { useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar } from "@/components/ui/calendar"
import { authClient } from "@/app/lib/auth-client"

type AppointmentFormProps = {
  service: {
    id: string
    name: string
    image: string
    price: number
    duration: string
  }
}

export default function AppointmentForm({ service }: AppointmentFormProps) {
  const [selectedDate, setSelectedDate] = useState<Date>()
  const [selectedTime, setSelectedTime] = useState("")
const [loading, setLoading] = useState(false)
  // Attach the signed-in customer so booking history can be shown
  // per customer. Visitors are asked to sign in when they book.
  const { data: session } = authClient.useSession()
  const router = useRouter()
  const pathname = usePathname()
  const timeSlots = [
    "10:00 AM",
    "11:00 AM",
    "12:00 PM",
    "02:00 PM",
    "03:00 PM",
    "04:00 PM",
    "05:00 PM",
  ]
const handleBooking = async () => {
  try {
    setLoading(true)

    // Customers must be authenticated to submit an appointment request.
    // Fall back to a fresh lookup in case the cached session hook has
    // not resolved yet.
    const currentUser =
      session ?? (await authClient.getSession()).data

    if (!currentUser?.user) {
      router.push(`/signin?callbackURL=${encodeURIComponent(pathname)}`)
      return
    }

    const role = (currentUser.user as { role?: string }).role

    if (role === "admin") {
      alert("Admins are not allowed to submit customer appointment requests.")
      return
    }

    if (!selectedDate || !selectedTime) return

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/bookings/create-checkout-session`,
      {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        serviceId: service.id,
        serviceName: service.name,
        serviceImage: service.image,
        price: service.price,
        duration: service.duration,
        date: selectedDate.toISOString().split("T")[0],
        time: selectedTime,
        userId: currentUser.user.id ?? "",
        customerName: currentUser.user.name ?? "",
        customerEmail: currentUser.user.email ?? "",
      }),
      },
    )

    const data = await response.json()

    if (response.ok) {
      const redirectUrl =
        data?.data?.redirectUrl ??
        data?.redirectUrl ??
        data?.url

      if (!redirectUrl) {
        alert("Stripe checkout URL was not returned by the server.")
        return
      }

      window.location.assign(redirectUrl)
    } else {
      alert(data.message || "Booking failed!")
    }
  } catch (error) {
    console.log(error)
    alert("Something went wrong!")
  } finally {
    setLoading(false)
  }
}
  return (
    <Card>
      <CardHeader>
        <CardTitle>Book Your Appointment</CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        <div>
          <h3 className="mb-2 font-semibold">{service.name}</h3>
          <p>Price: ${service.price}</p>
          <p>Duration: {service.duration}</p>
        </div>

        <div>
          <h3 className="mb-3 font-semibold">Select Appointment Date</h3>

          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
          />
        </div>

        <div>
          <h3 className="mb-3 font-semibold">Select Appointment Time</h3>

<div className="grid grid-cols-3 gap-2">
  {timeSlots.map((time) => (
    <Button
      key={time}
      type="button"
      variant={selectedTime === time ? "default" : "outline"}
      onClick={() => setSelectedTime(time)}
    >
      {time}
    </Button>
  ))}
</div>
</div>
<Button
  className="w-full"
  disabled={!selectedDate || !selectedTime || loading}
  onClick={handleBooking}
>
  {loading ? "Booking..." : "Book Appointment"}
</Button>
      </CardContent>
    </Card>
  )
}