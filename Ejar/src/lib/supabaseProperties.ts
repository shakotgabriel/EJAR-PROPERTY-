import { supabase } from "@/lib/supabase";

// TypeScript interface for property
export interface PropertyData {
  title: string;
  price: number | string;
  bedrooms: number | string;
  bathrooms: number | string;
  type: string; // rent or sale
  location: string;
  description: string;
  images?: string[]; // URLs from Supabase Storage
  owner_id: string;
}

// Upload a single image to Supabase Storage
export async function uploadImage(file: File): Promise<string> {
  if (!file) return "";

  const fileName = `${Date.now()}-${file.name}`;

  const { error } = await supabase.storage
    .from("property-images") // make sure bucket name matches
    .upload(fileName, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (error) {
    console.error("Upload error:", error.message);
    throw error;
  }

  const { data: publicUrlData } = supabase.storage
    .from("property-images")
    .getPublicUrl(fileName);

  return publicUrlData.publicUrl;
}

// Upload multiple images
export async function uploadImages(files: File[]): Promise<string[]> {
  const uploadedUrls: string[] = [];
  for (let i = 0; i < files.length; i++) {
    const url = await uploadImage(files[i]);
    uploadedUrls.push(url);
  }
  return uploadedUrls;
}

// Add a new property to Supabase
export async function addProperty(propertyData: PropertyData) {
  const { data, error } = await supabase
    .from("properties")
    .insert([propertyData])
    .select();

  if (error) {
    console.error("Supabase Insert Error:", error.message);
    return { error };
  }

  return { data };
}
