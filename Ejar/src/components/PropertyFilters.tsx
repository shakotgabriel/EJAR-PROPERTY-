import React, { useState, useMemo, useCallback, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Filter, X, ChevronDown, ChevronUp, Search, MapPin, Home, DollarSign } from "lucide-react"

export interface PropertyFilters {
  search: string
  category: string
  minPrice: number
  maxPrice: number
  location: string
  minBathrooms: number
  bedrooms: number
}

interface PropertyFiltersProps {
  filters: PropertyFilters
  locations: string[]
  propertyTypes?: { value: string; label: string }[]
  onFilterChange: (filters: PropertyFilters) => void
  onApply?: (filters: PropertyFilters) => void
  onResetFilters?: () => void
  priceRange?: { min: number; max: number }
  resultCount?: number
  isLoading?: boolean
}

interface FilterBadgeProps {
  icon: React.ComponentType<{ className?: string }>
  label: string
  onRemove: () => void
}

const FilterBadge: React.FC<FilterBadgeProps> = ({ icon: Icon, label, onRemove }) => (
  <Badge variant="secondary" className="gap-1 pr-1">
    <Icon className="h-3 w-3" />
    {label}
    <button
      onClick={onRemove}
      className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
      aria-label="Remove filter"
    >
      <X className="h-3 w-3" />
    </button>
  </Badge>
)

interface RangeSliderProps {
  min: number
  max: number
  value: number
  onChange: (value: number) => void
}

const RangeSlider: React.FC<RangeSliderProps> = ({ min, max, value, onChange }) => {
  const span = max - min
  const step = span > 0 ? span / 100 : 1

  return (
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="absolute w-full h-2 appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-600 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow-md [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-blue-600 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:shadow-md"
    />
  )
}

