export enum SchoolStatus {
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
  DELAYED = 'DELAYED',
  UNKNOWN = 'UNKNOWN'
}

export interface WebSource {
  title: string;
  uri: string;
}

export interface StatusResponse {
  status: SchoolStatus;
  summary: string;
  sources: WebSource[];
  timestamp: string;
  checkedDate: string;
}

export interface GeminiGroundingChunk {
  web?: {
    uri?: string;
    title?: string;
  };
}