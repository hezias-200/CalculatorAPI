namespace CalculatorAPI.Models
{
    public class RegisterModel
    {
        private string _username = string.Empty;
        private string _email = string.Empty;
        private string _role = string.Empty;

        public required string Username
        {
            get => _username;
            set => _username = value?.ToLower() ?? string.Empty;
        }
        public required string Role
        {
            get => _role;
            set => _role = value ?? string.Empty;
        }
        public required string Email
        {
            get => _email;
            set => _email = value?.ToLower() ?? string.Empty;
        }
        public required string Password { get; set; } = string.Empty;
    }
}