export const PropertyFiltersComponent: React.FC<PropertyFiltersProps> = ({
  filters,
  locations,
  propertyTypes = [],
  onFilterChange,
  onApply,
  onResetFilters,
  priceRange = { min: 0, max: 1000000 },
  resultCount,
  isLoading = false
}) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const [localFilters, setLocalFilters] = useState<PropertyFilters>(filters)

  useEffect(() => {
    setLocalFilters(filters)
  }, [filters])

  const formatPrice = useCallback((price: number) => {
    if (price >= 1000000) return `${(price / 1000000).toFixed(1)}M`
    if (price >= 1000) return `${(price / 1000).toFixed(0)}K`
    return price.toString()
  }, [])


  const pricePresets = useMemo(() => {
    const max = priceRange.max
    if (max <= 10000) {
      return [
        { label: `Under ${formatPrice(max * 0.3)}`, min: priceRange.min, max: max * 0.3 },
        { label: `${formatPrice(max * 0.3)}-${formatPrice(max * 0.7)}`, min: max * 0.3, max: max * 0.7 },
        { label: `${formatPrice(max * 0.7)}+`, min: max * 0.7, max }
      ]
    } else if (max <= 100000) {
      return [
        { label: 'Under 25K', min: priceRange.min, max: 25000 },
        { label: '25K-75K', min: 25000, max: 75000 },
        { label: '75K+', min: 75000, max }
      ]
    } else {
      return [
        { label: 'Under 250K', min: priceRange.min, max: 250000 },
        { label: '250K-750K', min: 250000, max: 750000 },
        { label: '750K+', min: 750000, max }
      ]
    }
  }, [formatPrice, priceRange.max, priceRange.min])

  const updateFilter = useCallback((key: keyof PropertyFilters, value: string | number) => {
    setLocalFilters((prev) => ({ ...prev, [key]: value }))
  }, [])

  const applyFilters = useCallback(() => {
    onFilterChange(localFilters)
    if (onApply) {
      onApply(localFilters)
    }
  }, [localFilters, onApply, onFilterChange])

  const removeFilter = useCallback((key: keyof PropertyFilters) => {
    const defaultValues: Record<keyof PropertyFilters, string | number> = {
      search: '',
      category: '',
      minPrice: priceRange.min,
      maxPrice: priceRange.max,
      location: '',
      minBathrooms: 0,
      bedrooms: 0
    }
    updateFilter(key, defaultValues[key])
  }, [priceRange, updateFilter])

  const handleReset = useCallback(() => {
    const resetFilters: PropertyFilters = {
      search: '',
      category: '',
      minPrice: priceRange.min,
      maxPrice: priceRange.max,
      location: '',
      minBathrooms: 0,
      bedrooms: 0
    }
    setLocalFilters(resetFilters)
    onFilterChange(resetFilters)
  
    if (onResetFilters) {
      onResetFilters()
    }
  }, [priceRange, onFilterChange, onResetFilters])

  const handleMinPriceChange = useCallback((value: number) => {
    const min = Math.min(value, localFilters.maxPrice)
    updateFilter('minPrice', min)
  }, [localFilters.maxPrice, updateFilter])

  const handleMaxPriceChange = useCallback((value: number) => {
    const max = Math.max(value, localFilters.minPrice)
    updateFilter('maxPrice', max)
  }, [localFilters.minPrice, updateFilter])

  const handlePricePreset = useCallback((min: number, max: number) => {
    updateFilter('minPrice', min)
    updateFilter('maxPrice', max)
  }, [updateFilter])

  
  const activeBadges = useMemo(() => {
    const badges = []
    
    if (localFilters.search) {
      badges.push({
        key: 'search',
        icon: Search,
        label: `"${localFilters.search}"`,
        onRemove: () => removeFilter('search')
      })
    }
    
    if (localFilters.category && localFilters.category !== '') {
      badges.push({
        key: 'category',
        icon: Home,
        label: localFilters.category,
        onRemove: () => removeFilter('category')
      })
    }
    
    if (localFilters.location && localFilters.location !== '') {
      badges.push({
        key: 'location',
        icon: MapPin,
        label: localFilters.location,
        onRemove: () => removeFilter('location')
      })
    }

    if (localFilters.minBathrooms > 0) {
      badges.push({
        key: 'minBathrooms',
        icon: Home,
        label: `Bathrooms: ${localFilters.minBathrooms}`,
        onRemove: () => removeFilter('minBathrooms')
      })
    }

    if (localFilters.bedrooms > 0) {
      badges.push({
        key: 'bedrooms',
        icon: Home,
        label: `Bedrooms: ${localFilters.bedrooms}`,
        onRemove: () => removeFilter('bedrooms')
      })
    }
    
    if (localFilters.minPrice > priceRange.min || localFilters.maxPrice < priceRange.max) {
      badges.push({
        key: 'price',
        icon: DollarSign,
        label: `${formatPrice(localFilters.minPrice)}-${formatPrice(localFilters.maxPrice)}`,
        onRemove: () => {
          updateFilter('minPrice', priceRange.min)
          updateFilter('maxPrice', priceRange.max)
        }
      })
    }
    
    return badges
  }, [localFilters, priceRange, removeFilter, updateFilter, formatPrice])

  const activeFiltersCount = activeBadges.length

  return (
    <>
  
      {activeFiltersCount > 0 && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Active Filters:</span>
            <Button
              onClick={handleReset}
              variant="ghost"
              size="sm"
              className="h-6 text-xs text-blue-600 hover:text-blue-700"
            >
              Clear All
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {activeBadges.map((badge) => (
              <FilterBadge
                key={badge.key}
                icon={badge.icon}
                label={badge.label}
                onRemove={badge.onRemove}
              />
            ))}
          </div>
          {resultCount !== undefined && (
            <div className="mt-2 text-xs text-gray-600">
              {isLoading ? (
                <span className="flex items-center gap-1">
                  <span className="animate-pulse">●</span> Searching...
                </span>
              ) : (
                <span>{resultCount} {resultCount === 1 ? 'property' : 'properties'} found</span>
              )}
            </div>
          )}
        </div>
      )}


      <div className="lg:hidden mb-4">
        <Button
          onClick={() => setIsExpanded(!isExpanded)}
          variant="outline"
          className="w-full justify-between h-11"
        >
          <span className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            <span className="font-medium">Filters</span>
            {activeFiltersCount > 0 && (
              <span className="bg-blue-600 text-white text-xs rounded-full px-2 py-0.5 font-semibold">
                {activeFiltersCount}
              </span>
            )}
          </span>
          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
      </div>


      <Card className={`${!isExpanded  && 'hidden lg:block bg-white border-3 border-blue-200'}`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base sm:text-lg text-blue-900">Filters</CardTitle>
            {activeFiltersCount > 0 && (
              <Button
                onClick={handleReset}
                variant="ghost"
                size="sm"
                className="text-xs"
              >
                <X className="h-3 w-3 mr-1" />
                Clear ({activeFiltersCount})
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3 sm:space-y-4">
  
          <div className="space-y-1.5">
            <Label htmlFor="search" className="text-sm font-medium flex items-center gap-1.5">
              <Search className="h-3.5 w-3.5" />
              Search
            </Label>
            <div className="relative">
              <Input
                id="search"
                placeholder="Property name, area, features..."
                value={localFilters.search}
                onChange={(e) => updateFilter('search', e.target.value)}
                className="h-9 pl-3"
              />
              {localFilters.search && (
                <button
                  onClick={() => removeFilter('search')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="category" className="text-sm font-medium flex items-center gap-1.5">
              <Home className="h-3.5 w-3.5" />
              Listing Type
            </Label>
            <Select
              value={localFilters.category || "all"}
              onValueChange={(value) => updateFilter('category', value === "all" ? "" : value)}
            >
              <SelectTrigger id="category" className="h-9 bg-gray-100">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="all">All Types</SelectItem>
                {propertyTypes.map((pt) => (
                  <SelectItem key={pt.value} value={pt.value}>
                    {pt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

       
          <div className="space-y-1.5">
            <Label htmlFor="location" className="text-sm font-medium flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5" />
              Location
            </Label>
            <Select
              value={localFilters.location || "all"}
              onValueChange={(value) => updateFilter('location', value === "all" ? "" : value)}
            >
              <SelectTrigger id="location" className="h-9 bg-gray-100">
                <SelectValue placeholder="All Locations" />
              </SelectTrigger>
              <SelectContent className="bg-white max-h-60 overflow-y-auto">
                <SelectItem value="all">All Locations</SelectItem>
                {locations.map((loc) => (
                  <SelectItem key={loc} value={loc}>
                    {loc}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

     
          <div className="space-y-1.5">
            <Label htmlFor="minBathrooms" className="text-sm font-medium flex items-center gap-1.5">
              <Home className="h-3.5 w-3.5" />
              Bathrooms
            </Label>
            <Select
              value={String(localFilters.minBathrooms ?? 0)}
              onValueChange={(value) => updateFilter('minBathrooms', Number(value))}
            >
              <SelectTrigger id="minBathrooms" className="h-9 bg-gray-100">
                <SelectValue placeholder="Any" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="0">Any</SelectItem>
                {[1, 2, 3, 4, 5].map((count) => (
                  <SelectItem key={count} value={String(count)}>
                      {count}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>


          <div className="space-y-1.5">
            <Label htmlFor="bedrooms" className="text-sm font-medium flex items-center gap-1.5">
              <Home className="h-3.5 w-3.5" />
              Bedrooms
            </Label>
            <Select
              value={String(localFilters.bedrooms ?? 0)}
              onValueChange={(value) => updateFilter('bedrooms', Number(value))}
            >
              <SelectTrigger id="bedrooms" className="h-9 bg-gray-100">
                <SelectValue placeholder="Any" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="0">Any</SelectItem>
                {[1, 2, 3, 4, 5].map((count) => (
                  <SelectItem key={count} value={String(count)}>
                    {count}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium flex items-center gap-1.5">
                <DollarSign className="h-3.5 w-3.5" />
                Price Range (USD)
              </Label>
              <span className="text-xs font-semibold text-blue-600">
                {formatPrice(localFilters.minPrice)} - {formatPrice(localFilters.maxPrice)}
              </span>
            </div>
            
    
            <div className="relative pt-2 pb-4">
              <div className="relative h-2 overflow-hidden">
              
                <div className="absolute w-full h-1 bg-gray-200 rounded top-1/2 -translate-y-1/2" />
                
               
                {(() => {
                  const rangeSpan = priceRange.max - priceRange.min || 1
                  const leftPercent = Math.min(100, Math.max(0, ((localFilters.minPrice - priceRange.min) / rangeSpan) * 100))
                  const rightPercent = Math.min(100, Math.max(0, ((localFilters.maxPrice - priceRange.min) / rangeSpan) * 100))
                  return (
                    <div
                      className="absolute h-1 bg-blue-600 rounded top-1/2 -translate-y-1/2"
                      style={{
                        left: `${leftPercent}%`,
                        right: `${100 - rightPercent}%`
                      }}
                    />
                  )
                })()}
       
                <RangeSlider
                  min={priceRange.min}
                  max={priceRange.max}
                  value={localFilters.minPrice}
                  onChange={handleMinPriceChange}
                />
                <RangeSlider
                  min={priceRange.min}
                  max={priceRange.max}
                  value={localFilters.maxPrice}
                  onChange={handleMaxPriceChange}
                />
              </div>
            </div>

   
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <span className="text-xs text-gray-500">Min Price</span>
                <Input
                  type="number"
                  placeholder="Min"
                  value={localFilters.minPrice}
                  onChange={(e) =>
                    handleMinPriceChange(e.target.value === "" ? priceRange.min : Number(e.target.value))
                  }
                  className="h-8 text-xs"
                />
              </div>
              <div className="space-y-1">
                <span className="text-xs text-gray-500">Max Price</span>
                <Input
                  type="number"
                  placeholder="Max"
                  value={localFilters.maxPrice}
                  onChange={(e) =>
                    handleMaxPriceChange(e.target.value === "" ? priceRange.max : Number(e.target.value))
                  }
                  className="h-8 text-xs"
                />
              </div>
            </div>


            <div className="flex flex-wrap gap-1.5 pt-1">
              {pricePresets.map((preset, idx) => (
                <Button
                  key={idx}
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs px-2"
                  onClick={() => handlePricePreset(preset.min, preset.max)}
                >
                  {preset.label}
                </Button>
              ))}
            </div>
          </div>

        
          <div className="pt-2 space-y-2">
            <Button
              onClick={applyFilters}
              className="w-full hidden lg:flex"
              variant="outline"
              size="sm"
            >
              Apply Filters
            </Button>

            <Button
              onClick={() => {
                applyFilters()
                setIsExpanded(false)
              }}
              className="w-full lg:hidden"
              size="sm"
            >
              Apply Filters
            </Button>
          </div>
        </CardContent>
      </Card>
    </>
  )
}