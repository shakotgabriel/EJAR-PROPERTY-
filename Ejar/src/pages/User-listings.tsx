// src/pages/User-listings.tsx
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Plus, Pencil, Trash2 } from "lucide-react";
import { useProperties } from "@/hooks/useProperties";
import { toCardProperty } from "@/store/propertyStore";
import { useAuth } from "@/hooks/useAuth";

const UserListings: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    myProperties,
    isLoading,
    error,
    fetchMyProperties,
    deleteProperty,
  } = useProperties();

  useEffect(() => {
    if (user) {
      fetchMyProperties();
    }
  }, [user, fetchMyProperties]);

  const totalListings = myProperties.length;
  const totalRent = myProperties.reduce(
    (sum, listing) => sum + Number(listing.rent_amount || 0),
    0
  );

  const statusStyles = (status?: string) => {
    switch (status) {
      case "available":
        return "bg-emerald-100 text-emerald-700 border-emerald-200";
      case "rented":
        return "bg-rose-100 text-rose-700 border-rose-200";
      case "pending":
        return "bg-amber-100 text-amber-700 border-amber-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  const handleEdit = (id: string | number) => {
    navigate(`/edit-property/${id}`);
  };

  const handleDelete = async (id: string | number) => {
    if (window.confirm("Are you sure you want to delete this listing?")) {
      await deleteProperty(id);
    }
  };

  if (isLoading && myProperties.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="h-48 w-full" />
              <CardContent className="p-4">
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2 mb-4" />
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-16" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto px-4 py-10">
        <div className="rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-6 sm:p-8 text-white shadow-xl mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold">My Listings</h1>
              <p className="text-white/80 text-sm">
                Manage your properties and keep your listings fresh.
              </p>
            </div>
            <Button
              onClick={() => navigate("/add-property")}
              className="flex items-center gap-2 bg-white/90 text-blue-700 hover:bg-white"
            >
              <Plus size={16} />
              Add New Property
            </Button>
          </div>
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-2xl bg-white/15 border border-white/20 px-5 py-4">
              <p className="text-xs uppercase tracking-wide text-white/70">Total Listings</p>
              <p className="text-2xl font-semibold">{totalListings}</p>
            </div>
            <div className="rounded-2xl bg-white/15 border border-white/20 px-5 py-4">
              <p className="text-xs uppercase tracking-wide text-white/70">Monthly Value</p>
              <p className="text-2xl font-semibold">
                ${totalRent.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {myProperties.length === 0 ? (
          <Card className="text-center p-10 border-dashed border-2 border-blue-200 bg-blue-50/40">
            <CardContent className="space-y-4">
              <h3 className="text-lg font-semibold text-blue-900">No Listings Yet</h3>
              <p className="text-gray-600">
                You haven&apos;t listed any properties yet. Create your first
                listing to get started.
              </p>
              <Button onClick={() => navigate("/add-property")}>
                Create Your First Listing
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {myProperties.map((listing) => {
              const card = toCardProperty(listing);
              return (
                <Card
                  key={listing.id}
                  className="group overflow-hidden bg-white/90 border border-slate-200 shadow-sm hover:shadow-lg transition-all"
                >
                  <div className="relative">
                    <img
                      src={card.image || "/images/placeholder-property.jpg"}
                      alt={listing.title}
                      className="w-full h-48 object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-slate-900/10 to-transparent" />
                    <div className="absolute top-3 left-3 flex flex-wrap gap-2">
                      <span className="rounded-full bg-white/90 text-xs font-semibold text-slate-700 px-3 py-1">
                        {card.category?.toString().replace(/(^\w|_\w)/g, (m) => m.replace("_", " ").toUpperCase())}
                      </span>
                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusStyles(
                          listing.status
                        )}`}
                      >
                        {(listing.status || "status").replace(/(^\w|_\w)/g, (m) => m.replace("_", " ").toUpperCase())}
                      </span>
                    </div>
                    <div className="absolute top-3 right-3 flex gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-9 w-9 rounded-full bg-white/95 hover:bg-white"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(listing.id);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-9 w-9 rounded-full bg-white/95 hover:bg-white"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(listing.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                    <div className="absolute bottom-3 left-3">
                      <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-slate-700">
                        ${card.price.toLocaleString()} / month
                      </span>
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-lg mb-1 line-clamp-1 text-slate-900">
                      {listing.title}
                    </h3>
                    <p className="text-sm text-slate-500 mb-3 line-clamp-1">
                      {card.location}
                    </p>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-semibold text-slate-700">
                        {listing.bedrooms} beds · {listing.bathrooms} baths
                      </span>
                    </div>
                  </CardContent>
                  <CardContent className="px-4 pb-4 pt-0">
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => handleEdit(listing.id)}
                      >
                        Edit
                      </Button>
                      <Button
                        className="w-full bg-blue-400 text-white"
                        onClick={() => navigate(`/properties/${listing.id}`)}
                      >
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserListings;
