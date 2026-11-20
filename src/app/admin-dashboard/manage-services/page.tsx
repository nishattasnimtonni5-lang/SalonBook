
"use client";

import {useRef, useState } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Image from "next/image";
import { Field, FieldLabel } from "@/components/ui/field";

export default function ManageServicesPage() {
  const [featured, setFeatured] = useState(false);
 const [imageUrl, setImageUrl] = useState("")
  const [uploading, setUploading] = useState(false)
const [status, setStatus] = useState("active");
const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const image = e.target.files?.[0]

    if (!image) return

    const formData = new FormData()
    formData.append("image", image)

    setUploading(true)

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })
      const data: { url?: string; error?: string } = await res.json()

      if (!res.ok || !data.url) {
        alert(data.error || "Image upload failed")
        return
      }

      setImageUrl(data.url)
    } catch (error) {
      console.log(error)
      alert("Something went wrong")
    } finally {
      setUploading(false)
    }
  }
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();

  if (!imageUrl) {
    alert("Please upload a service image first.");
    return;
  }

  const formData = new FormData(e.currentTarget);

  const serviceData = {
    name: formData.get("name"),
    category: formData.get("category"),
    price: Number(formData.get("price")),
    duration: Number(formData.get("duration")),
    description: formData.get("description"),
    image: imageUrl,
    featured,
    status,
  };

  setSubmitting(true);

  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/services`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(serviceData),
      }
    );

    const data = await res.json();

    if (!res.ok) {
      alert(data.message || "Failed to add service");
      return;
    }

    alert("Service added successfully!");
    e.currentTarget.reset();
    const form = e.currentTarget;
    form.reset();
    setImageUrl("");
    setFeatured(false);
    setStatus("active");
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
        <h1 className="text-3xl font-bold">Manage Services</h1>
        <p className="text-muted-foreground">
          Add and manage salon services.
        </p>
      </div>

      <Card className="max-w-3xl">
        <CardHeader>
          <CardTitle>Add New Service</CardTitle>
          <CardDescription>
            Fill in the details to add a new salon service.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name">Service Name</Label>
              <Input
                id="name"
                name="name"
                placeholder="e.g. Hair Coloring"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                name="category"
                placeholder="e.g. Hair"
                required
              />
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="price">Price</Label>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  placeholder="1500"
                  min="0"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration">Duration (minutes)</Label>
                <Input
                  id="duration"
                  name="duration"
                  type="number"
                  placeholder="60"
                  min="1"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Describe the service..."
                rows={4}
                required
              />
            </div>

            <div className="space-y-2">
        <Field>
                <div className="flex items-center">
         <FieldLabel htmlFor="image">Profile image</FieldLabel>
                </div>

                <Input
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
                  {uploading ? "Uploading..." : "Upload Image"}
                </Button>

                {imageUrl && (
                  <Image
                    src={imageUrl}
                    alt="Profile"
                    width={48}
                    height={48}
                    className="h-12 w-12 rounded-full object-cover"
                  />
                )}
              </Field>
            </div>

            <div className="flex items-center gap-3">
              <Checkbox
                id="featured"
                checked={featured}
                onCheckedChange={(checked) =>
                  setFeatured(checked === true)
                }
              />
              <Label htmlFor="featured">
                Show as Featured Service
              </Label>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select
  value={status}
                onValueChange={(value) => setStatus(value ?? "active")}
>
  <SelectTrigger>
    <SelectValue placeholder="Select status" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="active">Available</SelectItem>
    <SelectItem value="inactive">Unavailable</SelectItem>
  </SelectContent>
</Select>
            </div>

            <Button
  type="submit"
  disabled={submitting || uploading}
  className="w-full bg-rose-600 hover:bg-rose-700"
>
  {submitting ? "Adding Service..." : "Add Service"}
</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
