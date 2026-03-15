// Render Options
export interface RenderOptions {
  fit: 'cover' | 'contain';
  offsetX: number;  // -1.0 to 1.0
  offsetY: number;  // -1.0 to 1.0
  outputFormat?: 'png' | 'jpeg';
  quality?: number;  // 1-100 for JPEG
}

// Render Request
export interface RenderRequest {
  photo: File;
  templateId: string;
  options: RenderOptions;
}

// Render Response
export interface RenderResponse {
  imageUrl: string;
  width: number;
  height: number;
}
