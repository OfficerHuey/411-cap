using Microsoft.EntityFrameworkCore;
using NursingScheduler.API.Entities;

namespace NursingScheduler.API.Data
{
    public class Seed
    {
        public static async Task SeedCourses(DataContext context)
        {
            //check if ANY courses exist. If yes, stop we don't want duplicates
            if (await context.Courses.AnyAsync()) return;

            //master list of BSN courses
            var courses = new List<Course>
            {
                //semester 1
                new Course { Code = "NURS 339", Name = "Medication Math", SemesterLevel = 1, DefaultType = CourseType.Lecture },
                new Course { Code = "NURS 314", Name = "Health Assessment", SemesterLevel = 1, DefaultType = CourseType.Lecture },
                new Course { Code = "NURS 315", Name = "Health Assessment Lab", SemesterLevel = 1, DefaultType = CourseType.Lab },
                new Course { Code = "NURS 319", Name = "Pathophysiology & Pharmacology I", SemesterLevel = 1, DefaultType = CourseType.Lecture },
                new Course { Code = "NURS 333", Name = "Orientation to Roles", SemesterLevel = 1, DefaultType = CourseType.Lecture },
                new Course { Code = "NURS 305", Name = "Clinical Competency Lab I", SemesterLevel = 1, DefaultType = CourseType.Clinical },

                //semester 2
                new Course { Code = "NURS 371", Name = "Foundations of Nursing Practice", SemesterLevel = 2, DefaultType = CourseType.Lecture },
                new Course { Code = "NURS 373", Name = "Foundations Lab", SemesterLevel = 2, DefaultType = CourseType.Lab },
                new Course { Code = "NURS 378", Name = "Research in Nursing", SemesterLevel = 2, DefaultType = CourseType.Lecture },
                new Course { Code = "NURS 331", Name = "Pathophysiology & Pharmacology II", SemesterLevel = 2, DefaultType = CourseType.Lecture },
                new Course { Code = "NURS 332", Name = "Health Assessment Families/Groups", SemesterLevel = 2, DefaultType = CourseType.Lecture },
                new Course { Code = "NURS 334", Name = "Pharmacology Lab", SemesterLevel = 2, DefaultType = CourseType.Lab },

                //semester 3
                new Course { Code = "NURS 372", Name = "Adult Health Nursing", SemesterLevel = 3, DefaultType = CourseType.Lecture },
                new Course { Code = "NURS 375", Name = "Gerontological Nursing", SemesterLevel = 3, DefaultType = CourseType.Lecture },
                new Course { Code = "NURS 382", Name = "Adult & Gerontology Lab", SemesterLevel = 3, DefaultType = CourseType.Lab },
                new Course { Code = "NURS 383", Name = "Psychiatric Mental Health", SemesterLevel = 3, DefaultType = CourseType.Lecture },
                new Course { Code = "NURS 335", Name = "Clinical Competency Lab II", SemesterLevel = 3, DefaultType = CourseType.Clinical },

                //semester 4
                new Course { Code = "NURS 471", Name = "Care of Childbearing Family", SemesterLevel = 4, DefaultType = CourseType.Lecture },
                new Course { Code = "NURS 473", Name = "Childbearing Family Lab", SemesterLevel = 4, DefaultType = CourseType.Lab },
                new Course { Code = "NURS 475", Name = "Care of Infants & Children", SemesterLevel = 4, DefaultType = CourseType.Lecture },
                new Course { Code = "NURS 477", Name = "Infants & Children Lab", SemesterLevel = 4, DefaultType = CourseType.Lab },
                new Course { Code = "NURS 403", Name = "Clinical Competency Lab III", SemesterLevel = 4, DefaultType = CourseType.Clinical },
                new Course { Code = "NURS 485", Name = "Professional Transitions", SemesterLevel = 4, DefaultType = CourseType.Lecture },

                //semester 5 (senior/preceptorship)
                new Course { Code = "NURS 479", Name = "Professional Nurse Role: Manager", SemesterLevel = 5, DefaultType = CourseType.Lecture },
                new Course { Code = "NURS 487", Name = "Advanced Concepts", SemesterLevel = 5, DefaultType = CourseType.Lecture },
                new Course { Code = "NURS 489", Name = "Advanced Concepts Lab", SemesterLevel = 5, DefaultType = CourseType.Lab },
                new Course { Code = "NURS 482", Name = "Promoting Healthy Community", SemesterLevel = 5, DefaultType = CourseType.Lecture },
                new Course { Code = "NURS 488", Name = "Community Lab", SemesterLevel = 5, DefaultType = CourseType.Lab }
            };

            //add to db and save
            await context.Courses.AddRangeAsync(courses);
            await context.SaveChangesAsync();
        }

        //seed known rooms across campuses
        public static async Task SeedRooms(DataContext context)
        {
            if (await context.Rooms.AnyAsync()) return;

            var rooms = new List<Room>
            {
                //hammond campus - khsa building
                new Room { RoomNumber = "1005", Building = "KHSA", Campus = "Hammond", Capacity = 36, Type = RoomType.Lecture },
                new Room { RoomNumber = "1006", Building = "KHSA", Campus = "Hammond", Capacity = 36, Type = RoomType.Lecture },
                new Room { RoomNumber = "2002", Building = "KHSA", Campus = "Hammond", Capacity = 8, Type = RoomType.Lab },
                new Room { RoomNumber = "2007", Building = "KHSA", Campus = "Hammond", Capacity = 8, Type = RoomType.Lab },
                new Room { RoomNumber = "2008", Building = "KHSA", Campus = "Hammond", Capacity = 8, Type = RoomType.SimLab },

                //baton rouge campus
                new Room { RoomNumber = "BRC-258", Building = "Baton Rouge Center", Campus = "Baton Rouge", Capacity = 30, Type = RoomType.Lecture },
                new Room { RoomNumber = "BRC-260", Building = "Baton Rouge Center", Campus = "Baton Rouge", Capacity = 8, Type = RoomType.Lab }
            };

            await context.Rooms.AddRangeAsync(rooms);
            await context.SaveChangesAsync();
        }
    }
}