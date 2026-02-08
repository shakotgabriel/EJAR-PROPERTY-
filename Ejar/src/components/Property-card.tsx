import React from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Property {
  id:string | number;
  title: string;
  location: string;
  price: number;
  currency?: string;
  category?: string;
  description: string;
  bedrooms?: number;
  bathrooms?: number;
  image?: string;
}

interface PropertyCardProps {
  property: Property;
  viewType: "grid" | "list";
}

export const PropertyCard: React.FC<PropertyCardProps> = ({ property, viewType }) => {
  const navigate = useNavigate();

  const categoryColors: Record<string, string> = {
    Rent: "bg-blue-100 text-blue-800",
    Sale: "bg-blue-200 text-blue-900",
    Luxury: "bg-blue-300 text-blue-900",
    Default: "bg-blue-100 text-blue-800",
  };

 const badgeClass = categoryColors[property.category ?? "Default"] || categoryColors.Default;

  const brBadge = "bg-blue-200 text-blue-800 px-2 py-0.5 rounded text-xs sm:text-sm font-semibold";
  const baBadge = "bg-blue-300 text-blue-900 px-2 py-0.5 rounded text-xs sm:text-sm font-semibold";

  const handleViewDetails = () => {
    if (!property.id) return;
    navigate(`/properties/${property.id}`);
  };

  if (viewType === "list") {
    return (
      <Card className="grid grid-cols-1 sm:grid-cols-[220px_1fr] md:grid-cols-[250px_1fr] overflow-hidden hover:shadow-2xl transition-shadow rounded-xl border border-blue-200">
        <div className="w-full h-44 sm:h-full relative">
          <img
            src={property.image || "/placeholder.svg"}
            loading="lazy"
            alt={property.title}
            className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
          />
          <span className={`absolute top-2 left-2 px-2 py-1 text-xs font-semibold rounded ${badgeClass}`}>
            {property.category}
          </span>
        </div>

        <div className="p-4 sm:p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-lg sm:text-xl font-semibold mb-1 break-words text-blue-900">{property.title}</h3>
            <p className="text-blue-500 text-xs sm:text-sm mb-2">{property.location}</p>
            <p className="text-blue-700 text-sm sm:text-base mb-2 line-clamp-2">
              {property.description || "No description available"}
            </p>
            <div className="flex items-center gap-2 sm:gap-3 mb-2">
              {property.bedrooms !== undefined && <span className={brBadge}>{property.bedrooms} BR</span>}
              {property.bathrooms !== undefined && <span className={baBadge}>{property.bathrooms} BA</span>}
            </div>
          </div>

          <div className="mt-3 sm:mt-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
            <p className="text-xl sm:text-2xl font-bold text-blue-600">
              {property.price.toLocaleString()} {property.currency}
            </p>
            <Button
              className="w-full sm:w-auto bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 text-white shadow-md"
              size="sm"
              onClick={handleViewDetails}
            >
              View Details
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden hover:shadow-2xl transition-shadow rounded-xl border border-blue-200">
      <div className="relative h-32 sm:h-48 w-full">
        <img
          src={property.image || "/placeholder.svg"}
          loading="lazy"
          alt={property.title}
          className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
        />
        <span className={`absolute top-2 right-2 px-2 py-1 text-xs sm:text-sm font-semibold rounded ${badgeClass}`}>
          {property.category}
        </span>
      </div>

      <CardHeader className="p-2 sm:p-6">
        <CardTitle className="text-xs sm:text-xl break-words leading-tight mb-1 sm:mb-2 text-blue-900">{property.title}</CardTitle>
        <CardDescription className="text-[10px] sm:text-sm text-blue-500">{property.location}</CardDescription>
      </CardHeader>

      <CardContent className="p-2 sm:p-6 pt-0">
        <p className="text-sm sm:text-2xl font-bold text-blue-600 mb-2 sm:mb-3">
          {property.price.toLocaleString()} {property.currency}
        </p>

        <p className="text-[10px] sm:text-sm text-blue-600 mb-2 sm:mb-4 line-clamp-2 leading-tight">
          {property.description || "No description available"}
        </p>

        <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
          {property.bedrooms !== undefined && <span className={brBadge}>{property.bedrooms} BR</span>}
          {property.bathrooms !== undefined && <span className={baBadge}>{property.bathrooms} BA</span>}
        </div>

        <Button
          className="w-full text-xs sm:text-sm h-8 sm:h-10 bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 text-white shadow-md"
          size="sm"
          onClick={handleViewDetails}
        >
          View Details
        </Button>
      </CardContent>
    </Card>
  );
};
