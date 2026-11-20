
"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
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

export default function ManageOffersPage() {
  const [imageUrl, setImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [discountType, setDiscountType] = useState("percentage");
  const [status, setStatus] = useState("active");
  const [category, setCategory] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const image = e.target.files?.[0];

    if (!image) return;

    const formData = new FormData();
    formData.append("image", image);

    setUploading(true);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data: { url?: string; error?: string } = await res.json();

      if (!res.ok || !data.url) {
        alert(data.error || "Image upload failed");
        return;
      }

      setImageUrl(data.url);
      alert("Image uploaded successfully!");
    } catch (error) {
      console.log(error);
      alert("Something went wrong");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    const form = e.currentTarget;

    if (!imageUrl) {
      alert("Please upload an offer image first.");
      return;
    }

    if (!category) {
      alert("Please select a category.");
      return;
    }

    const formData = new FormData(form);

    const offerData = {
      title: formData.get("title"),
      image: imageUrl,
      description: formData.get("description"),
      discountType,
      discountValue: Number(formData.get("discountValue")),
      category,
      startDate: formData.get("startDate"),
      expiryDate: formData.get("expiryDate"),
      promoCode: formData.get("promoCode"),
      status,
    };

    setSubmitting(true);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/offers`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(offerData),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Failed to publish offer.");
        return;
      }

      alert("Offer published successfully!");

      form.reset();
      setImageUrl("");
      setCategory("");
      setDiscountType("percentage");
      setStatus("active");

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      console.log(error);
      alert("Something went wrong!");
    } finally {
      setSubmitting(false);
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
                    if (value) setDiscountType(value)
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
                <Label htmlFor="discountValue">
                  Discount Value
                </Label>

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
              <Label>Applicable Category</Label>

              <Select
                value={category}
                onValueChange={(value) => {
                  if (value) setCategory(value)
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="all">All Services</SelectItem>
                  <SelectItem value="hair">Hair</SelectItem>
                  <SelectItem value="facial">Facial & Skin Care</SelectItem>
                  <SelectItem value="makeup">Makeup</SelectItem>
                  <SelectItem value="nail">Nail Care</SelectItem>
                  <SelectItem value="spa">Spa & Massage</SelectItem>
                  <SelectItem value="waxing">Waxing & Threading</SelectItem>
                </SelectContent>
              </Select>
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
                  if (value) setStatus(value)
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
              disabled={submitting || uploading}
              className="w-full bg-rose-600 hover:bg-rose-700"
            >
              {submitting ? "Publishing..." : "Publish Offer"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}