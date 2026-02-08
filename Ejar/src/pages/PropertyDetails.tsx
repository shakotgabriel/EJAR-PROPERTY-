import React, { useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  Bed,
  Bath,
  MapPin,
  Home,
  DollarSign,
  ArrowLeft,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useProperties } from "@/hooks/useProperties";

const PropertyDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const {
    currentProperty,
    isLoadingSingle,
    error,
    fetchProperty,
    clearCurrentProperty,
  } = useProperties();

  useEffect(() => {
    if (id) {
      fetchProperty(id);
    }
    return () => clearCurrentProperty();
  }, [id, fetchProperty, clearCurrentProperty]);

  const loading = isLoadingSingle;
  const property = currentProperty;

  if (loading) {
    return (
      <div className="py-20 text-center text-gray-500">Loading property...</div>
    );
  }

  if (error || !property) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 text-center">
        <h1 className="text-2xl font-bold text-blue-900">Property not found</h1>
        <p className="text-gray-600">{error ?? "Unable to load property"}</p>

        <div className="mt-6 flex justify-center gap-3">
          <Button onClick={() => navigate(-1)} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Go Back
          </Button>
          <Button asChild>
            <Link to="/properties">Browse Properties</Link>
          </Button>
        </div>
      </div>
    );
  }

  const title = property.title;
  const price = property.rent_amount;
  const location = property.city || property.address;
  const bedrooms = property.bedrooms;
  const bathrooms = property.bathrooms;
  const description = property.description;
  const amenities = property.amenities?.map((a) => a.name) ?? [];
  const images = property.images?.map((img) => img.image) ?? [];
  const category = property.property_type;

  const formattedPrice = (() => {
    const p = typeof price === "string" ? parseFloat(price) : Number(price);
    return Number.isFinite(p) ? p.toLocaleString() : String(price);
  })();

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 space-y-8">
      <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
        <div className="space-x-1">
          <Link to="/" className="hover:text-blue-600">
            Home
          </Link>
          <span>/</span>
          <Link to="/properties" className="hover:text-blue-600">
            Properties
          </Link>
          <span>/</span>
          <span className="text-gray-700 line-clamp-1">{title}</span>
        </div>

        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-8">
        <div className="space-y-6">
          <div className="w-full h-[260px] sm:h-[340px] rounded-xl overflow-hidden">
            <img
              src={images[0]}
              alt={title}
              className="w-full h-full object-cover"
            />
          </div>

          <div>
            <h1 className="text-3xl font-semibold text-blue-900">{title}</h1>
            <p className="flex items-center text-gray-600 mt-2">
              <MapPin className="w-4 h-4 mr-1 text-blue-600" />
              {location}
            </p>
          </div>

          <Card>
            <CardContent className="grid grid-cols-2 sm:grid-cols-3 gap-4 py-5">
              <Info icon={<Bed />} label="Bedrooms" value={bedrooms} />
              <Info icon={<Bath />} label="Bathrooms" value={bathrooms} />
              <Info icon={<Home />} label="Type" value={category} />
            </CardContent>
          </Card>

          <section>
            <h2 className="text-lg font-semibold mb-2 text-blue-900">
              Description
            </h2>
            <p className="text-gray-700">{description}</p>
          </section>

          {amenities.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold mb-3 text-blue-900">
                Amenities
              </h2>
              <div className="flex flex-wrap gap-2">
                {amenities.map((a, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs"
                  >
                    {a}
                  </span>
                ))}
              </div>
            </section>
          )}

          {images.length > 1 && (
            <section>
              <h2 className="text-lg font-semibold mb-3 text-blue-900">
                Gallery
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {images.slice(1).map((img, idx) => (
                  <div key={idx} className="rounded-lg overflow-hidden h-32">
                    <img src={img} className="w-full h-full object-cover" alt="" />
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardContent className="py-5 space-y-4">
              <div>
                <p className="text-xs text-gray-500 uppercase">Price</p>
                <p className="text-3xl font-bold text-blue-600">
                  <DollarSign className="inline w-6 h-6 -mt-1" />
                  {formattedPrice} USD
                </p>
                <span className="inline-block mt-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs capitalize">
                  {category}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="py-5 space-y-3">
              <p className="text-sm font-semibold text-blue-900">Listed by</p>
              <p className="font-medium text-gray-900">{property.owner_email}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

const Info = ({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}) => (
  <div className="flex items-center gap-3">
    <div className="text-blue-600">{icon}</div>
    <div>
      <p className="text-xs text-gray-500 uppercase">{label}</p>
      <p className="font-semibold text-blue-900">{value}</p>
    </div>
  </div>
);

export default PropertyDetails;
