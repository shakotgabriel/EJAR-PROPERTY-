
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import API from "@/api/api";
import { useAuth } from "@/hooks/useAuth";
import type { Property } from "@/types/property.types";

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_MIME_TYPES = new Set(["image/jpeg", "image/png"]);
const MAX_IMAGES_PER_PROPERTY = 10;

const PROPERTY_TYPES = [
  { value: "apartment", label: "Apartment" },
  { value: "house", label: "House" },
  { value: "condo", label: "Condo" },
  { value: "townhouse", label: "Townhouse" },
  { value: "studio", label: "Studio" },
  { value: "room", label: "Room" },
  { value: "commercial", label: "Commercial" },
] as const;

const EditProperty: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [property, setProperty] = useState<Property | null>(null);

  const [title, setTitle] = useState("");
  const [propertyType, setPropertyType] = useState("");
  const [rentAmount, setRentAmount] = useState<number | string>("");
  const [securityDeposit, setSecurityDeposit] = useState<number | string>("");
  const [bedrooms, setBedrooms] = useState<number | string>("");
  const [bathrooms, setBathrooms] = useState<number | string>("");
  const [address, setAddress] = useState("");
  const [location, setLocation] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("USA");
  const [availableFrom, setAvailableFrom] = useState("");
  const [description, setDescription] = useState("");
  const [images, setImages] = useState<File[]>([]);

  useEffect(() => {
    const fetchProperty = async () => {
      if (!id) return;
      setLoading(true);
      setError(null);
      try {
        const res = await API.get<Property>(`properties/${id}/`);
        const data = res.data;
        setProperty(data);
        setTitle(data.title ?? "");
        setPropertyType(data.property_type ?? "");
        setRentAmount(data.rent_amount ?? "");
        setSecurityDeposit(data.security_deposit ?? "");
        setBedrooms(data.bedrooms ?? "");
        setBathrooms(data.bathrooms ?? "");
        setAddress(data.address ?? "");
        setLocation(data.location ?? "");
        setCity(data.city ?? "");
        setCountry(data.country ?? "USA");
        setAvailableFrom(data.available_from ?? "");
        setDescription(data.description ?? "");
      } catch (err) {
        console.error(err);
        const message =
          (err as { response?: { data?: { detail?: string } } })?.response?.data
            ?.detail || "Failed to load property for editing";
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchProperty();
  }, [id]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const filesArray = Array.from(e.target.files);

    const next: File[] = [];
    const errors: string[] = [];

    if (filesArray.length > MAX_IMAGES_PER_PROPERTY) {
      errors.push(`You can upload up to ${MAX_IMAGES_PER_PROPERTY} photos.`);
    }

    for (const file of filesArray.slice(0, MAX_IMAGES_PER_PROPERTY)) {
      if (!ALLOWED_IMAGE_MIME_TYPES.has(file.type)) {
        errors.push(
          `Unsupported file type: ${file.name} (${file.type || "unknown"}). Only JPEG/PNG allowed.`
        );
        continue;
      }
      if (file.size > MAX_IMAGE_SIZE_BYTES) {
        errors.push(`File too large: ${file.name}. Max 5MB per image.`);
        continue;
      }
      next.push(file);
    }

    if (errors.length) {
      alert(errors.join("\n"));
    }

    setImages(next);
  };

  const validateForm = (): string[] => {
    const errors: string[] = [];
    if (!title.trim()) errors.push("Title is required.");
    if (!propertyType) errors.push("Property type is required.");
    if (!address.trim()) errors.push("Address is required.");
    if (!city.trim()) errors.push("City is required.");
    if (!description.trim()) errors.push("Description is required.");
    if (!availableFrom) errors.push("Available from date is required.");

    const rentNum = Number(rentAmount);
    if (Number.isNaN(rentNum)) errors.push("Rent amount must be a number.");
    else if (rentNum < 0) errors.push("Rent amount must be non-negative.");

    const depositNum = Number(securityDeposit);
    if (Number.isNaN(depositNum)) errors.push("Security deposit must be a number.");
    else if (depositNum < 0) errors.push("Security deposit must be non-negative.");

    const bedroomsNum = Number(bedrooms);
    if (Number.isNaN(bedroomsNum)) errors.push("Bedrooms must be a number.");
    else if (!Number.isInteger(bedroomsNum) || bedroomsNum < 0)
      errors.push("Bedrooms must be a non-negative integer.");

    const bathroomsNum = Number(bathrooms);
    if (Number.isNaN(bathroomsNum)) errors.push("Bathrooms must be a number.");
    else if (bathroomsNum < 0) errors.push("Bathrooms must be non-negative.");

    for (const file of images) {
      if (!ALLOWED_IMAGE_MIME_TYPES.has(file.type)) {
        errors.push(`Unsupported file type: ${file.name} (${file.type || "unknown"}).`);
      }
      if (file.size > MAX_IMAGE_SIZE_BYTES) {
        errors.push(`File too large: ${file.name}. Max 5MB per image.`);
      }
    }

    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setSaving(true);
    setError(null);

    try {
      if (!user) {
        alert("You must be logged in!");
        setSaving(false);
        return;
      }

      const canManageListings = user.role === "landlord" || user.role === "agent";
      if (!canManageListings) {
        alert("Only landlords/agents can edit listings.");
        setSaving(false);
        return;
      }

      const validationErrors = validateForm();
      if (validationErrors.length) {
        alert(validationErrors.join("\n"));
        setSaving(false);
        return;
      }

      const formData = new FormData();
      formData.append("title", title.trim());
      formData.append("property_type", propertyType);
      formData.append("rent_amount", rentAmount.toString());
      formData.append("security_deposit", securityDeposit.toString());
      formData.append("bedrooms", bedrooms.toString());
      formData.append("bathrooms", bathrooms.toString());
      formData.append("address", address.trim());
      formData.append("location", location.trim());
      formData.append("city", city.trim());
      formData.append("country", country.trim() || "USA");
      formData.append("available_from", availableFrom);
      formData.append("description", description.trim());

      await API.patch(`properties/${id}/`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (images.length) {
        for (const img of images) {
          const imageData = new FormData();
          imageData.append("property", id);
          imageData.append("image", img);
          await API.post("properties/images/", imageData, {
            headers: { "Content-Type": "multipart/form-data" },
          });
        }
      }

      alert("Property updated successfully!");
      navigate("/user-listings");
    } catch (err) {
      console.error(err);
      const responseData = (err as { response?: { data?: { detail?: string; errors?: string | string[] } } })
        ?.response?.data;
      const message = responseData?.detail || responseData?.errors || "Error updating listing";
      setError(Array.isArray(message) ? message.join("\n") : message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="container mx-auto px-4 py-10">
          <Card className="w-full max-w-3xl mx-auto p-6">
            <Skeleton className="h-8 w-2/3 mb-6" />
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          </Card>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="container mx-auto px-4 py-10">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="container mx-auto px-4 py-10">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Not Found</AlertTitle>
            <AlertDescription>Property not found.</AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4">
      <Card className="w-full max-w-4xl mx-auto p-6 shadow-lg rounded-2xl border border-blue-200">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center text-blue-800">
            Edit Property
          </CardTitle>
          <p className="text-center text-sm text-slate-600">
            Update your listing details and keep it fresh for renters.
          </p>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="font-medium text-blue-700 mb-1 block">Property Title</label>
                <Input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div>
                <label className="font-medium text-blue-700 mb-1 block">Property Type</label>
                <Select value={propertyType} onValueChange={setPropertyType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    {PROPERTY_TYPES.map((pt) => (
                      <SelectItem key={pt.value} value={pt.value}>
                        {pt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="font-medium text-blue-700 mb-1 block">Rent Amount (USD)</label>
                <Input
                  type="number"
                  required
                  min={0}
                  step="0.01"
                  value={rentAmount}
                  onChange={(e) => setRentAmount(e.target.value)}
                />
              </div>

              <div>
                <label className="font-medium text-blue-700 mb-1 block">Security Deposit (USD)</label>
                <Input
                  type="number"
                  required
                  min={0}
                  step="0.01"
                  value={securityDeposit}
                  onChange={(e) => setSecurityDeposit(e.target.value)}
                />
              </div>

              <div>
                <label className="font-medium text-blue-700 mb-1 block">Bedrooms</label>
                <Input
                  type="number"
                  required
                  min={0}
                  step="1"
                  value={bedrooms}
                  onChange={(e) => setBedrooms(e.target.value)}
                />
              </div>

              <div>
                <label className="font-medium text-blue-700 mb-1 block">Bathrooms</label>
                <Input
                  type="number"
                  required
                  min={0}
                  step="0.5"
                  value={bathrooms}
                  onChange={(e) => setBathrooms(e.target.value)}
                />
              </div>

              <div>
                <label className="font-medium text-blue-700 mb-1 block">Available From</label>
                <Input
                  type="date"
                  required
                  value={availableFrom}
                  onChange={(e) => setAvailableFrom(e.target.value)}
                />
              </div>

              <div>
                <label className="font-medium text-blue-700 mb-1 block">City</label>
                <Input
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                />
              </div>

              <div>
                <label className="font-medium text-blue-700 mb-1 block">Country</label>
                <Input
                  type="text"
                  required
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="font-medium text-blue-700 mb-1 block">Address</label>
              <Input
                type="text"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>

            <div>
              <label className="font-medium text-blue-700 mb-1 block">Neighborhood / Area (optional)</label>
              <Input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>

            <div>
              <label className="font-medium text-blue-700 mb-1 block">Description</label>
              <Textarea
                className="h-28"
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="rounded-xl border border-blue-100 bg-blue-50/40 p-4">
              <p className="text-sm font-semibold text-blue-800">Current Images</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                {property.images?.length ? (
                  property.images.map((img) => (
                    <img
                      key={img.id}
                      src={img.image}
                      alt="property"
                      className="w-full h-24 object-cover rounded-md border border-blue-200 shadow-sm"
                    />
                  ))
                ) : (
                  <p className="text-sm text-gray-500 col-span-4">No images uploaded</p>
                )}
              </div>
            </div>

            <div>
              <label className="font-medium text-blue-700 mb-1 block">Add New Images</label>
              <Input
                type="file"
                multiple
                accept="image/jpeg,image/png"
                onChange={handleFileUpload}
                className="cursor-pointer"
              />

              <div className="grid grid-cols-3 gap-3 mt-3">
                {images.length ? (
                  images.map((img) => (
                    <img
                      key={`${img.name}-${img.size}-${img.lastModified}`}
                      src={URL.createObjectURL(img)}
                      alt="preview"
                      className="w-full h-24 object-cover rounded-md border border-blue-200 shadow-sm"
                    />
                  ))
                ) : (
                  <p className="text-sm text-gray-500 col-span-3">No new images selected</p>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                type="submit"
                disabled={saving}
                className="w-full bg-linear-to-r from-blue-600 to-blue-700 text-white"
              >
                {saving ? "Saving..." : "Save Changes"}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => navigate("/user-listings")}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default EditProperty;
