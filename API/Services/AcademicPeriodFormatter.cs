using System.Text.RegularExpressions;
using NursingScheduler.API.Entities;

namespace NursingScheduler.API.Services
{
    public static class AcademicPeriodFormatter
    {
        //formats the academic period string for workday mass enrollment export
        public static string Format(Semester semester, TermType? term)
        {
            var match = Regex.Match(semester.Name, @"^(\w+)\s+(\d{4})$");

            string season;
            string year;

            if (match.Success)
            {
                season = match.Groups[1].Value;
                year = match.Groups[2].Value;
            }
            else
            {
                //graceful fallback if semester name doesn't match expected pattern
                Console.WriteLine($"WARNING: Semester name '{semester.Name}' does not match expected 'Season Year' format");
                return semester.Name;
            }

            return term switch
            {
                null or TermType.Full => $"{season} {year}",
                TermType.Term1 => $"{season} Term I {year}",
                TermType.Term2 => $"{season} Term II {year}",
                _ => throw new InvalidOperationException($"Unrecognized TermType value: {term}")
            };
        }
    }
}
