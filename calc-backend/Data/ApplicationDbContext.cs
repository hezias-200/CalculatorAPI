using CalculatorAPI.Models;
using Microsoft.EntityFrameworkCore;

namespace CalculatorAPI.Data
{
    public class ApplicationDbContext : DbContext
    {
        public DbSet<UserModel> Users { get; set; }
        public DbSet<ResumeAnalysisModel> ResumeAnalyses { get; set; }  // ✅ Add this

        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
        {
        }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // User unique constraint
            modelBuilder.Entity<UserModel>()
                .HasIndex(u => u.Username)
                .IsUnique();

            // Resume analysis indexes
            modelBuilder.Entity<ResumeAnalysisModel>()
                .HasIndex(r => r.UserId);

            modelBuilder.Entity<ResumeAnalysisModel>()
                .HasIndex(r => r.CreatedAt);
        }
    }
}