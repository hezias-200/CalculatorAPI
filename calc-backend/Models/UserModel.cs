namespace CalculatorAPI.Models
{
    public class UserModel
    {
        public int Id { get; set; }
        public required string Username { get; set; }
        public required string Email { get; set; }

        public required string PasswordHash { get; set; }
        public required string Role { get; set; }
        public bool IsActive { get; set; } = true;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    }
}
