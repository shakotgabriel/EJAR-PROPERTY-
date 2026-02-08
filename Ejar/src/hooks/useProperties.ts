import { usePropertyStore } from "@/store/propertyStore";

/**
 * Hook for properties, favorites, reviews, and inquiries.
 * Uses the property store which integrates with your Django backend.
 */
export function useProperties() {
  return usePropertyStore();
}
