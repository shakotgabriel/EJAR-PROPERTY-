import React, { useEffect, useState, useMemo } from "react";
import { useLocation } from "react-router-dom";
import { type PropertyFilters, PropertyFiltersComponent } from "@/components/PropertyFilters";
import { PropertyCard } from "@/components/Property-card";
import { Button } from "@/components/ui/button";
import { useProperties } from "@/hooks/useProperties";
import { toCardProperty } from "@/store/propertyStore";
import type { PropertyListParams } from "@/types/property.types";

const toParams = (f: PropertyFilters): PropertyListParams => {
  const params: PropertyListParams = {
    search: f.search || undefined,
    city: f.location || undefined,
    min_rent: f.minPrice,
    max_rent: f.maxPrice,
    // Always include these keys (possibly undefined) so zustand's merge-based setFilters
    // can clear previously-set values.
    bathrooms: undefined,
    min_bathrooms: undefined,
    max_bathrooms: undefined,
  };
  if (f.minBathrooms > 0) {
    // Exact match: bathrooms == selected
    params.min_bathrooms = f.minBathrooms;
    params.max_bathrooms = f.minBathrooms;
  }
  if (f.bedrooms > 0) {
    params.min_bedrooms = f.bedrooms;
    params.max_bedrooms = f.bedrooms;
  }
  if (f.category) {
    params.property_type = f.category as PropertyListParams["property_type"];
  }
  return params;
};

const Properties: React.FC = () => {
  const [viewType, setViewType] = useState<"grid" | "list">("grid");

  const {
    properties,
    priceRange,
    filterOptions,
    isLoading,
    error,
    fetchProperties,
    setFilters,
    resetFilters,
    refreshPriceRange,
    fetchFilterOptions,
  } = useProperties();

  const locationState = useLocation() as {
    state?: { search?: string; category?: string; minPrice?: number; maxPrice?: number; location?: string; minBathrooms?: number; bedrooms?: number };
  };

  const [uiFilters, setUiFilters] = useState<PropertyFilters>(() => {
    const s = locationState.state;
    return {
      search: s?.search ?? "",
      category: s?.category ?? "",
      location: s?.location ?? "",
      minPrice: s?.minPrice ?? priceRange.min,
      maxPrice: s?.maxPrice ?? priceRange.max,
      minBathrooms: s?.minBathrooms ?? 0,
      bedrooms: s?.bedrooms ?? 0,
    };
  });

  useEffect(() => {
    setUiFilters((prev) => {
      // If filters were initialized with the default store range (0-10000) but we later
      // fetched a real range, adopt it once to avoid unintentionally filtering out results.
      const shouldAdoptNewRange =
        prev.minPrice === 0 && prev.maxPrice === 10000 && (priceRange.min !== 0 || priceRange.max !== 10000);

      const rawMin = shouldAdoptNewRange ? priceRange.min : prev.minPrice;
      const rawMax = shouldAdoptNewRange ? priceRange.max : prev.maxPrice;

      const clampedMin = Math.min(Math.max(rawMin, priceRange.min), priceRange.max);
      const clampedMax = Math.min(Math.max(rawMax, priceRange.min), priceRange.max);
      const nextMin = Math.min(clampedMin, clampedMax);
      const nextMax = Math.max(clampedMin, clampedMax);

      if (nextMin === prev.minPrice && nextMax === prev.maxPrice) return prev;
      return { ...prev, minPrice: nextMin, maxPrice: nextMax };
    });
  }, [priceRange.min, priceRange.max]);

  useEffect(() => {
    refreshPriceRange();
    fetchFilterOptions();
  }, [refreshPriceRange, fetchFilterOptions]);

  useEffect(() => {
    const params = toParams(uiFilters);
    setFilters(params);
    fetchProperties(params);
  }, [uiFilters, setFilters, fetchProperties]);

  const handleFilterChange = (updated: PropertyFilters) => {
    setUiFilters(updated);
    setFilters(toParams(updated));
  };

  const handleResetFilters = () => {
    const reset: PropertyFilters = {
      search: "",
      category: "",
      location: "",
      minPrice: priceRange.min,
      maxPrice: priceRange.max,
      minBathrooms: 0,
      bedrooms: 0,
    };
    setUiFilters(reset);
    resetFilters();
    setFilters({ min_rent: priceRange.min, max_rent: priceRange.max });
  };

  const locations = filterOptions.cities;

  const cardProperties = useMemo(() => properties.map(toCardProperty), [properties]);

  if (isLoading && properties.length === 0) {
    return (
      <div className="text-center py-12">
        <h2 className="text-lg font-medium">Loading properties...</h2>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {error && (
        <div className="container mx-auto px-4 py-2 bg-red-50 text-red-700 text-sm">{error}</div>
      )}
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          <div className="w-full md:w-1/4">
            <PropertyFiltersComponent
              filters={{ ...uiFilters, minPrice: uiFilters.minPrice ?? priceRange.min, maxPrice: uiFilters.maxPrice ?? priceRange.max }}
              locations={locations}
              propertyTypes={filterOptions.propertyTypes}
              onFilterChange={handleFilterChange}
              onResetFilters={handleResetFilters}
              priceRange={priceRange}
              resultCount={cardProperties.length}
              isLoading={isLoading}
            />
          </div>

          <div className="flex-1">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold">Available Properties</h1>
              <div className="flex gap-2">
                <Button
                  variant={viewType === "grid" ? "default" : "outline"}
                  onClick={() => setViewType("grid")}
                  className={viewType === "grid" ? "bg-blue-600 text-white" : ""}
                >
                  Grid
                </Button>
                <Button
                  variant={viewType === "list" ? "default" : "outline"}
                  onClick={() => setViewType("list")}
                  className={viewType === "list" ? "bg-blue-600 text-white" : ""}
                >
                  List
                </Button>
              </div>
            </div>

            {cardProperties.length === 0 ? (
              <div className="text-center py-12">
                <h3 className="text-lg font-medium">No properties found</h3>
                <p className="text-gray-500 mt-2">Try adjusting your search or filter criteria</p>
              </div>
            ) : (
              <div
                className={`transition-all duration-300 ${
                  viewType === "grid"
                    ? "grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-6"
                    : "space-y-6"
                }`}
              >
                {cardProperties.map((property) => (
                  <PropertyCard key={property.id} property={property} viewType={viewType} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Properties;
