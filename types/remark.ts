export interface Remark {
  id: string;
  sailorId: string;
  remarkText: string;
  createdAt: string;
  lastUpdatedAt: string;
}

export interface CreateRemarkRequest {
  remarkText: string;
}

export interface CreateRemarkResponse {
  id: string;
  sailorId: string;
  remarkText: string;
  createdAt: string;
  lastUpdatedAt: string;
}

export interface RemarkApiParams {
  trainingCenterId: string;
  attendeeId: string;
  remarkId?: string;
}
