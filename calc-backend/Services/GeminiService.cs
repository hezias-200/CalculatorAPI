using System.Text;
using System.Text.Json;

namespace CalculatorAPI.Services
{
    public interface IGeminiService
    {
        Task<string> AnalyzeResumeAsync(string resumeText, string jobDescription);
    }

    public class GeminiService : IGeminiService
    {
        private readonly HttpClient _httpClient;
        private readonly string _apiKey;

        public GeminiService(IConfiguration configuration, HttpClient httpClient)
        {
            _httpClient = httpClient;
            _apiKey = configuration["GeminiSettings:ApiKey"]
                ?? throw new InvalidOperationException("Gemini API Key not configured");
        }

        public async Task<string> AnalyzeResumeAsync(string resumeText, string jobDescription)
        {
            var prompt = $@"
You are a resume analyzer. Analyze the resume against the job description.

RESUME:
{resumeText}

JOB DESCRIPTION:
{jobDescription}

CRITICAL: You MUST respond with ONLY valid JSON. Do NOT use markdown, do NOT add backticks, do NOT add any text before or after the JSON.

Return this exact JSON structure:
{{
    ""compatibilityScore"": 75,
    ""matchedSkills"": [""skill1"", ""skill2""],
    ""missingSkills"": [""skill3"", ""skill4""],
    ""suggestions"": ""Your detailed suggestions here""
}}

Return ONLY the JSON object, nothing else.";

            var requestBody = new
            {
                contents = new[]
                {
                    new
                    {
                        parts = new[]
                        {
                            new { text = prompt }
                        }
                    }
                }
            };

            var json = JsonSerializer.Serialize(requestBody);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            var response = await _httpClient.PostAsync(
                $"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={_apiKey}",
                content
            );

            if (!response.IsSuccessStatusCode)
            {
                var error = await response.Content.ReadAsStringAsync();
                throw new Exception($"Gemini API error: {error}");
            }

            var responseJson = await response.Content.ReadAsStringAsync();
            var geminiResponse = JsonDocument.Parse(responseJson);

            var text = geminiResponse.RootElement
                .GetProperty("candidates")[0]
                .GetProperty("content")
                .GetProperty("parts")[0]
                .GetProperty("text")
                .GetString();

            if (string.IsNullOrEmpty(text))
                throw new Exception("Empty response from Gemini");

            Console.WriteLine($"Raw Gemini response: {text}");

            // ✅ Aggressively clean the response
            text = text.Trim();

            // Remove markdown code blocks
            if (text.Contains("```"))
            {
                // Extract JSON between backticks
                var startIndex = text.IndexOf('{');
                var endIndex = text.LastIndexOf('}');

                if (startIndex >= 0 && endIndex > startIndex)
                {
                    text = text.Substring(startIndex, endIndex - startIndex + 1);
                }
            }

            text = text.Trim();

            Console.WriteLine($"Cleaned JSON: {text}");

            return text;
        }
    }
}