
"use client";

import { useState } from "react";
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

export default function ManageServicesPage() {
  const [featured, setFeatured] = useState(false);

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
          <form className="space-y-5">
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
              <Label htmlFor="image">Image URL</Label>
              <Input
                id="image"
                name="image"
                type="url"
                placeholder="https://example.com/image.jpg"
                required
              />
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
              <Select defaultValue="active" name="status">
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
              className="w-full bg-rose-600 hover:bg-rose-700"
            >
              Add Service
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
