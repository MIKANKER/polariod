// Photo Rectangle Normalized Coordinates (0.0 - 1.0)
export interface PhotoRectNorm {
  x: number;  // 0.0 - 1.0
  y: number;  // 0.0 - 1.0
  w: number;  // 0.0 - 1.0
  h: number;  // 0.0 - 1.0
}

// Template from API
export interface Template {
  id: string;
  filename: string;
  url: string;
  width: number;
  height: number;
  photoRectNorm: PhotoRectNorm;
  createdAt: string;
}

// Template Upload Request
export interface TemplateUploadRequest {
  file: File;
  filename?: string;
  photoRectNorm?: PhotoRectNorm;
}
