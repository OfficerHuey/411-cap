using Microsoft.EntityFrameworkCore;
using NursingScheduler.API.Entities;

namespace NursingScheduler.API.Data
{
    public class Seed
    {
        public static async Task SeedCourses(DataContext context)
        {
            //canonical course list from ashley's block schedule and semester documents
            //credit hours are estimated defaults that may need refinement after ashley reviews
            var canonicalCourses = new List<Course>
            {
                //semester 1
                new Course { Code = "N3140", Name = "Pathophysiology I", SemesterLevel = 1, DefaultType = CourseType.Lecture, CreditHours = 3 },
                new Course { Code = "N3190", Name = "Pharmacology I", SemesterLevel = 1, DefaultType = CourseType.Lecture, CreditHours = 2 },
                new Course { Code = "N3330", Name = "Health Assessment", SemesterLevel = 1, DefaultType = CourseType.Lecture, CreditHours = 2 },
                new Course { Code = "N3390", Name = "Foundations of Nursing", SemesterLevel = 1, DefaultType = CourseType.Lecture, CreditHours = 3 },
                new Course { Code = "NL3050", Name = "Foundations of Nursing Lab", SemesterLevel = 1, DefaultType = CourseType.Lab, CreditHours = 1 },
                new Course { Code = "NL3150", Name = "Health Assessment Lab", SemesterLevel = 1, DefaultType = CourseType.Lab, CreditHours = 1 },

                //semester 2
                new Course { Code = "N3310", Name = "Adult Health Nursing I", SemesterLevel = 2, DefaultType = CourseType.Lecture, CreditHours = 3 },
                new Course { Code = "N3320", Name = "Professional Nursing Issues", SemesterLevel = 2, DefaultType = CourseType.Lecture, CreditHours = 1 },
                new Course { Code = "N3710", Name = "Pathophysiology II", SemesterLevel = 2, DefaultType = CourseType.Lecture, CreditHours = 2 },
                new Course { Code = "N3780", Name = "Pharmacology II", SemesterLevel = 2, DefaultType = CourseType.Lecture, CreditHours = 2 },
                new Course { Code = "NL3340", Name = "Adult Health Nursing I Lab", SemesterLevel = 2, DefaultType = CourseType.Lab, CreditHours = 2 },
                new Course { Code = "NL3730", Name = "Adult Health Nursing I Clinical", SemesterLevel = 2, DefaultType = CourseType.Clinical, CreditHours = 3, DefaultLabCapacity = 12 }, //hospital-based

                //semester 3
                new Course { Code = "N3720", Name = "Adult Health Nursing II", SemesterLevel = 3, DefaultType = CourseType.Lecture, CreditHours = 3 },
                new Course { Code = "N3750", Name = "Mental Health Nursing", SemesterLevel = 3, DefaultType = CourseType.Lecture, CreditHours = 3 },
                new Course { Code = "N3830", Name = "Family Health Nursing", SemesterLevel = 3, DefaultType = CourseType.Lecture, CreditHours = 2 },
                new Course { Code = "NL3350", Name = "Adult Health Nursing II Lab", SemesterLevel = 3, DefaultType = CourseType.Lab, CreditHours = 2 },
                new Course { Code = "NL3820", Name = "Mental Health Nursing Clinical", SemesterLevel = 3, DefaultType = CourseType.Clinical, CreditHours = 2, DefaultLabCapacity = 12 }, //hospital-based

                //semester 4 (term 1 / term 2 split)
                new Course { Code = "N4710", Name = "Childbearing Family Nursing", SemesterLevel = 4, DefaultType = CourseType.Lecture, CreditHours = 2 },
                new Course { Code = "N4750", Name = "Care of Infants and Children", SemesterLevel = 4, DefaultType = CourseType.Lecture, CreditHours = 2 },
                new Course { Code = "N4850", Name = "Professional Transitions", SemesterLevel = 4, DefaultType = CourseType.Lecture, CreditHours = 2 },
                new Course { Code = "NL4030", Name = "Clinical Competency Lab III", SemesterLevel = 4, DefaultType = CourseType.Lab, CreditHours = 1 },
                new Course { Code = "NL4730", Name = "Childbearing Family Clinical", SemesterLevel = 4, DefaultType = CourseType.Clinical, CreditHours = 2, DefaultLabCapacity = 12 }, //hospital-based
                new Course { Code = "NL4770", Name = "Care of Infants and Children Clinical", SemesterLevel = 4, DefaultType = CourseType.Clinical, CreditHours = 2, DefaultLabCapacity = 12 }, //hospital-based

                //semester 5 (senior/preceptorship)
                new Course { Code = "N4790", Name = "Issues in Professional Nursing", SemesterLevel = 5, DefaultType = CourseType.Lecture, CreditHours = 2 },
                new Course { Code = "N4820", Name = "Senior Capstone", SemesterLevel = 5, DefaultType = CourseType.Lecture, CreditHours = 2 },
                new Course { Code = "N4870", Name = "Leadership and Management", SemesterLevel = 5, DefaultType = CourseType.Lecture, CreditHours = 3 },
                new Course { Code = "NL4880", Name = "Leadership and Management Lab", SemesterLevel = 5, DefaultType = CourseType.Lab, CreditHours = 1, DefaultLabCapacity = 12 }, //hospital-based
                new Course { Code = "NL4890", Name = "Preceptorship", SemesterLevel = 5, DefaultType = CourseType.Clinical, CreditHours = 4, DefaultLabCapacity = 12 } //hospital-based
            };

            var canonicalCodes = canonicalCourses.Select(c => c.Code).ToHashSet();

            //per-course idempotent: only insert courses that don't already exist by code
            var existingCodes = await context.Courses.Select(c => c.Code).ToListAsync();
            var existingCodeSet = existingCodes.ToHashSet();

            //warn about courses in the db that aren't in the canonical list
            foreach (var code in existingCodes)
            {
                if (!canonicalCodes.Contains(code))
                    Console.WriteLine($"WARNING: Course '{code}' exists in the database but is not in the canonical course list");
            }

            //add missing canonical courses
            var toAdd = canonicalCourses.Where(c => !existingCodeSet.Contains(c.Code)).ToList();
            if (toAdd.Count > 0)
            {
                await context.Courses.AddRangeAsync(toAdd);
                await context.SaveChangesAsync();
            }
        }

