import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ResumeService, ResumeAnalysis } from '../../services/resume.service';
import { FormatMessagePipe } from './format-message.pipe';

interface Message {
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
}

@Component({
  selector: 'app-resume-analyzer',
  imports: [CommonModule, FormsModule, FormatMessagePipe],
  standalone: true,
  templateUrl: './resume-analyzer.html',
  styleUrl: './resume-analyzer.css',
})
export class ResumeAnalyzer implements OnInit {
  messages: Message[] = [];
  selectedFile: File | null = null;
  jobDescription: string = '';
  userInput: string = '';
  
  step: 'file' | 'description' | 'analyzing' | 'results' = 'file';
  currentAnalysis: ResumeAnalysis | null = null;
  
  showHistory: boolean = false;
  history: ResumeAnalysis[] = [];
  
  private pollingInterval: any = null;  // ✅ Track interval

  constructor(
    private resumeService: ResumeService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.addBotMessage("Hi! 👋 I'm your AI Resume Analyzer. Upload your resume (PDF) to get started!");
    
    // Only load history in browser, not during SSR
    if (typeof window !== 'undefined') {
      this.loadHistory();
    }
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    
    if (file) {
      if (file.type !== 'application/pdf') {
        this.addBotMessage("❌ Please upload a PDF file only.");
        return;
      }
      
      if (file.size > 10 * 1024 * 1024) {
        this.addBotMessage("❌ File size must be less than 10MB.");
        return;
      }
      
      this.selectedFile = file;
      this.addUserMessage(`📄 ${file.name}`);
      this.addBotMessage("Great! Now please paste the job description you want to match against.");
      this.step = 'description';
      this.cdr.detectChanges();
    }
  }

  sendMessage(): void {
    if (!this.userInput.trim()) return;

    if (this.step === 'description') {
      this.jobDescription = this.userInput.trim();
      this.addUserMessage(this.userInput);
      this.userInput = '';
      
      this.addBotMessage("Perfect! Analyzing your resume now... ⏳");
      this.step = 'analyzing';
      
      // Add small delay to ensure state is updated
      setTimeout(() => {
        this.uploadResume();
      }, 100);
    }
    
    this.cdr.detectChanges();
  }

  uploadResume(): void {
    console.log('uploadResume called');
    console.log('selectedFile:', this.selectedFile);
    console.log('jobDescription:', this.jobDescription);
    console.log('jobDescription length:', this.jobDescription?.length);
    
    if (!this.selectedFile || !this.jobDescription) {
      console.error('Missing data!', { file: !!this.selectedFile, desc: !!this.jobDescription });
      return;
    }

    this.resumeService.uploadResume(this.selectedFile, this.jobDescription).subscribe({
      next: (response) => {
        console.log('Upload success:', response);
        this.pollAnalysisStatus(response.id);
      },
      error: (err) => {
        console.error('Upload error:', err);
        this.addBotMessage(`❌ Error: ${err.error?.message || 'Failed to upload resume'}`);
        this.step = 'file';
        this.resetChat();
      }
    });
  }

  pollAnalysisStatus(id: number): void {
    this.pollingInterval = setInterval(() => {
      this.resumeService.getAnalysis(id).subscribe({
        next: (analysis) => {
          if (analysis.status === 'Completed') {
            clearInterval(this.pollingInterval);
            this.pollingInterval = null;
            this.currentAnalysis = analysis;
            this.step = 'results';
            this.showResults(analysis);
            this.loadHistory();
          } else if (analysis.status === 'Failed') {
            clearInterval(this.pollingInterval);
            this.pollingInterval = null;
            this.addBotMessage("❌ Analysis failed. Please try again.");
            this.resetChat();
          }
        },
        error: () => {
          clearInterval(this.pollingInterval);
          this.pollingInterval = null;
          this.addBotMessage("❌ Error getting analysis status.");
          this.resetChat();
        }
      });
    }, 3000);
  }

  showResults(analysis: ResumeAnalysis): void {
    const score = analysis.compatibilityScore || 0;
    let scoreEmoji = score >= 80 ? '🎉' : score >= 60 ? '👍' : '💪';
    
    this.addBotMessage(`${scoreEmoji} **Compatibility Score: ${score}%**`);
    
    if (analysis.matchedSkills && analysis.matchedSkills.length > 0) {
      this.addBotMessage(`✅ **Matched Skills:**\n${analysis.matchedSkills.join(', ')}`);
    }
    
    if (analysis.missingSkills && analysis.missingSkills.length > 0) {
      this.addBotMessage(`❌ **Missing Skills:**\n${analysis.missingSkills.join(', ')}`);
    }
    
    if (analysis.suggestions) {
      this.addBotMessage(`💡 **Suggestions:**\n${analysis.suggestions}`);
    }
    
    this.addBotMessage("Would you like to analyze another resume? Just upload a new PDF! 📄");
    this.resetChat();
  }

  resetChat(): void {
    this.selectedFile = null;
    this.jobDescription = '';
    this.userInput = '';
    this.step = 'file';
    if (typeof document !== 'undefined') {
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    }
  }

  addUserMessage(content: string): void {
    this.messages.push({
      type: 'user',
      content: content,
      timestamp: new Date()
    });
    this.scrollToBottom();
  }

  addBotMessage(content: string): void {
    setTimeout(() => {
      this.messages.push({
        type: 'bot',
        content: content,
        timestamp: new Date()
      });
      this.scrollToBottom();
      this.cdr.detectChanges();
    }, 500);
  }

  scrollToBottom(): void {
    if (typeof document !== 'undefined') {
      setTimeout(() => {
        const chatBox = document.querySelector('.chat-messages');
        if (chatBox) {
          chatBox.scrollTop = chatBox.scrollHeight;
        }
      }, 100);
    }
  }

  loadHistory(): void {
    this.resumeService.getHistory().subscribe({
      next: (history) => {
        this.history = history;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading history:', err);
        // Don't crash - just set empty history
        this.history = [];
        this.cdr.detectChanges();
      }
    });
  }

  viewHistory(analysis: ResumeAnalysis): void {
    this.currentAnalysis = analysis;
    this.showHistory = false;
    this.messages = [];
    this.addBotMessage(`📄 **${analysis.fileName}**`);
    this.showResults(analysis);
  }

  deleteHistory(id: number, event: Event): void {
    event.stopPropagation();
    if (!confirm('Delete this analysis?')) return;
    
    this.resumeService.deleteAnalysis(id).subscribe({
      next: () => this.loadHistory()
    });
  }

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }

  stopAnalysis(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
    this.addBotMessage("⏹️ Analysis stopped. Upload a new resume to start again.");
    this.resetChat();
  }
}