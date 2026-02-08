import React, { useState } from "react";
import { Dialog, DialogTrigger, DialogContent} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PropertyFiltersComponent, type PropertyFilters } from "./PropertyFilters"; // <-- named import

interface FilterDialogProps {
  onApply?: (filters: PropertyFilters) => void;
}

const FilterDialog: React.FC<FilterDialogProps> = ({ onApply }) => {
  const [open, setOpen] = useState(false);

  const initialFilters = {
    search: "",
    category: "",
    minPrice: 0,
    maxPrice: 1000000,
    location: "",
    minBathrooms: 0,
    bedrooms: 0,
  };

  const locations = ["Juba Town", "Gudele", "Cuba", "Munuki", "Katori"];

  const [filters, setFilters] = useState(initialFilters);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="font-semibold">Filter</Button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white">
       

        <PropertyFiltersComponent
          filters={filters}
          locations={locations}
          onFilterChange={setFilters}
          onApply={(applied) => {
            setFilters(applied);
            if (onApply) {
              onApply(applied);
            }
          }}
        />
      </DialogContent>
    </Dialog>
  );
};

export default FilterDialog;
