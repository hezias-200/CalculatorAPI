using CalculatorAPI.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace CalculatorAPI.Services
{
    public class CalculatorService : ICalculatorService
    {
        public double Sum(double a, double b)
        {
            return a + b;
        }
        public double Subtract(double a, double b)
        {
            return a - b;
        }
        public double Divide(double a, double b)
        {
            if (b == 0)
            {
                throw new DivideByZeroException();
            }
            return a / b;
        }
    }
}
