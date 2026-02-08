import { create } from "zustand";
import API from "@/api/api";
import type {
  Property,
  PropertyReview,
  PropertyInquiry,
  PropertyListParams,
  CreateReviewPayload,
  CreateInquiryPayload,
} from "@/types/property.types";

/** Build full media URL for Django media files */
const mediaUrl = (path: string): string => {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  return `http://127.0.0.1:8000${path}`;
};

/** Normalize image URLs on a property */
export const normalizePropertyImages = (p: Property): Property => ({
  ...p,
  images: (p.images || []).map((img) => ({
    ...img,
    image: mediaUrl(img.image),
  })),
});

/** Map backend Property to PropertyCard-compatible shape */
export const toCardProperty = (p: Property) => ({
  id: p.id,
  title: p.title,
  location: p.city || p.address,
  price: Number(p.rent_amount) || 0,
  description: p.description,
  bedrooms: p.bedrooms,
  bathrooms: Number(p.bathrooms) || 0,
  image: p.images?.[0]?.image ?? "",
  category: p.property_type,
  currency: "USD",
});

interface PropertyState {
  // List & single
  properties: Property[];
  currentProperty: Property | null;
  myProperties: Property[];
  priceRange: { min: number; max: number };

  // Filtering (stored for UI)
  filters: PropertyListParams;

  // Filter options from backend (cities, property types)
  filterOptions: {
    cities: string[];
    propertyTypes: { value: string; label: string }[];
  };

  // Favorites (local tracking - API toggle doesn't return list)
  favoriteIds: Set<number>;

  // Reviews & inquiries (by property id)
  reviewsByProperty: Record<number, PropertyReview[]>;
  inquiriesByProperty: Record<number, PropertyInquiry[]>;

  // Loading & errors
  isLoading: boolean;
  isLoadingSingle: boolean;
  isLoadingReviews: boolean;
  isLoadingInquiries: boolean;
  error: string | null;
}

interface PropertyActions {
  // Fetch
  fetchProperties: (params?: PropertyListParams) => Promise<Property[]>;
  fetchProperty: (id: number | string) => Promise<Property | null>;
  fetchMyProperties: () => Promise<Property[]>;
  refreshPriceRange: () => Promise<void>;
  fetchFilterOptions: () => Promise<void>;

  // Filters
  setFilters: (filters: Partial<PropertyListParams>) => void;
  resetFilters: () => void;

  // Favorites
  toggleFavorite: (propertyId: number) => Promise<boolean>;
  isFavorite: (propertyId: number) => boolean;

  // Reviews
  fetchReviews: (propertyId: number) => Promise<PropertyReview[]>;
  createReview: (payload: CreateReviewPayload) => Promise<PropertyReview | null>;

  // Inquiries
  fetchInquiries: (propertyId: number) => Promise<PropertyInquiry[]>;
  createInquiry: (payload: CreateInquiryPayload) => Promise<PropertyInquiry | null>;

  // CRUD
  deleteProperty: (id: number | string) => Promise<boolean>;

  // Utils
  clearError: () => void;
  clearCurrentProperty: () => void;
}

const defaultFilters: PropertyListParams = {
  search: undefined,
  ordering: "-created_at",
  min_rent: undefined,
  max_rent: undefined,
  city: undefined,
  property_type: undefined,
  status: undefined,
  is_featured: undefined,
};

