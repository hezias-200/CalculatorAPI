import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ResumeAnalysis {
  id: number;
  fileName: string;
  jobDescription: string;
  status: string;
  compatibilityScore?: number;
  matchedSkills?: string[];
  missingSkills?: string[];
  suggestions?: string;
  createdAt: string;
  completedAt?: string;
}

export interface UploadResponse {
  id: number;
  message: string;
  status: string;
}

@Injectable({
  providedIn: 'root'
})
export class ResumeService {
  private apiUrl = 'https://localhost:7191/api/Resume';

  constructor(private http: HttpClient) {}

  uploadResume(file: File, jobDescription: string): Observable<UploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('jobDescription', jobDescription);

    return this.http.post<UploadResponse>(`${this.apiUrl}/upload`, formData);
  }

  getAnalysis(id: number): Observable<ResumeAnalysis> {
    return this.http.get<ResumeAnalysis>(`${this.apiUrl}/${id}`);
  }

  getHistory(): Observable<ResumeAnalysis[]> {
    return this.http.get<ResumeAnalysis[]>(`${this.apiUrl}/history`);
  }

  deleteAnalysis(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}