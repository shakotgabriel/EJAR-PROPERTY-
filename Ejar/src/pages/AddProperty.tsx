import React, { useState } from "react";
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
import API from "@/api/api";
import { useAuth } from "@/hooks/useAuth";

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
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

const AddProperty: React.FC = () => {
  const { user } = useAuth();
  // Form States
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
  const [loading, setLoading] = useState(false);

  // Handle Image Selection
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
        errors.push(`Unsupported file type: ${file.name} (${file.type || "unknown"}). Only JPEG/PNG allowed.`);
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
    else if (!Number.isInteger(bedroomsNum) || bedroomsNum < 0) errors.push("Bedrooms must be a non-negative integer.");

    const bathroomsNum = Number(bathrooms);
    if (Number.isNaN(bathroomsNum)) errors.push("Bathrooms must be a number.");
    else if (bathroomsNum < 0) errors.push("Bathrooms must be non-negative.");

    if (images.length > MAX_IMAGES_PER_PROPERTY) {
      errors.push(`You can upload up to ${MAX_IMAGES_PER_PROPERTY} photos.`);
    }
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
    setLoading(true);

    try {
      if (!user) {
        alert("You must be logged in!");
        setLoading(false);
        return;
      }

      const canManageListings = user.role === "landlord" || user.role === "agent";
      if (!canManageListings) {
        alert("Only landlords/agents can create listings.");
        setLoading(false);
        return;
      }

      const validationErrors = validateForm();
      if (validationErrors.length) {
        alert(validationErrors.join("\n"));
        setLoading(false);
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

      for (const img of images) {
        formData.append("image", img);
      }

      await API.post("properties/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      alert("Property created successfully!");
    
      setTitle("");
      setPropertyType("");
      setRentAmount("");
      setSecurityDeposit("");
      setBedrooms("");
      setBathrooms("");
      setAddress("");
      setLocation("");
      setCity("");
      setCountry("USA");
      setAvailableFrom("");
      setDescription("");
      setImages([]);
    } catch (err) {
      console.error(err);
      const responseData = (err as { response?: { data?: { detail?: string; errors?: string | string[] } } })
        ?.response?.data;
      const message = responseData?.detail || responseData?.errors || "Error creating listing";
      alert(Array.isArray(message) ? message.join("\n") : message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white min-h-screen flex items-center justify-center py-16 px-4">
      <Card className="w-full max-w-3xl p-6 shadow-lg rounded-2xl border border-blue-200">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center text-blue-800">
            Add New Property
          </CardTitle>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Two-column grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Title */}
              <div>
                <label className="font-medium text-blue-700 mb-1 block">Property Title</label>
                <Input
                  type="text"
                  placeholder="Modern Apartment in Tongping"
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
                  placeholder="500"
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
                  placeholder="200"
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
                  placeholder="3"
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
                  placeholder="2"
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
                  placeholder="Juba"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                />
              </div>

   
              <div>
                <label className="font-medium text-blue-700 mb-1 block">Country</label>
                <Input
                  type="text"
                  placeholder="USA"
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
                placeholder="Street name, building number"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>

      
            <div>
              <label className="font-medium text-blue-700 mb-1 block">Neighborhood / Area (optional)</label>
              <Input
                type="text"
                placeholder="Juba, Hai Jebel"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>

       
            <div>
              <label className="font-medium text-blue-700 mb-1 block">Description</label>
              <Textarea
                placeholder="Write details about the property..."
                className="h-28"
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

         
            <div>
              <label className="font-medium text-blue-700 mb-1 block">Upload Images</label>
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
                  <p className="text-sm text-gray-500 col-span-3">No image selected</p>
                )}
              </div>
            </div>

           
            <Button
              disabled={loading}
              className="w-full bg-linear-to-r from-blue-600 to-blue-700 text-white"
            >
              {loading ? "Creating..." : "Create Listing"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AddProperty;
