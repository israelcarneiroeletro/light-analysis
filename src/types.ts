export interface GasImage {
  id: string;
  name: string;
  previewUrl: string;
  directDownloadUrl: string;
}

export interface GasBatchResponse {
  folderName: string;
  folderId: string;
  batchIndex: number;
  totalBatches: number;
  images: GasImage[];
}

export interface GeminiAnalysis {
  lightsOn: boolean;
  confidence: number;
  explanation: string;
}

export type ValidationStatus = 'pending' | 'confirmed' | 'denied';

export interface ProcessedImage extends GasImage {
  folderName: string;
  aiResult: GeminiAnalysis | null;
  aiError?: string;
  humanOverride: boolean | null; // true if human says ON, false if OFF, null if not overridden
  finalStatus: boolean | null; // true if ON, false if OFF, null if pending
  validationStatus: ValidationStatus;
}
