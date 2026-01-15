using CalculatorAPI.Interfaces;
using CalculatorAPI.Models;
using CalculatorAPI.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using System.Text.Json;

namespace CalculatorAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]  // All endpoints require authentication
    public class ResumeController : ControllerBase
    {
        private readonly IResumeRepository _resumeRepository;
        private readonly IPdfService _pdfService;
        private readonly IGeminiService _geminiService;
        private readonly IWebHostEnvironment _environment;
        private readonly IServiceScopeFactory _scopeFactory;  // ✅ Add this

        public ResumeController(
            IResumeRepository resumeRepository,
            IPdfService pdfService,
            IGeminiService geminiService,
            IWebHostEnvironment environment,
            IServiceScopeFactory scopeFactory)  // ✅ Add this
        {
            _resumeRepository = resumeRepository;
            _pdfService = pdfService;
            _geminiService = geminiService;
            _environment = environment;
            _scopeFactory = scopeFactory;  // ✅ Add this
        }

        [HttpPost("upload")]
        [Consumes("multipart/form-data")]
        [ApiExplorerSettings(IgnoreApi = true)]  // ✅ Hide from Swagger
        public async Task<IActionResult> UploadResume([FromForm(Name = "file")] IFormFile? file, [FromForm(Name = "jobDescription")] string? jobDescription)
        {
            try
            {
                // DEBUG: Log what we received
                Console.WriteLine($"File received: {file?.FileName ?? "NULL"}");
                Console.WriteLine($"Job description received: '{jobDescription ?? "NULL"}'");
                Console.WriteLine($"Job description length: {jobDescription?.Length ?? 0}");

                // Validate file
                if (file == null || file.Length == 0)
                    return BadRequest("No file uploaded");

                if (!file.ContentType.Equals("application/pdf", StringComparison.OrdinalIgnoreCase))
                    return BadRequest("Only PDF files are allowed");

                if (file.Length > 10 * 1024 * 1024) // 10MB limit
                    return BadRequest("File size exceeds 10MB limit");

                if (string.IsNullOrWhiteSpace(jobDescription))
                    return BadRequest("Job description is required");

                // Get username from JWT token
                var username = User.FindFirst("username")?.Value
                    ?? throw new UnauthorizedAccessException("User not found");

                // Save file
                var uploadsFolder = Path.Combine(_environment.ContentRootPath, "uploads", "resumes");
                Directory.CreateDirectory(uploadsFolder);

                var fileName = $"{Guid.NewGuid()}_{file.FileName}";
                var filePath = Path.Combine(uploadsFolder, fileName);

                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await file.CopyToAsync(stream);
                }

                // Extract text from PDF
                string extractedText;
                using (var stream = new FileStream(filePath, FileMode.Open, FileAccess.Read))
                {
                    extractedText = await _pdfService.ExtractTextFromPdfAsync(stream);
                }

                // Create analysis record
                var analysis = new ResumeAnalysisModel
                {
                    UserId = username,
                    FileName = file.FileName,
                    FilePath = filePath,
                    JobDescription = jobDescription,
                    ExtractedText = extractedText,
                    AnalysisStatus = "Processing"
                };

                _resumeRepository.Add(analysis);
                _resumeRepository.SaveChanges();

                // Start background analysis (async without await)
                _ = Task.Run(async () => await AnalyzeResumeAsync(analysis.Id));

                return Ok(new
                {
                    id = analysis.Id,
                    message = "Resume uploaded successfully. Analysis in progress...",
                    status = "Processing"
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error processing resume", error = ex.Message });
            }
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetAnalysis(int id)
        {
            var analysis = await _resumeRepository.GetByIdAsync(id);

            if (analysis == null)
                return NotFound("Analysis not found");

            // Check if user owns this analysis
            var username = User.FindFirst("username")?.Value;
            if (analysis.UserId != username && !User.IsInRole("Admin"))
                return Forbid();

            return Ok(new
            {
                id = analysis.Id,
                fileName = analysis.FileName,
                jobDescription = analysis.JobDescription,
                status = analysis.AnalysisStatus,
                compatibilityScore = analysis.CompatibilityScore,
                matchedSkills = analysis.MatchedSkills != null ? JsonSerializer.Deserialize<string[]>(analysis.MatchedSkills) : null,
                missingSkills = analysis.MissingSkills != null ? JsonSerializer.Deserialize<string[]>(analysis.MissingSkills) : null,
                suggestions = analysis.Suggestions,
                createdAt = analysis.CreatedAt,
                completedAt = analysis.CompletedAt
            });
        }

        [HttpGet("history")]
        public async Task<IActionResult> GetHistory()
        {
            var username = User.FindFirst("username")?.Value
                ?? throw new UnauthorizedAccessException("User not found");

            var analyses = await _resumeRepository.GetByUserIdAsync(username);

            var result = analyses.Select(a => new
            {
                id = a.Id,
                fileName = a.FileName,
                status = a.AnalysisStatus,
                compatibilityScore = a.CompatibilityScore,
                createdAt = a.CreatedAt
            });

            return Ok(result);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteAnalysis(int id)
        {
            var analysis = await _resumeRepository.GetByIdAsync(id);

            if (analysis == null)
                return NotFound("Analysis not found");

            var username = User.FindFirst("username")?.Value;
            if (analysis.UserId != username && !User.IsInRole("Admin"))
                return Forbid();

            // Delete file
            if (System.IO.File.Exists(analysis.FilePath))
            {
                System.IO.File.Delete(analysis.FilePath);
            }

            _resumeRepository.Update(analysis);
            _resumeRepository.SaveChanges();

            return Ok(new { message = "Analysis deleted successfully" });
        }

        private async Task AnalyzeResumeAsync(int analysisId)
        {
            // ✅ Create a new scope for background task
            using var scope = _scopeFactory.CreateScope();
            var resumeRepository = scope.ServiceProvider.GetRequiredService<IResumeRepository>();
            var geminiService = scope.ServiceProvider.GetRequiredService<IGeminiService>();

            try
            {
                var analysis = await resumeRepository.GetByIdAsync(analysisId);
                if (analysis == null)
                {
                    Console.WriteLine($"❌ Analysis {analysisId} not found");
                    return;
                }

                Console.WriteLine($"🔄 Starting analysis for ID {analysisId}");

                // Call Gemini AI
                var aiResponse = await geminiService.AnalyzeResumeAsync(
                    analysis.ExtractedText ?? "",
                    analysis.JobDescription
                );

                Console.WriteLine($"✅ Got AI response: {aiResponse}");

                // Parse AI response
                var result = JsonSerializer.Deserialize<JsonElement>(aiResponse.Trim());

                analysis.CompatibilityScore = result.GetProperty("compatibilityScore").GetInt32();
                analysis.MatchedSkills = JsonSerializer.Serialize(result.GetProperty("matchedSkills"));
                analysis.MissingSkills = JsonSerializer.Serialize(result.GetProperty("missingSkills"));
                analysis.Suggestions = result.GetProperty("suggestions").GetString();
                analysis.AnalysisStatus = "Completed";
                analysis.CompletedAt = DateTime.UtcNow;

                resumeRepository.Update(analysis);
                resumeRepository.SaveChanges();

                Console.WriteLine($"✅ Analysis {analysisId} completed successfully");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Error analyzing resume {analysisId}: {ex.Message}");
                Console.WriteLine($"❌ Stack trace: {ex.StackTrace}");

                var analysis = await resumeRepository.GetByIdAsync(analysisId);
                if (analysis != null)
                {
                    analysis.AnalysisStatus = "Failed";
                    analysis.Suggestions = $"Error: {ex.Message}";
                    resumeRepository.Update(analysis);
                    resumeRepository.SaveChanges();
                }
            }
        }
    }
}