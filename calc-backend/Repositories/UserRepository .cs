using System.Linq.Expressions;
using CalculatorAPI.Data;
using CalculatorAPI.Interfaces;
using CalculatorAPI.Models;
using Microsoft.EntityFrameworkCore;

namespace CalculatorAPI.Repositories
{
    public class UserRepository :  IUserRepository
    {
        protected readonly ApplicationDbContext _context;

        public UserRepository(ApplicationDbContext context)
        {
            _context = context;
        }
        public  void  Add(UserModel user)
        {
             _context.Users.Add(user);
        }
        public  void Update(UserModel user)
        {
            _context.Users.Update(user);
        }
        public  bool SaveChanges()
        {
            return  _context.SaveChanges() > 0;
        }

        public async Task<bool> IsUsernameUniqueAsync(string username)

        {
            return !await _context.Users.AnyAsync(u => u.Username == username);
        }

        public async Task<UserModel?> GetByUsernameAsync(string username)
        {
            return await _context.Users.FirstOrDefaultAsync(u => u.Username == username);
        }

        public async Task<UserModel?> GetByIdAsync(int id)
        {
            return await _context.Users.FindAsync(id);
        }

        public virtual async Task<UserModel?> FindAsync(Expression<Func<UserModel, bool>> predicate)
        {
            return await _context.Users.FirstOrDefaultAsync(predicate);
        }
    }
}
