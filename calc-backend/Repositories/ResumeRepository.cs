using System.Linq.Expressions;
using CalculatorAPI.Data;
using CalculatorAPI.Interfaces;
using CalculatorAPI.Models;
using Microsoft.EntityFrameworkCore;

namespace CalculatorAPI.Repositories
{
    public class ResumeRepository : IResumeRepository
    {
        protected readonly ApplicationDbContext _context;

        public ResumeRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public void Add(ResumeAnalysisModel analysis)
        {
            _context.ResumeAnalyses.Add(analysis);
        }

        public void Update(ResumeAnalysisModel analysis)
        {
            _context.ResumeAnalyses.Update(analysis);
        }

        public bool SaveChanges()
        {
            return _context.SaveChanges() > 0;
        }

        public async Task<ResumeAnalysisModel?> GetByIdAsync(int id)
        {
            return await _context.ResumeAnalyses.FindAsync(id);
        }

        public async Task<IEnumerable<ResumeAnalysisModel>> GetAllAsync()
        {
            return await _context.ResumeAnalyses
                .OrderByDescending(r => r.CreatedAt)
                .ToListAsync();
        }

        public async Task<IEnumerable<ResumeAnalysisModel>> GetByUserIdAsync(string userId)
        {
            return await _context.ResumeAnalyses
                .Where(r => r.UserId == userId)
                .OrderByDescending(r => r.CreatedAt)
                .ToListAsync();
        }

        public async Task<ResumeAnalysisModel?> FindAsync(Expression<Func<ResumeAnalysisModel, bool>> predicate)
        {
            return await _context.ResumeAnalyses.FirstOrDefaultAsync(predicate);
        }
    }
}