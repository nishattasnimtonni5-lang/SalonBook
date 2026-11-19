"use client"

import { useState } from "react"
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
  // per customer. Booking still works without a session (as before).
  const { data: session } = authClient.useSession()
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
  if (!selectedDate || !selectedTime) return

  try {
    setLoading(true)

    const response = await fetch("http://localhost:8000/appointments", {
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
        userId: session?.user?.id ?? "",
        customerName: session?.user?.name ?? "",
        customerEmail: session?.user?.email ?? "",
      }),
    })

    const data = await response.json()

    if (response.ok) {
      alert("Appointment booked successfully!")
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