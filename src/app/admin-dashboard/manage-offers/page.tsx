"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { OFFERS_API_URL } from "@/app/lib/api/config";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Field, FieldLabel } from "@/components/ui/field";
import { toast } from "@/components/ui/toast";

type Service = {
  _id: string;
  name: string;
  category: string;
  price: number;
  status: string;
};

type Offer = {
  _id: string;
  title: string;
  image?: string;
  description: string;
  discountType: string;
  discountValue: number;
  category?: string;
  applicableService?: string;
  applicableServiceId?: string;
  expiryDate: string;
  promoCode?: string;
  status: string;
};

export default function ManageOffersPage() {
  const [imageUrl, setImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [discountType, setDiscountType] = useState("percentage");
  const [status, setStatus] = useState("active");
  const [category, setCategory] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loadingOffers, setLoadingOffers] = useState(true);
  const [deletingId, setDeletingId] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchServices = async () => {
    try {
      const res = await fetch(
        OFFERS_API_URL.replace(/\/offers\/?$/, "/services")
      );

      if (!res.ok) throw new Error("Failed to fetch services");

      const data = await res.json();
      setServices(data);
    } catch (error) {
      console.log(error);
      toast.add({
        type: "error",
        title: "Services not loaded",
        description: "Could not load available services.",
      });
    }
  };

  const fetchOffers = async () => {
    setLoadingOffers(true);

    try {
      const res = await fetch(OFFERS_API_URL);

      if (!res.ok) throw new Error("Failed to fetch offers");

      const data = await res.json();
      setOffers(data);
    } catch (error) {
      console.log(error);
      toast.add({
        type: "error",
        title: "Offers not loaded",
        description: "Could not load existing offers.",
      });
    } finally {
      setLoadingOffers(false);
    }
  };

  useEffect(() => {
    fetchServices();
    fetchOffers();
  }, []);

  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const image = e.target.files?.[0];

    if (!image) return;

    const formData = new FormData();
    formData.append("image", image);

    setUploading(true);

    toast.add({
      id: "offer-image",
      type: "loading",
      title: "Uploading image…",
      description: "Please wait while we upload the offer banner.",
    });

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data: { url?: string; error?: string } = await res.json();

      if (!res.ok || !data.url) {
        toast.add({
          id: "offer-image",
          type: "error",
          title: "Image upload failed",
          description:
            data.error ||
            "We could not upload that image. Please try another one.",
        });
        return;
      }

      setImageUrl(data.url);

      toast.add({
        id: "offer-image",
        type: "success",
        title: "Image uploaded",
        description: "The offer banner is ready to use.",
      });
    } catch (error) {
      console.log(error);
      toast.add({
        id: "offer-image",
        type: "error",
        title: "Image upload failed",
        description:
          "We could not reach the upload service. Please check your connection and try again.",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    const form = e.currentTarget;
    const submitToastId = "add-offer";

    if (!imageUrl) {
      toast.add({
        id: submitToastId,
        type: "error",
        title: "Offer image required",
        description:
          "Please upload an offer image before publishing this offer.",
      });
      return;
    }

    const selectedService = services.find(
      (service) => service._id === selectedServiceId
    );

    if (!selectedService) {
      toast.add({
        id: submitToastId,
        type: "error",
        title: "Service required",
        description: "Please select a service for this offer.",
      });
      return;
    }

    const formData = new FormData(form);

    const offerData = {
      title: formData.get("title"),
      image: imageUrl,
      description: formData.get("description"),
      discountType,
      discountValue: Number(formData.get("discountValue")),
      category: selectedService.category || category,
      applicableService: selectedService.name,
      applicableServiceId: selectedService._id,
      startDate: formData.get("startDate"),
      expiryDate: formData.get("expiryDate"),
      promoCode: formData.get("promoCode"),
      status,
    };

    setSubmitting(true);

    toast.add({
      id: submitToastId,
      type: "loading",
      title: "Publishing offer…",
      description: "Saving this promotion to your offers list.",
    });

    try {
      const res = await fetch(OFFERS_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(offerData),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.add({
          id: submitToastId,
          type: "error",
          title: "Offer not published",
          description: data.message || "Failed to publish offer.",
        });
        return;
      }

      toast.add({
        id: submitToastId,
        type: "success",
        title: "Offer published",
        description: "Your new offer is now live on the site.",
      });

      form.reset();
      setImageUrl("");
      setCategory("");
      setSelectedServiceId("");
      setDiscountType("percentage");
      setStatus("active");

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      await fetchOffers();
    } catch (error) {
      console.log(error);
      toast.add({
        id: submitToastId,
        type: "error",
        title: "Offer not published",
        description:
          "We could not reach the server. Please check your connection and try again.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this offer?"
    );

    if (!confirmed) return;

    setDeletingId(id);

    try {
      const res = await fetch(`${OFFERS_API_URL}/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok) {
        toast.add({
          type: "error",
          title: "Delete failed",
          description: data.message || "Could not delete this offer.",
        });
        return;
      }

      toast.add({
        type: "success",
        title: "Offer deleted",
        description: "The offer has been deleted successfully.",
      });

      setOffers((previous) =>
        previous.filter((offer) => offer._id !== id)
      );
    } catch (error) {
      console.log(error);
      toast.add({
        type: "error",
        title: "Delete failed",
        description: "Could not reach the server.",
      });
    } finally {
      setDeletingId("");
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Manage Offers</h1>
        <p className="text-muted-foreground">
          Create and manage salon promotional offers.
        </p>
      </div>

      <Card className="max-w-3xl">
        <CardHeader>
          <CardTitle>Create New Offer</CardTitle>
          <CardDescription>
            Fill in the details to publish a new salon offer.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="title">Offer Title</Label>
              <Input
                id="title"
                name="title"
                placeholder="e.g. Winter Glow Special"
                required
              />
            </div>

            <div className="space-y-2">
              <Field>
                <FieldLabel htmlFor="image">Offer Image</FieldLabel>

                <Input
                  id="image"
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  className="hidden"
                />

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  {uploading ? "Uploading..." : "Upload Offer Image"}
                </Button>

                {imageUrl && (
                  <Image
                    src={imageUrl}
                    alt="Offer Preview"
                    width={600}
                    height={300}
                    unoptimized
                    className="h-48 w-full rounded-lg object-cover"
                  />
                )}
              </Field>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Describe your special offer..."
                rows={4}
                required
              />
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Discount Type</Label>

                <Select
                  value={discountType}
                  onValueChange={(value) => {
                    if (value) setDiscountType(value);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select discount type" />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value="percentage">
                      Percentage (%)
                    </SelectItem>
                    <SelectItem value="fixed">
                      Fixed Amount (৳)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="discountValue">Discount Value</Label>

                <Input
                  id="discountValue"
                  name="discountValue"
                  type="number"
                  min="1"
                  max={discountType === "percentage" ? "100" : undefined}
                  placeholder={
                    discountType === "percentage" ? "20" : "500"
                  }
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Applicable Service</Label>

              <Select
                value={selectedServiceId}
                onValueChange={(value) => {
                  if (value) {
                    setSelectedServiceId(value);

                    const service = services.find(
                      (item) => item._id === value
                    );

                    if (service) setCategory(service.category);
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a service" />
                </SelectTrigger>

                <SelectContent>
                  {services.map((service) => (
                    <SelectItem key={service._id} value={service._id}>
                      {service.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {services.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No active services available.
                </p>
              )}
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  name="startDate"
                  type="date"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="expiryDate">Expiry Date</Label>
                <Input
                  id="expiryDate"
                  name="expiryDate"
                  type="date"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="promoCode">
                Promo Code (Optional)
              </Label>

              <Input
                id="promoCode"
                name="promoCode"
                placeholder="e.g. WINTER20"
              />
            </div>

            <div className="space-y-2">
              <Label>Status</Label>

              <Select
                value={status}
                onValueChange={(value) => {
                  if (value) setStatus(value);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              type="submit"
              disabled={
                submitting ||
                uploading ||
                services.length === 0 ||
                !selectedServiceId
              }
              className="w-full bg-rose-600 hover:bg-rose-700"
            >
              {submitting ? "Publishing..." : "Publish Offer"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Existing Offers</CardTitle>
          <CardDescription>
            View and manage all your salon offers.
          </CardDescription>
        </CardHeader>

        <CardContent>
          {loadingOffers ? (
            <p className="text-muted-foreground">Loading offers...</p>
          ) : offers.length === 0 ? (
            <p className="text-muted-foreground">
              No offers available yet.
            </p>
          ) : (
            <div className="space-y-4">
              {offers.map((offer) => (
                <div
                  key={offer._id}
                  className="flex flex-col gap-4 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-center gap-4">
                    {offer.image && (
                      <Image
                        src={offer.image}
                        alt={offer.title}
                        width={100}
                        height={80}
                        unoptimized
                        className="h-20 w-24 rounded-md object-cover"
                      />
                    )}

                    <div>
                      <h3 className="font-semibold">{offer.title}</h3>

                      <p className="text-sm text-muted-foreground">
                        {offer.applicableService || offer.category || "All services"}
                      </p>

                      <p className="text-sm">
                        {offer.discountType === "percentage"
                          ? `${offer.discountValue}% off`
                          : `৳${offer.discountValue} off`}
                      </p>

                      <p className="text-xs text-muted-foreground">
                        Expires: {offer.expiryDate}
                      </p>

                      <span
                        className={`mt-1 inline-block rounded-full px-2 py-1 text-xs ${
                          offer.status === "active"
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {offer.status}
                      </span>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="destructive"
                    disabled={deletingId === offer._id}
                    onClick={() => handleDelete(offer._id)}
                  >
                    {deletingId === offer._id ? "Deleting..." : "Delete"}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}