"use client"

import { useMemo, useState } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar } from "@/components/ui/calendar"
import { authClient } from "@/app/lib/auth-client"
import { toast } from "@/components/ui/toast"
import { API_BASE_URL } from "@/app/lib/api/config"

type AppointmentFormProps = {
  service: {
    id: string
    name: string
    image: string
    price: number
    duration: string
    status?: string
  }
  offer?: {
    id: string
    title: string
    discountType: "percentage" | "fixed"
    discountValue: number
    promoCode: string
  }
}

function offerFromSearchParams(params: {
  get: (key: string) => string | null
}): AppointmentFormProps["offer"] | null {
  const offerId = params.get("offerId")
  const offerTitle = params.get("offerTitle")
  const discountType = params.get("discountType")
  const discountValue = Number(params.get("discountValue"))

  if (!offerId || !offerTitle) return null

  return {
    id: offerId,
    title: offerTitle,
    discountType: discountType === "fixed" ? "fixed" : "percentage",
    discountValue: Number.isFinite(discountValue) ? discountValue : 0,
    promoCode: params.get("promoCode") ?? "",
  }
}

export default function AppointmentForm({ service, offer }: AppointmentFormProps) {
  const [selectedDate, setSelectedDate] = useState<Date>()
  const [selectedTime, setSelectedTime] = useState("")
  const [phone, setPhone] = useState("")
  const [loading, setLoading] = useState(false)

  const searchParams = useSearchParams()

  const appliedOffer = useMemo(() => {
    const offerFromUrl = offerFromSearchParams(searchParams)
    const activeOffer = offerFromUrl ?? offer ?? null

    if (!activeOffer || !service) return null

    const basePrice = Number(service.price) || 0

    const finalPrice =
      activeOffer.discountType === "percentage"
        ? basePrice - (basePrice * Number(activeOffer.discountValue || 0)) / 100
        : basePrice - Number(activeOffer.discountValue || 0)

    return {
      ...activeOffer,
      originalPrice: basePrice,
      finalPrice: Math.max(0, Math.round(finalPrice * 100) / 100),
    }
  }, [offer, service, searchParams])

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
    const bookingToastId = "book-appointment"

    try {
      setLoading(true)

      const currentUser =
        session ?? (await authClient.getSession()).data

      if (!currentUser?.user) {
        router.push(`/signin?callbackURL=${encodeURIComponent(pathname)}`)
        return
      }

      const role = (currentUser.user as { role?: string }).role

      if (service.status && service.status !== "active") {
        toast.add({
          id: bookingToastId,
          type: "error",
          title: "Booking not available",
          description: "This service is currently inactive.",
        })
        return
      }

      if (role === "admin") {
        toast.add({
          id: bookingToastId,
          type: "error",
          title: "Booking not allowed",
          description:
            "Admins are not allowed to submit customer appointment requests.",
        })
        return
      }

      if (!selectedDate || !selectedTime) {
        toast.add({
          id: bookingToastId,
          type: "error",
          title: "Missing booking details",
          description: "Please select both an appointment date and a time slot.",
        })
        return
      }

      const existingRes = await fetch(`${API_BASE_URL}/appointments`, {
        cache: "no-store",
      })

      const existingData = await existingRes.json().catch(() => [])
      const existingList = Array.isArray(existingData)
        ? existingData
        : existingData?.appointments ?? []

      const duplicate = existingList.some(
  (a: {
    serviceId?: string
    date?: string
    time?: string
  }) =>
    a.serviceId === service.id &&
    a.date === selectedDate.toISOString().split("T")[0] &&
    a.time === selectedTime,
)

      if (duplicate) {
        toast.add({
          id: bookingToastId,
          type: "error",
          title: "Slot already booked",
          description:
            "This date and time is already taken. Please choose another slot.",
        })

        setLoading(false)
        return
      }

      toast.add({
        id: bookingToastId,
        type: "loading",
        title: "Booking your appointment…",
        description:
          "Please wait while we confirm your appointment details.",
      })

      const response = await fetch(`${API_BASE_URL}/appointments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          serviceId: service.id,
          serviceName: service.name,
          serviceImage: service.image,
          price: appliedOffer ? appliedOffer.finalPrice : service.price,
          duration: service.duration,
          ...(appliedOffer
            ? {
                offerId: appliedOffer.id,
                offerTitle: appliedOffer.title,
                offerDiscountType: appliedOffer.discountType,
                offerDiscountValue: appliedOffer.discountValue,
                offerPromoCode: appliedOffer.promoCode,
                originalPrice: appliedOffer.originalPrice,
              }
            : {}),
          date: selectedDate.toISOString().split("T")[0],
          time: selectedTime,
          userId: currentUser.user.id ?? "",
          customerName: currentUser.user.name ?? "",
          customerEmail: currentUser.user.email ?? "",
          customerPhone: phone,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        toast.add({
          id: bookingToastId,
          type: "success",
          title: "Appointment Booked Successfully! 🎉",
          description:
            "Your appointment has been booked. You can make payment anytime from My Appointments in your dashboard.",
        })

        setSelectedDate(undefined)
        setSelectedTime("")
      } else {
        toast.add({
          id: bookingToastId,
          type: "error",
          title: "Booking failed",
          description:
            data.message ||
            "We could not create your appointment. Please try again.",
        })
      }
    } catch (error) {
      console.log(error)

      toast.add({
        id: bookingToastId,
        type: "error",
        title: "Booking failed",
        description:
          "We could not reach the booking service. Please check your connection and try again.",
      })
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

          {appliedOffer ? (
            <>
              <p className="text-sm text-muted-foreground">
                Offer:{" "}
                <span className="font-semibold text-rose-600">
                  {appliedOffer.title}
                </span>
                {appliedOffer.promoCode
                  ? ` (${appliedOffer.promoCode})`
                  : ""}
              </p>

              <p>
                Original price:{" "}
                <span className="line-through">
                  ${appliedOffer.originalPrice}
                </span>
              </p>

              <p>
                Discounted price:{" "}
                <span className="font-semibold text-rose-600">
                  ${appliedOffer.finalPrice}
                </span>
              </p>
            </>
          ) : (
            <p>Price: ${service.price}</p>
          )}

          <p>Duration: {service.duration}</p>
        </div>

        <div>
          <h3 className="mb-3 font-semibold">Select Appointment Date</h3>

          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            disabled={(date) =>
              date < new Date(new Date().setHours(0, 0, 0, 0))
            }
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

        <div>
          <h3 className="mb-2 font-semibold">Phone number</h3>

          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="01XXXXXXXXX"
            className="w-full rounded-md border px-3 py-2"
            required
          />
        </div>

        <Button
          className="w-full"
          disabled={
            !selectedDate ||
            !selectedTime ||
            loading ||
            (service.status !== "active" && !!service.status)
          }
          onClick={handleBooking}
        >
          {loading ? "Booking..." : "Book Appointment"}
        </Button>
      </CardContent>
    </Card>
  )
}