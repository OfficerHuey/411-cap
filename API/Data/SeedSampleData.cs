using Microsoft.EntityFrameworkCore;
using NursingScheduler.API.Entities;

namespace NursingScheduler.API.Data
{
    public static class SeedSampleData
    {
        private const string DemoSemesterName = "Spring 2026 Demo";

        public static async Task Seed(DataContext context)
        {
            //idempotent: skip if demo semester already exists
            if (await context.Semesters.AnyAsync(s => s.Name == DemoSemesterName))
                return;

            var courses = await context.Courses.ToListAsync();
            var rooms = await context.Rooms.Where(r => !r.IsRequestOnly).ToListAsync();

            if (courses.Count == 0)
            {
                Console.WriteLine("WARNING: No courses found, skipping sample data seeding");
                return;
            }

            //create the demo semester
            var semester = new Semester
            {
                Name = DemoSemesterName,
                StartDate = new DateTime(2026, 1, 12),
                EndDate = new DateTime(2026, 5, 15),
                ClinicalDays = "Tues/Wed",
                IsAnchorTemplate = true,
                AnchorRotation = ClinicalDayRotation.TuesWed
            };
            context.Semesters.Add(semester);
            await context.SaveChangesAsync();

            //also create a thurs/fri anchor semester (empty shell for the dual-anchor demo)
            var anchorTF = new Semester
            {
                Name = "Fall 2025 Anchor",
                StartDate = new DateTime(2025, 8, 18),
                EndDate = new DateTime(2025, 12, 12),
                ClinicalDays = "Thurs/Fri",
                IsAnchorTemplate = true,
                AnchorRotation = ClinicalDayRotation.ThursFri
            };
            context.Semesters.Add(anchorTF);
            await context.SaveChangesAsync();

            //find lecture rooms for section assignments
            var hammondLecture = rooms.FirstOrDefault(r => r.RoomNumber == "1005");
            var hammondLab = rooms.FirstOrDefault(r => r.RoomNumber == "2007");
            var brcLecture = rooms.FirstOrDefault(r => r.RoomNumber == "BRC-258");

            //create 4 schedule groups per level (20 total)
            var scheduleGroups = new List<Schedule>();
            var labels = new[] { "A", "B", "C", "D" };
            for (int level = 1; level <= 5; level++)
            {
                for (int g = 0; g < 4; g++)
                {
                    var campus = g < 2 ? "Hammond" : "Baton Rouge";
                    var schedule = new Schedule
                    {
                        Name = $"Schedule {labels[g]}",
                        SemesterLevel = level,
                        LocationDisplay = campus,
                        SemesterId = semester.Id,
                        Capacity = 8,
                        SortOrder = g
                    };
                    context.Schedules.Add(schedule);
                    scheduleGroups.Add(schedule);
                }
            }
            await context.SaveChangesAsync();

            //create sections for each course and link to schedule groups at the matching level
            var levelCourses = courses.GroupBy(c => c.SemesterLevel).ToDictionary(g => g.Key, g => g.ToList());
            var sectionsByLevel = new Dictionary<int, List<Section>>();

            //time slots for realistic scheduling
            var lectureTimes = new (DayOfWeekEnum day, TimeSpan start, TimeSpan end)[]
            {
                (DayOfWeekEnum.Monday, new TimeSpan(8, 0, 0), new TimeSpan(9, 50, 0)),
                (DayOfWeekEnum.Monday, new TimeSpan(10, 0, 0), new TimeSpan(11, 50, 0)),
                (DayOfWeekEnum.Monday, new TimeSpan(13, 0, 0), new TimeSpan(14, 50, 0)),
                (DayOfWeekEnum.Wednesday, new TimeSpan(8, 0, 0), new TimeSpan(9, 50, 0)),
                (DayOfWeekEnum.Wednesday, new TimeSpan(10, 0, 0), new TimeSpan(11, 50, 0)),
                (DayOfWeekEnum.Thursday, new TimeSpan(8, 0, 0), new TimeSpan(9, 50, 0)),
                (DayOfWeekEnum.Thursday, new TimeSpan(10, 0, 0), new TimeSpan(11, 50, 0)),
                (DayOfWeekEnum.Friday, new TimeSpan(8, 0, 0), new TimeSpan(9, 50, 0)),
                (DayOfWeekEnum.Friday, new TimeSpan(10, 0, 0), new TimeSpan(11, 50, 0)),
                (DayOfWeekEnum.Friday, new TimeSpan(13, 0, 0), new TimeSpan(14, 50, 0))
            };

            var labTimes = new (DayOfWeekEnum day, TimeSpan start, TimeSpan end)[]
            {
                (DayOfWeekEnum.Tuesday, new TimeSpan(8, 0, 0), new TimeSpan(10, 50, 0)),
                (DayOfWeekEnum.Tuesday, new TimeSpan(11, 0, 0), new TimeSpan(13, 50, 0)),
                (DayOfWeekEnum.Wednesday, new TimeSpan(8, 0, 0), new TimeSpan(10, 50, 0)),
                (DayOfWeekEnum.Wednesday, new TimeSpan(13, 0, 0), new TimeSpan(15, 50, 0)),
                (DayOfWeekEnum.Thursday, new TimeSpan(13, 0, 0), new TimeSpan(15, 50, 0))
            };

            for (int level = 1; level <= 5; level++)
            {
                if (!levelCourses.ContainsKey(level)) continue;

                var sections = new List<Section>();
                int lectureIdx = 0;
                int labIdx = 0;

                foreach (var course in levelCourses[level])
                {
                    //semester 5 preceptorship courses use date ranges instead of weekly times
                    if (level == 5 && course.DefaultType == CourseType.Clinical)
                    {
                        var section = new Section
                        {
                            SectionNumber = "01",
                            DateRange = "Jan 13 - May 9",
                            CourseId = course.Id,
                            SemesterId = semester.Id,
                            RoomId = null
                        };
                        context.Sections.Add(section);
                        sections.Add(section);
                        continue;
                    }

                    //set term for semester 4 courses
                    TermType? term = null;
                    if (level == 4)
                    {
                        if (course.Code is "N4710" or "NL4730") term = TermType.Term1;
                        else if (course.Code is "N4750" or "NL4770") term = TermType.Term2;
                    }

                    if (course.DefaultType == CourseType.Lecture)
                    {
                        var slot = lectureTimes[lectureIdx % lectureTimes.Length];
                        lectureIdx++;
                        var section = new Section
                        {
                            SectionNumber = "01",
                            DayOfWeek = slot.day,
                            StartTime = slot.start,
                            EndTime = slot.end,
                            CourseId = course.Id,
                            SemesterId = semester.Id,
                            RoomId = hammondLecture?.Id,
                            Term = term
                        };
                        context.Sections.Add(section);
                        sections.Add(section);
                    }
                    else
                    {
                        //create one lab/clinical section per schedule group at this level
                        for (int g = 0; g < 4; g++)
                        {
                            var slot = labTimes[(labIdx + g) % labTimes.Length];
                            var section = new Section
                            {
                                SectionNumber = (g + 1).ToString(),
                                DayOfWeek = slot.day,
                                StartTime = slot.start,
                                EndTime = slot.end,
                                CourseId = course.Id,
                                SemesterId = semester.Id,
                                RoomId = course.DefaultType == CourseType.Lab ? hammondLab?.Id : null,
                                Term = term
                            };
                            context.Sections.Add(section);
                            sections.Add(section);
                        }
                        labIdx++;
                    }
                }
                await context.SaveChangesAsync();
                sectionsByLevel[level] = sections;
            }

            //link sections to schedule groups
            for (int level = 1; level <= 5; level++)
            {
                if (!sectionsByLevel.ContainsKey(level)) continue;

                var levelSchedules = scheduleGroups.Where(s => s.SemesterLevel == level).ToList();
                var sections = sectionsByLevel[level];

                foreach (var schedule in levelSchedules)
                {
                    foreach (var section in sections)
                    {
                        //lectures are shared across all groups; lab/clinical sections link to their matching group
                        var course = courses.First(c => c.Id == section.CourseId);
                        if (course.DefaultType == CourseType.Lecture)
                        {
                            //all groups share the lecture
                            context.ScheduleSections.Add(new ScheduleSection
                            {
                                ScheduleId = schedule.Id,
                                SectionId = section.Id
                            });
                        }
                        else
                        {
                            //lab/clinical sections: link section N to schedule N
                            var groupIndex = levelSchedules.IndexOf(schedule);
                            if (int.TryParse(section.SectionNumber, out var secNum) && secNum == groupIndex + 1)
                            {
                                context.ScheduleSections.Add(new ScheduleSection
                                {
                                    ScheduleId = schedule.Id,
                                    SectionId = section.Id
                                });
                            }
                            //preceptorship sections (no number) link to all groups
                            else if (section.DateRange != null)
                            {
                                context.ScheduleSections.Add(new ScheduleSection
                                {
                                    ScheduleId = schedule.Id,
                                    SectionId = section.Id
                                });
                            }
                        }
                    }
                }
            }
            await context.SaveChangesAsync();

            //seed fake students across schedule groups
            var firstNames = new[] { "Emma", "Olivia", "Ava", "Isabella", "Sophia", "Mia", "Charlotte", "Amelia",
                "Harper", "Evelyn", "Abigail", "Emily", "Elizabeth", "Sofia", "Ella", "Madison",
                "Scarlett", "Victoria", "Aria", "Grace", "Chloe", "Camila", "Penelope", "Riley",
                "Layla", "Lillian", "Nora", "Zoey", "Mila", "Aubrey", "Hannah", "Lily",
                "Addison", "Eleanor", "Natalie", "Luna", "Savannah", "Brooklyn", "Leah", "Zoe" };

            var lastNames = new[] { "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis",
                "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas",
                "Taylor", "Moore", "Jackson", "Martin", "Lee", "Perez", "Thompson", "White",
                "Harris", "Sanchez", "Clark", "Ramirez", "Lewis", "Robinson", "Walker", "Young" };

            int wNum = 1000001;
            for (int i = 0; i < scheduleGroups.Count; i++)
            {
                var schedule = scheduleGroups[i];
                //8 students per group normally; put 9 in one group to demo the soft cap warning
                var count = (i == 0) ? 9 : 8;

                for (int s = 0; s < count; s++)
                {
                    var first = firstNames[(wNum - 1000001) % firstNames.Length];
                    var last = lastNames[((wNum - 1000001) / firstNames.Length) % lastNames.Length];
                    var student = new Student
                    {
                        Name = $"{first} {last}",
                        WNumber = $"W{wNum:D7}",
                        Email = $"{first.ToLower()}.{last.ToLower()}@selu.edu",
                        ScheduleId = schedule.Id
                    };
                    context.Students.Add(student);
                    wNum++;
                }
            }
            await context.SaveChangesAsync();

            //create one intentional room conflict for demo purposes
            //put two sections in the same room at the same time on the same day
            if (hammondLecture != null && sectionsByLevel.ContainsKey(1) && sectionsByLevel.ContainsKey(2))
            {
                var conflictSection = new Section
                {
                    SectionNumber = "99",
                    DayOfWeek = DayOfWeekEnum.Monday,
                    StartTime = new TimeSpan(8, 0, 0),
                    EndTime = new TimeSpan(9, 50, 0),
                    Notes = "DEMO CONFLICT - intentional room double-booking",
                    CourseId = courses.First(c => c.SemesterLevel == 2 && c.DefaultType == CourseType.Lecture).Id,
                    SemesterId = semester.Id,
                    RoomId = hammondLecture.Id
                };
                context.Sections.Add(conflictSection);
                await context.SaveChangesAsync();

                //link the conflict section to the first level 2 schedule
                var level2Schedule = scheduleGroups.First(s => s.SemesterLevel == 2);
                context.ScheduleSections.Add(new ScheduleSection
                {
                    ScheduleId = level2Schedule.Id,
                    SectionId = conflictSection.Id
                });
                await context.SaveChangesAsync();
            }

            Console.WriteLine($"Sample data seeded: {DemoSemesterName} with {scheduleGroups.Count} schedule groups and {wNum - 1000001} students");
        }
    }
}
