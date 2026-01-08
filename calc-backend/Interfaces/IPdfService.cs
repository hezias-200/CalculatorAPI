using System.Text;
using iText.Kernel.Pdf;
using iText.Kernel.Pdf.Canvas.Parser;
using iText.Kernel.Pdf.Canvas.Parser.Listener;

namespace CalculatorAPI.Services
{
    public interface IPdfService
    {
        Task<string> ExtractTextFromPdfAsync(Stream pdfStream);
    }

    public class PdfService : IPdfService
    {
        public async Task<string> ExtractTextFromPdfAsync(Stream pdfStream)
        {
            return await Task.Run(() =>
            {
                using var pdfReader = new PdfReader(pdfStream);
                using var pdfDocument = new PdfDocument(pdfReader);
                
                var text = new StringBuilder();
                
                for (int page = 1; page <= pdfDocument.GetNumberOfPages(); page++)
                {
                    var strategy = new SimpleTextExtractionStrategy();
                    var pageText = PdfTextExtractor.GetTextFromPage(pdfDocument.GetPage(page), strategy);
                    text.AppendLine(pageText);
                }
                
                return text.ToString();
            });
        }
    }
}