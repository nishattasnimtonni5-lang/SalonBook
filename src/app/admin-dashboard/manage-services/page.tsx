"use client";

import { useEffect, useRef, useState } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
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
  duration: number;
  description: string;
  image: string;
  featured: boolean;
  status: string;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const emptyService = {
  name: "",
  category: "",
  price: "",
  duration: "",
  description: "",
  image: "",
  featured: false,
  status: "active",
};

export default function ManageServicesPage() {
  const [featured, setFeatured] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState("active");
  const [submitting, setSubmitting] = useState(false);

  const [services, setServices] = useState<Service[]>([]);
  const [loadingServices, setLoadingServices] = useState(true);

  const [editingService, setEditingService] = useState<Service | null>(null);
  const [editData, setEditData] = useState(emptyService);
  const [editUploading, setEditUploading] = useState(false);
  const [updating, setUpdating] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  const fetchServices = async () => {
    setLoadingServices(true);

    try {
      const res = await fetch(`${API_URL}/admin/services`, {
  credentials: "include",
});
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to load services");
      }

      setServices(Array.isArray(data) ? data : data.services || []);
    } catch (error) {
      console.log(error);
      toast.add({
        id: "load-services",
        type: "error",
        title: "Services could not load",
        description: "Please check your server connection.",
      });
    } finally {
      setLoadingServices(false);
    }
  };

 useEffect(() => {
  const loadServices = async () => {
    await fetchServices();
  };

  loadServices();
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
      id: "service-image",
      type: "loading",
      title: "Uploading image...",
      description: "Please wait while we upload the service photo.",
    });

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data: { url?: string; error?: string } = await res.json();

      if (!res.ok || !data.url) {
        toast.add({
          id: "service-image",
          type: "error",
          title: "Image upload failed",
          description: data.error || "Please try another image.",
        });
        return;
      }

      setImageUrl(data.url);

      toast.add({
        id: "service-image",
        type: "success",
        title: "Image uploaded",
        description: "The service photo is ready to use.",
      });
    } catch (error) {
      console.log(error);
      toast.add({
        id: "service-image",
        type: "error",
        title: "Image upload failed",
        description: "Please check your connection and try again.",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleEditImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const image = e.target.files?.[0];

    if (!image) return;

    const formData = new FormData();
    formData.append("image", image);

    setEditUploading(true);

    toast.add({
      id: "edit-service-image",
      type: "loading",
      title: "Uploading image...",
      description: "Please wait.",
    });

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data: { url?: string; error?: string } = await res.json();

      if (!res.ok || !data.url) {
        toast.add({
          id: "edit-service-image",
          type: "error",
          title: "Image upload failed",
          description: data.error || "Please try another image.",
        });
        return;
      }

      setEditData((prev) => ({
        ...prev,
        image: data.url!,
      }));

      toast.add({
        id: "edit-service-image",
        type: "success",
        title: "Image uploaded",
        description: "New image is ready.",
      });
    } catch (error) {
      console.log(error);
      toast.add({
        id: "edit-service-image",
        type: "error",
        title: "Image upload failed",
        description: "Please check your connection.",
      });
    } finally {
      setEditUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const form = e.currentTarget;

    if (!imageUrl) {
      toast.add({
        id: "add-service",
        type: "error",
        title: "Service image required",
        description: "Please upload a service image.",
      });
      return;
    }

    const formData = new FormData(form);

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

    toast.add({
      id: "add-service",
      type: "loading",
      title: "Adding service...",
      description: "Saving the new service.",
    });

    try {
     const res = await fetch(`${API_URL}/services`, {
  method: "POST",
  credentials: "include",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify(serviceData),
});

      const data = await res.json();

      if (!res.ok) {
        toast.add({
          id: "add-service",
          type: "error",
          title: "Service not added",
          description: data.message || "Failed to add service.",
        });
        return;
      }

      toast.add({
        id: "add-service",
        type: "success",
        title: "Service added",
        description: "The new service has been added successfully.",
      });

      form.reset();
      setImageUrl("");
      setFeatured(false);
      setStatus("active");

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      fetchServices();
    } catch (error) {
      console.log(error);
      toast.add({
        id: "add-service",
        type: "error",
        title: "Service not added",
        description: "Could not connect to the server.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (service: Service) => {
    setEditingService(service);

    setEditData({
      name: service.name,
      category: service.category,
      price: String(service.price),
      duration: String(service.duration),
      description: service.description,
      image: service.image,
      featured: service.featured,
      status: service.status,
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!editingService) return;

    if (!editData.image) {
      toast.add({
        id: "update-service",
        type: "error",
        title: "Service image required",
        description: "Please upload a service image.",
      });
      return;
    }

    setUpdating(true);

    toast.add({
      id: "update-service",
      type: "loading",
      title: "Updating service...",
      description: "Saving your changes.",
    });

    try {
     const res = await fetch(`${API_URL}/services/${editingService._id}`, {
  method: "PATCH",
  credentials: "include",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    ...editData,
    price: Number(editData.price),
    duration: Number(editData.duration),
  }),
});

      const data = await res.json();

      if (!res.ok) {
        toast.add({
          id: "update-service",
          type: "error",
          title: "Update failed",
          description: data.message || "Could not update service.",
        });
        return;
      }

      toast.add({
        id: "update-service",
        type: "success",
        title: "Service updated",
        description: "Your service has been updated successfully.",
      });

      setEditingService(null);
      setEditData(emptyService);

      fetchServices();
    } catch (error) {
      console.log(error);
      toast.add({
        id: "update-service",
        type: "error",
        title: "Update failed",
        description: "Could not connect to the server.",
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this service?"
    );

    if (!confirmed) return;

    toast.add({
      id: "delete-service",
      type: "loading",
      title: "Deleting service...",
      description: "Please wait.",
    });

    try {
     const res = await fetch(`${API_URL}/services/${id}`, {
  method: "DELETE",
  credentials: "include",
});

      const data = await res.json();

      if (!res.ok) {
        toast.add({
          id: "delete-service",
          type: "error",
          title: "Delete failed",
          description: data.message || "Could not delete service.",
        });
        return;
      }

      toast.add({
        id: "delete-service",
        type: "success",
        title: "Service deleted",
        description: "The service has been deleted successfully.",
      });

      if (editingService?._id === id) {
        setEditingService(null);
        setEditData(emptyService);
      }

      fetchServices();
    } catch (error) {
      console.log(error);
      toast.add({
        id: "delete-service",
        type: "error",
        title: "Delete failed",
        description: "Could not connect to the server.",
      });
    }
  };

  return (
    <div className="space-y-8 p-6">
      <div>
        <h1 className="text-3xl font-bold">Manage Services</h1>
        <p className="text-muted-foreground">
          Add, update and manage salon services.
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
                  min="0"
                  placeholder="1500"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration">Duration (minutes)</Label>
                <Input
                  id="duration"
                  name="duration"
                  type="number"
                  min="1"
                  placeholder="60"
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
                <FieldLabel htmlFor="image">Service Image</FieldLabel>

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
                  {uploading ? "Uploading..." : "Upload Image"}
                </Button>

                {imageUrl && (
                  <Image
                    src={imageUrl}
                    alt="Service"
                    width={64}
                    height={64}
                    className="h-16 w-16 rounded-md object-cover"
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

      {editingService && (
        <Card className="max-w-3xl border-rose-300">
          <CardHeader>
            <CardTitle>Update Service</CardTitle>
            <CardDescription>
              Edit the service information below.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleUpdate} className="space-y-5">
              <div className="space-y-2">
                <Label>Service Name</Label>
                <Input
                  value={editData.name}
                  onChange={(e) =>
                    setEditData({ ...editData, name: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Category</Label>
                <Input
                  value={editData.category}
                  onChange={(e) =>
                    setEditData({ ...editData, category: e.target.value })
                  }
                  required
                />
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Price</Label>
                  <Input
                    type="number"
                    min="0"
                    value={editData.price}
                    onChange={(e) =>
                      setEditData({ ...editData, price: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Duration (minutes)</Label>
                  <Input
                    type="number"
                    min="1"
                    value={editData.duration}
                    onChange={(e) =>
                      setEditData({ ...editData, duration: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  rows={4}
                  value={editData.description}
                  onChange={(e) =>
                    setEditData({
                      ...editData,
                      description: e.target.value,
                    })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Service Image</Label>

                <Input
                  type="file"
                  accept="image/*"
                  ref={editFileInputRef}
                  onChange={handleEditImageUpload}
                  className="hidden"
                />

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => editFileInputRef.current?.click()}
                  disabled={editUploading}
                >
                  {editUploading ? "Uploading..." : "Change Image"}
                </Button>

                {editData.image && (
                  <Image
                    src={editData.image}
                    alt="Service"
                    width={64}
                    height={64}
                    className="h-16 w-16 rounded-md object-cover"
                  />
                )}
              </div>

              <div className="flex items-center gap-3">
                <Checkbox
                  id="edit-featured"
                  checked={editData.featured}
                  onCheckedChange={(checked) =>
                    setEditData({
                      ...editData,
                      featured: checked === true,
                    })
                  }
                />
                <Label htmlFor="edit-featured">
                  Show as Featured Service
                </Label>
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={editData.status}
                  onValueChange={(value) =>
                    setEditData({
                      ...editData,
                      status: value ?? "active",
                    })
                  }
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

              <div className="flex gap-3">
                <Button
                  type="submit"
                  disabled={updating || editUploading}
                  className="flex-1 bg-rose-600 hover:bg-rose-700"
                >
                  {updating ? "Updating..." : "Update Service"}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setEditingService(null);
                    setEditData(emptyService);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <section className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold">All Services</h2>
          <p className="text-muted-foreground">
            View, edit or delete your salon services.
          </p>
        </div>

        {loadingServices ? (
          <p className="text-muted-foreground">Loading services...</p>
        ) : services.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No services found.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {services.map((service) => (
              <Card key={service._id} className="overflow-hidden">
                {service.image && (
                  <div className="relative h-48 w-full">
                    <Image
                      src={service.image}
                      alt={service.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}

                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle>{service.name}</CardTitle>
                      <CardDescription>
                        {service.category}
                      </CardDescription>
                    </div>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        service.status === "active"
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {service.status}
                    </span>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    {service.description}
                  </p>

                  <div className="flex justify-between text-sm">
                    <span>Price</span>
                    <span className="font-semibold">
                      ৳{service.price}
                    </span>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span>Duration</span>
                    <span>{service.duration} minutes</span>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span>Featured</span>
                    <span>{service.featured ? "Yes" : "No"}</span>
                  </div>

                  <div className="flex gap-3 pt-3">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1"
                      onClick={() => handleEdit(service)}
                    >
                      Edit
                    </Button>

                    <Button
                      type="button"
                      variant="destructive"
                      className="flex-1"
                      onClick={() => handleDelete(service._id)}
                    >
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}