export const usePropertyStore = create<PropertyState & PropertyActions>((set, get) => ({
  properties: [],
  currentProperty: null,
  myProperties: [],
  priceRange: { min: 0, max: 10000 },
  filters: defaultFilters,
  filterOptions: { cities: [], propertyTypes: [] },
  favoriteIds: new Set<number>(),
  reviewsByProperty: {},
  inquiriesByProperty: {},
  isLoading: false,
  isLoadingSingle: false,
  isLoadingReviews: false,
  isLoadingInquiries: false,
  error: null,

  setFilters: (filters) => {
    set((s) => ({
      filters: { ...s.filters, ...filters },
    }));
  },

  resetFilters: () => set({ filters: defaultFilters }),

  fetchProperties: async (params) => {
    set({ isLoading: true, error: null });
    const merged = { ...get().filters, ...params };
    try {
      const query = new URLSearchParams();
      Object.entries(merged).forEach(([k, v]) => {
        if (v === undefined || v === null || v === "") return;
        if (Array.isArray(v)) {
          v.forEach((val) => query.append(k, String(val)));
        } else {
          query.append(k, String(v));
        }
      });
      const res = await API.get<Property[]>(`properties/?${query.toString()}`);
      const list = Array.isArray(res.data) ? res.data : [];
      const normalized = list.map(normalizePropertyImages);
      set({ properties: normalized });
      return normalized;
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
        "Failed to fetch properties";
      set({ error: msg });
      return [];
    } finally {
      set({ isLoading: false });
    }
  },

  fetchProperty: async (id) => {
    set({ isLoadingSingle: true, error: null });
    try {
      const res = await API.get<Property>(`properties/${id}/`);
      const p = normalizePropertyImages(res.data);
      set({ currentProperty: p });
      return p;
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
        "Failed to fetch property";
      set({ error: msg, currentProperty: null });
      return null;
    } finally {
      set({ isLoadingSingle: false });
    }
  },

  fetchMyProperties: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await API.get<Property[]>("properties/?mine=true");
      const list = Array.isArray(res.data) ? res.data : [];
      const normalized = list.map(normalizePropertyImages);
      set({ myProperties: normalized });
      return normalized;
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
        "Failed to fetch your properties";
      set({ error: msg });
      return [];
    } finally {
      set({ isLoading: false });
    }
  },

  refreshPriceRange: async () => {
    try {
      const res = await API.get<Property[]>("properties/");
      const list = Array.isArray(res.data) ? res.data : [];
      const amounts = list.map((p) => Number(p.rent_amount)).filter((n) => !Number.isNaN(n));
      // UX: allow users to slide down to 0 even if the minimum rent in DB is higher.
      const min = 0;
      const max = amounts.length ? Math.max(...amounts) : 10000;
      set({ priceRange: { min, max } });
    } catch {
      // Keep current range on error
    }
  },

  fetchFilterOptions: async () => {
    try {
      const res = await API.get<{ cities: string[]; property_types: { value: string; label: string }[] }>(
        "properties/filter_options/"
      );
      set({
        filterOptions: {
          cities: res.data.cities ?? [],
          propertyTypes: res.data.property_types ?? [],
        },
      });
    } catch {
      // Keep existing options on error
    }
  },

  toggleFavorite: async (propertyId) => {
    try {
      const res = await API.post<{ status: string }>(`properties/${propertyId}/favorite/`);
      const added = res.data?.status === "added to favorites";
      set((s) => {
        const next = new Set(s.favoriteIds);
        if (added) next.add(propertyId);
        else next.delete(propertyId);
        return { favoriteIds: next };
      });
      // Update favorites_count on property if cached
      set((s) => {
        const delta = added ? 1 : -1;
        const updateProp = (p: Property) =>
          p.id === propertyId
            ? { ...p, favorites_count: (p.favorites_count || 0) + delta }
            : p;
        return {
          properties: s.properties.map(updateProp),
          currentProperty:
            s.currentProperty?.id === propertyId
              ? updateProp(s.currentProperty)
              : s.currentProperty,
        };
      });
      return added;
    } catch {
      return false;
    }
  },

  isFavorite: (propertyId) => get().favoriteIds.has(propertyId),

  fetchReviews: async (propertyId) => {
    set({ isLoadingReviews: true });
    try {
      const res = await API.get<PropertyReview[]>(`properties/reviews/?property=${propertyId}`);
      const list = Array.isArray(res.data) ? res.data : [];
      set((s) => ({
        reviewsByProperty: { ...s.reviewsByProperty, [propertyId]: list },
      }));
      return list;
    } catch {
      return [];
    } finally {
      set({ isLoadingReviews: false });
    }
  },

  createReview: async (payload) => {
    try {
      const res = await API.post<PropertyReview>("properties/reviews/", payload);
      const review = res.data;
      set((s) => {
        const existing = s.reviewsByProperty[payload.property] || [];
        return {
          reviewsByProperty: {
            ...s.reviewsByProperty,
            [payload.property]: [review, ...existing],
          },
        };
      });
      return review;
    } catch {
      return null;
    }
  },

  fetchInquiries: async (propertyId) => {
    set({ isLoadingInquiries: true });
    try {
      const res = await API.get<PropertyInquiry[]>(`properties/inquiries/?property=${propertyId}`);
      const list = Array.isArray(res.data) ? res.data : [];
      set((s) => ({
        inquiriesByProperty: { ...s.inquiriesByProperty, [propertyId]: list },
      }));
      return list;
    } catch {
      return [];
    } finally {
      set({ isLoadingInquiries: false });
    }
  },

  createInquiry: async (payload) => {
    try {
      const res = await API.post<PropertyInquiry>("properties/inquiries/", payload);
      const inquiry = res.data;
      set((s) => {
        const existing = s.inquiriesByProperty[payload.property] || [];
        return {
          inquiriesByProperty: {
            ...s.inquiriesByProperty,
            [payload.property]: [inquiry, ...existing],
          },
        };
      });
      return inquiry;
    } catch {
      return null;
    }
  },

  deleteProperty: async (id) => {
    try {
      await API.delete(`properties/${id}/`);
      set((s) => ({
        properties: s.properties.filter((p) => String(p.id) !== String(id)),
        myProperties: s.myProperties.filter((p) => String(p.id) !== String(id)),
        currentProperty: s.currentProperty?.id === id ? null : s.currentProperty,
      }));
      return true;
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
        "Failed to delete property";
      set({ error: msg });
      return false;
    }
  },

  clearError: () => set({ error: null }),
  clearCurrentProperty: () => set({ currentProperty: null }),
}));
