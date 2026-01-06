using System.Security.Claims;
using CalculatorAPI.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
namespace CalculatorAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CalculatorController : ControllerBase
    {
        private readonly IConfiguration _configuration;
        private readonly ICalculatorService _calculatorService;


        public CalculatorController(IConfiguration configuration, ICalculatorService calculatorService)
        {
            _configuration = configuration;
            _calculatorService= calculatorService;
        }

        [HttpGet("sum")]
        [Authorize(Roles = "User,Admin")]

        public IActionResult Sum([FromQuery] double a, [FromQuery] double b)
        {
            var result = _calculatorService.Sum(a, b);
            return Ok(result);
        }

        [HttpGet("subtract")]
        [Authorize(Roles = "User,Admin")]
        public IActionResult Subtract([FromQuery] double a, [FromQuery] double b)
        {
            var result = _calculatorService.Subtract(a, b);

            return Ok(result);
        }

        [HttpGet("divide")]
        [Authorize(Roles = "User,Admin")]
        public IActionResult Divide([FromQuery] double a, [FromQuery] double b)
        {
            var result = _calculatorService.Divide(a, b);
            return Ok(result);
        }

    }
}
