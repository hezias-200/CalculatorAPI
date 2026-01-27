import { Component, OnInit, PLATFORM_ID, Inject, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ResumeService, ResumeAnalysis } from '../../services/resume.service';

@Component({
  selector: 'app-view-reports',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './viewreport.html',
  styleUrl: './viewreport.css'
})
export class ViewReports implements OnInit {
  reports: ResumeAnalysis[] = [];
  filteredReports: ResumeAnalysis[] = [];

  // Stats
  totalAnalyses: number = 0;
  passedAnalyses: number = 0;
  belowThreshold: number = 0;
  averageScore: number = 0;

  // Filters
  filterStatus: string = '';
  filterScore: string = '';
  filterDateFrom: string = '';
  filterDateTo: string = '';

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private cdr: ChangeDetectorRef,

    private resumeService: ResumeService,
    private router: Router
  ) { }

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.loadReports();
    }
  }

  loadReports(): void {
    this.resumeService.getHistory().subscribe({
      next: (reports) => {
        this.reports = reports;
        this.filteredReports = reports;
        this.calculateStats();
        this.cdr.detectChanges();

      },
      error: (err) => console.error('Error loading reports:', err)
    });
  }

  calculateStats(): void {
    this.totalAnalyses = this.reports.length;
    this.passedAnalyses = this.reports.filter(r => (r.compatibilityScore || 0) >= 70).length;
    this.belowThreshold = this.reports.filter(r => (r.compatibilityScore || 0) < 70).length;

    const scores = this.reports
      .filter(r => r.compatibilityScore)
      .map(r => r.compatibilityScore!);

    this.averageScore = scores.length > 0
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : 0;
  }

  applyFilters(): void {
    this.filteredReports = this.reports.filter(report => {
      // Status filter
      if (this.filterStatus && report.status !== this.filterStatus) {
        return false;
      }

      // Score filter
      if (this.filterScore) {
        const score = report.compatibilityScore || 0;
        if (this.filterScore === 'high' && score < 80) return false;
        if (this.filterScore === 'medium' && (score < 60 || score >= 80)) return false;
        if (this.filterScore === 'low' && score >= 60) return false;
      }

      // Date filters
      if (this.filterDateFrom) {
        const reportDate = new Date(report.createdAt);
        const fromDate = new Date(this.filterDateFrom);
        if (reportDate < fromDate) return false;
      }

      if (this.filterDateTo) {
        const reportDate = new Date(report.createdAt);
        const toDate = new Date(this.filterDateTo);
        if (reportDate > toDate) return false;
      }

      return true;
    });
  }

  getScoreColor(score?: number): string {
    if (!score) return '#94a3b8';
    if (score >= 80) return '#10b981';
    if (score >= 60) return '#f59e0b';
    return '#ef4444';
  }

  viewDetails(id: number): void {
    // Navigate to resume analyzer with this ID
    this.router.navigate(['/resume-analyzer'], { queryParams: { id } });
  }

  downloadReport(id: number): void {
    // Implement download logic
    alert(`Downloading report #${id}...`);
  }

  deleteReport(id: number): void {
    if (!confirm('Delete this report?')) return;

    this.resumeService.deleteAnalysis(id).subscribe({
      next: () => {
        this.loadReports();
        alert('Report deleted successfully');
      },
      error: (err) => alert('Failed to delete report')
    });
  }

  exportToPDF(): void {
    alert('Exporting to PDF... (Feature coming soon)');
  }

  exportToExcel(): void {
    alert('Exporting to Excel... (Feature coming soon)');
  }

  exportToCSV(): void {
    const csv = this.convertToCSV(this.filteredReports);
    this.downloadCSV(csv, 'resume-reports.csv');
  }

  convertToCSV(data: ResumeAnalysis[]): string {
    const headers = ['ID', 'File Name', 'Status', 'Score', 'Matched Skills', 'Missing Skills', 'Date'];
    const rows = data.map(r => [
      r.id,
      r.fileName,
      r.status,
      r.compatibilityScore || 'N/A',
      r.matchedSkills?.length || 0,
      r.missingSkills?.length || 0,
      new Date(r.createdAt).toLocaleString()
    ]);

    return [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
  }

  downloadCSV(csv: string, filename: string): void {
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }
}