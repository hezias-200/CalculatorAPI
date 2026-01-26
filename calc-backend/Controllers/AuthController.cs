using CalculatorAPI.Models;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using FluentValidation;
using CalculatorAPI.Data;
using Microsoft.EntityFrameworkCore;
using System.Security.Cryptography;
using Microsoft.AspNetCore.Authorization;
using CalculatorAPI.Interfaces;

namespace CalculatorAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IConfiguration _configuration;
        private readonly IUserRepository _userRepository;
        private readonly IValidator<RegisterModel> _registerValidator;

        public AuthController(
            IConfiguration configuration,
            IUserRepository userRepository,
            IValidator<RegisterModel> registerValidator)
        {
            _configuration = configuration;
            _userRepository = userRepository;
            _registerValidator = registerValidator;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterModel model)
        {
            var validationResult = await _registerValidator.ValidateAsync(model);
            if (!validationResult.IsValid)
            {
                return BadRequest(validationResult.Errors.Select(e => e.ErrorMessage));
            }

            if (!await _userRepository.IsEmailUniqueAsync(model.Email))
            {
                return BadRequest("Email already exists");
            }

            var user = new UserModel
            {
                Username = model.Username,
                Email = model.Email,

                PasswordHash = HashPassword(model.Password),
                Role = model.Role,
                IsActive = true
            };

            _userRepository.Add(user);
            _userRepository.SaveChanges();

            return Ok(new { message = "User registered successfully" });
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginModel model)
        {
            var user = await _userRepository.FindAsync(u =>
                u.Username == model.Username &&  u.IsActive == true );

            if (user == null || !VerifyPassword(model.Password, user.PasswordHash))
            {
                return Unauthorized();
            }

            var token = GenerateJwtToken(user);

            return Ok(new { token, user.Username,user.Email });
        }

        [HttpDelete("users/{username}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteUser(string username)
        {
            var user = await _userRepository.GetByUsernameAsync(username);

            if (user == null)
            {
                return NotFound("User not found");
            }

            user.IsActive = false;
            _userRepository.Update(user);
            _userRepository.SaveChanges();

            return Ok(new { message = "User successfully deactivated" });
        }
        private string GenerateJwtToken(UserModel user)
        {
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["JwtSettings:SecretKey"]!));
            var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var claims = new[]
            {
              new Claim("username", user.Username),
              new Claim("role", user.Role)
            };

            var token = new JwtSecurityToken(
                issuer: _configuration["JwtSettings:Issuer"],
                audience: _configuration["JwtSettings:Audience"],
                claims: claims,
                expires: DateTime.Now.AddHours(1),
                signingCredentials: credentials
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
        [HttpGet("users")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetAllUsers()
        {
            var users = await _userRepository.GetAllAsync();

            var userDtos = users.Select(u => new
            {
                id = u.Id,
                username = u.Username,
                role = u.Role,
                isActive = u.IsActive
            });

            return Ok(userDtos);
        }

        private string HashPassword(string password)
        {
            using var sha256 = SHA256.Create();
            var hashedBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(password));
            return Convert.ToBase64String(hashedBytes);
        }

        private bool VerifyPassword(string password, string hash)
        {
            return HashPassword(password) == hash;
        }
    }
}
