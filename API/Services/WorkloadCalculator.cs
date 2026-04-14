using NursingScheduler.API.Entities;

namespace NursingScheduler.API.Services
{
    public static class WorkloadCalculator
    {
        //workload formula: credit hours × multiplier
        //NURS courses (lectures) = 1.0×
        //NLAB courses (labs) = 2.25×
        public static decimal Calculate(Course course)
        {
            var prefix = course.Code.Split(' ')[0].ToUpperInvariant();

            var multiplier = prefix switch
            {
                "NURS" => 1.0m,
                "NLAB" => 2.25m,
                _ => 1.0m
            };

            return course.CreditHours * multiplier;
        }
    }
}
