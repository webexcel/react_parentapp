// Gallery Image
export interface GalleryImage {
  id: string;
  uri: string;
  thumbnailUri?: string;
  caption?: string;
}

// Gallery Album/Category
export interface GalleryAlbum {
  id: string;
  title: string;
  description?: string;
  date: string;
  coverImage: string;
  imageCount: number;
  images: GalleryImage[];
}

// API Response Types
export interface GalleryCategoryApiItem {
  CatID: number;
  CatName: string;
  Description?: string;
  SMSdate: string;
  images: string[];
}

export interface GalleryCategoriesResponse {
  status: boolean;
  message: string;
  data?: GalleryCategoryApiItem[];
  url?: string;
}

export interface GalleryImageApiItem {
  GalID: number;
  GalCatID: number;
  GalPath: string;
}

export interface GalleryImagesResponse {
  status: boolean;
  message: string;
  data?: GalleryImageApiItem[];
  url?: string;
}
