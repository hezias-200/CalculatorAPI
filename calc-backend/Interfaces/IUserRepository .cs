using System.Linq.Expressions;
using CalculatorAPI.Models;

namespace CalculatorAPI.Interfaces
{
    public interface IUserRepository 
    {
        void Add(UserModel user);
        void Update(UserModel user);
        bool SaveChanges();
        Task<UserModel?> GetByUsernameAsync(string username);
        Task<bool> IsEmailUniqueAsync(string email);

        Task<UserModel?> GetByIdAsync(int id);
        Task<IEnumerable<UserModel>> GetAllAsync();
        Task<UserModel?> FindAsync(Expression<Func<UserModel, bool>> predicate);

    }
}
