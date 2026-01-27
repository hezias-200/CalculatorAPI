import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { Router } from '@angular/router';
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
  private cachedResumeHistory: ResumeAnalysis[] = [];

  constructor(private http: HttpClient, private router: Router) { }

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
    return this.http.get<ResumeAnalysis[]>(`${this.apiUrl}/history`).pipe(
      tap(resumes =>
        this.cachedResumeHistory = resumes))
  };
  getFileNames(): string[] {
    return this.cachedResumeHistory.map(resume => resume.fileName);
  }


  getCreatedAt(): string[] {
    return this.cachedResumeHistory.map(resume => resume.createdAt);
  }

  getStatus(): string[] {
    return this.cachedResumeHistory.map(resume => resume.status);
  }

  getPassedAnalyses(): number {
    return this.cachedResumeHistory.filter(resume => resume.status === 'Completed').length;
  }
  getProcessingAnalyses(): number {
    return this.cachedResumeHistory.filter(resume => resume.status === 'Processing').length;
  }
  getAvgAnalyses(): string {
    const total = this.getPassedAnalyses() / this.getTotalAnalyses();

    return total ? ((total * 100).toFixed(2)) : '0.00';

  }
  getTotalAnalyses(): number {
    return this.cachedResumeHistory.length;
  }

  deleteAnalysis(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
  goToResumeAnalyzer(): void {
    this.router.navigate(['/resume-analyzer']);
  }
  goToViewReports(): void {
    this.router.navigate(['/view-reports']);
  }
}