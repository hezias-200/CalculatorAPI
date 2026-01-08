namespace CalculatorAPI.Models
{
    public class ResumeAnalysisModel
    {
        public int Id { get; set; }
        public required string UserId { get; set; }  // Username of who uploaded
        public required string FileName { get; set; }
        public required string FilePath { get; set; }  // Where PDF is stored
        public required string JobDescription { get; set; }
        public string? ExtractedText { get; set; }  // Text from PDF
        public int? CompatibilityScore { get; set; }  // 0-100
        public string? MatchedSkills { get; set; }  // JSON array of matched skills
        public string? MissingSkills { get; set; }  // JSON array of missing skills
        public string? Suggestions { get; set; }  // AI suggestions
        public string? AnalysisStatus { get; set; } = "Pending";  // Pending, Processing, Completed, Failed
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? CompletedAt { get; set; }
    }
}