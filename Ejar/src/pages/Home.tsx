import React, { useState, useEffect } from "react";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import type { PropertyFilters } from "@/components/PropertyFilters";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useProperties } from "@/hooks/useProperties";

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { filterOptions, fetchFilterOptions } = useProperties();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    fetchFilterOptions();
  }, [fetchFilterOptions]);

  const [selectedPropertyType, setSelectedPropertyType] = useState<string>("");
  const [appliedFilters] = useState<PropertyFilters | null>(null);

  const handleSearch = () => {
    const filtersToSend = {
      search: appliedFilters?.search ?? "",
      category: selectedPropertyType || "",
      minPrice: appliedFilters?.minPrice,
      maxPrice: appliedFilters?.maxPrice,
      location: appliedFilters?.location || "",
    };

    navigate("/properties", {
      state: {
        ...filtersToSend,
      },
    });
  };
  return (
   <div className="w-full min-h-screen flex flex-col bg-white">

  <section
    className="relative min-h-[520px] flex items-center justify-center px-4 sm:px-6"
    style={{ backgroundImage: "url('/images/juba3.jpg')" }}
  >

    <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/60" />

  
    <div className="relative w-full max-w-4xl bg-white/20 backdrop-blur-2xl border border-white/30 rounded-3xl shadow-2xl p-6 sm:p-10">
      <h1 className="text-center sm:text-left text-3xl sm:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 to-blue-900 bg-clip-text text-transparent mb-4">
        Welcome to Ejar
      </h1>

      <p className="text-center sm:text-left text-white/90 text-sm sm:text-lg mb-8 max-w-2xl">
        Discover premium rental and commercial properties across Juba.
        List your property and reach thousands instantly.
      </p>

      
      <div className="flex flex-col gap-4">
        <Select
          value={selectedPropertyType || undefined}
          onValueChange={setSelectedPropertyType}
        >
          <SelectTrigger
            className="
              h-12 rounded-xl bg-white/95 border border-blue-200
              shadow-sm focus:ring-2 focus:ring-blue-600
              text-sm sm:text-base
            "
          >
            <SelectValue placeholder="Select Property Type" />
          </SelectTrigger>
          <SelectContent className="bg-white p-2">
            {filterOptions.propertyTypes.map((pt) => (
              <SelectItem key={pt.value} value={pt.value}>
                {pt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <button
          onClick={handleSearch}
          className="
            h-12 rounded-xl font-semibold text-sm sm:text-base
            bg-gradient-to-r from-blue-600 to-blue-900
            text-white shadow-lg
            hover:shadow-xl hover:scale-[1.02]
            active:scale-[0.98]
            transition-all
          "
        >
          Search Properties
        </button>
      </div>
    </div>
  </section>

 
  <section className="py-16 bg-gradient-to-b from-white to-gray-100">
    <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center">
      <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-800 mb-4">
        Our Real Estate Partners
      </h2>

      <p className="text-gray-600 mb-12 text-base sm:text-lg max-w-3xl mx-auto">
        Trusted agencies working with us to bring you the best listings across Juba.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
        {[
          { logo: "/images/partners/logo1.png", name: "Equatoria Properties" },
          { logo: "/images/partners/logo2.png", name: "Juba Homes Agency" },
          { logo: "/images/partners/logo3.png", name: "NileView Developers" },
          { logo: "/images/partners/logo4.png", name: "CrownLand Estates" },
        ].map((partner, idx) => (
          <div
            key={idx}
            className="
              bg-white rounded-2xl p-6 shadow-md
              hover:shadow-xl hover:-translate-y-1
              transition-all
            "
          >
            <img
              src={partner.logo}
              alt={partner.name}
              className="w-28 mx-auto opacity-80 hover:opacity-100 transition"
            />
            <p className="mt-4 font-semibold text-gray-700">
              {partner.name}
            </p>
          </div>
        ))}
      </div>
    </div>
  </section>
</div>

  );
};

export default Dashboard;