        //seed real rooms from ashley's block schedule documents
        public static async Task SeedRooms(DataContext context)
        {
            if (await context.Rooms.AnyAsync()) return;

            var rooms = new List<Room>
            {
                //hammond campus - khsa building
                new Room { RoomNumber = "1005", Building = "KHSA", Campus = "Hammond", Capacity = 36, Type = RoomType.Lecture },
                new Room { RoomNumber = "1006", Building = "KHSA", Campus = "Hammond", Capacity = 36, Type = RoomType.Lecture },
                new Room { RoomNumber = "2002", Building = "KHSA", Campus = "Hammond", Capacity = 36, Type = RoomType.Lecture },
                new Room { RoomNumber = "2007", Building = "KHSA", Campus = "Hammond", Capacity = 8, Type = RoomType.Lab },
                new Room { RoomNumber = "2008", Building = "KHSA", Campus = "Hammond", Capacity = 8, Type = RoomType.Lab },
                new Room { RoomNumber = "2010", Building = "KHSA", Campus = "Hammond", Capacity = 8, Type = RoomType.SimLab },

                //baton rouge campus - brc building
                new Room { RoomNumber = "BRC-258", Building = "BRC", Campus = "Baton Rouge", Capacity = 36, Type = RoomType.Lecture },
                new Room { RoomNumber = "BRC-260", Building = "BRC", Campus = "Baton Rouge", Capacity = 36, Type = RoomType.Lecture },
                new Room { RoomNumber = "BRC-262", Building = "BRC", Campus = "Baton Rouge", Capacity = 8, Type = RoomType.Lab },
                new Room { RoomNumber = "BRC-264", Building = "BRC", Campus = "Baton Rouge", Capacity = 8, Type = RoomType.Lab },

                //st tammany campus - stac building (requested only, not owned)
                new Room { RoomNumber = "STAC-101", Building = "STAC", Campus = "St. Tammany", Capacity = 30, Type = RoomType.Lecture, IsRequestOnly = true },
                new Room { RoomNumber = "STAC-105", Building = "STAC", Campus = "St. Tammany", Capacity = 8, Type = RoomType.Lab, IsRequestOnly = true }
            };

            await context.Rooms.AddRangeAsync(rooms);
            await context.SaveChangesAsync();
        }
    }
}
