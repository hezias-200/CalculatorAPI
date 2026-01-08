using CalculatorAPI.Models;
using System.Linq.Expressions;

namespace CalculatorAPI.Interfaces
{
    public interface IResumeRepository
    {
        void Add(ResumeAnalysisModel analysis);
        void Update(ResumeAnalysisModel analysis);
        bool SaveChanges();
        Task<ResumeAnalysisModel?> GetByIdAsync(int id);
        Task<IEnumerable<ResumeAnalysisModel>> GetAllAsync();
        Task<IEnumerable<ResumeAnalysisModel>> GetByUserIdAsync(string userId);
        Task<ResumeAnalysisModel?> FindAsync(Expression<Func<ResumeAnalysisModel, bool>> predicate);
    }
}