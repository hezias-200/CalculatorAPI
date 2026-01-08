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
You are an expert resume analyzer. Analyze the following resume against the job description and provide a detailed analysis.

RESUME:
{resumeText}

JOB DESCRIPTION:
{jobDescription}

Provide your analysis in the following JSON format (respond ONLY with valid JSON, no other text):
{{
    ""compatibilityScore"": <number 0-100>,
    ""matchedSkills"": [""skill1"", ""skill2"", ...],
    ""missingSkills"": [""skill1"", ""skill2"", ...],
    ""suggestions"": ""Detailed suggestions for improvement""
}}";

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
            var url = $"https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key={_apiKey}";

            var response = await _httpClient.PostAsync(
             $"https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key={_apiKey}",
                content
            );
            if (!response.IsSuccessStatusCode)
            {
                var error = await response.Content.ReadAsStringAsync();
                throw new Exception($"Gemini API error: {error}");
            }

            var responseJson = await response.Content.ReadAsStringAsync();


            var geminiResponse = JsonDocument.Parse(responseJson);

            Console.WriteLine(geminiResponse);


            var text = geminiResponse.RootElement
                .GetProperty("candidates")[0]
                .GetProperty("content")
                .GetProperty("parts")[0]
                .GetProperty("text")
                .GetString();

            return text ?? throw new Exception("Empty response from Gemini");
        }
    }
}