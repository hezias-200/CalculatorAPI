namespace CalculatorAPI.Models
{
    public class RegisterModel
    {
        private string _username = string.Empty;

        public required string Username
        {
            get => _username;
            set => _username = value?.ToLower() ?? string.Empty;
        }

        public required string Password { get; set; } = string.Empty;
    }
}