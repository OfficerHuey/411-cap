using Microsoft.EntityFrameworkCore;
using NursingScheduler.API.Entities;
using System.Security.Cryptography;
using System.Text;

namespace NursingScheduler.API.Data
{
    public static class SeedSampleData
    {
        private const string DemoSemesterName = "Spring 2026 Demo";

        public static async Task Seed(DataContext context)
        {
            //seed demo user accounts
            await SeedDemoAccounts(context);

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

            //seed additional demo data for feature coverage
            await SeedDemoExtras(context, semester, scheduleGroups, sectionsByLevel, courses);
        }

        private static async Task SeedDemoExtras(
            DataContext context,
            Semester activeSemester,
            List<Schedule> scheduleGroups,
            Dictionary<int, List<Section>> sectionsByLevel,
            List<Course> courses)
        {
            await SeedArchiveSemester(context, courses);
            await AdjustGroupToHospitalCapacity(context, scheduleGroups, courses);
            await SeedInstructorsAndAssignments(context, activeSemester, sectionsByLevel);
            await SeedSampleNotes(context, scheduleGroups);
            await SeedSampleChangeLog(context, activeSemester, scheduleGroups);
        }

        //locked semester for the archive page
        private static async Task SeedArchiveSemester(DataContext context, List<Course> courses)
        {
            if (await context.Semesters.AnyAsync(s => s.Name == "Fall 2024 Archive"))
                return;

            var archive = new Semester
            {
                Name = "Fall 2024 Archive",
                StartDate = new DateTime(2024, 8, 19),
                EndDate = new DateTime(2024, 12, 13),
                ClinicalDays = "Tues/Wed",
                IsLocked = true,
                IsAnchorTemplate = false
            };
            context.Semesters.Add(archive);
            await context.SaveChangesAsync();

            //create 3 schedule groups with a few sections
            var labels = new[] { "A", "B", "C" };
            var archiveSchedules = new List<Schedule>();
            for (int g = 0; g < 3; g++)
            {
                var schedule = new Schedule
                {
                    Name = $"Schedule {labels[g]}",
                    SemesterLevel = 1,
                    LocationDisplay = g < 2 ? "Hammond" : "Baton Rouge",
                    SemesterId = archive.Id,
                    Capacity = 8,
                    SortOrder = g
                };
                context.Schedules.Add(schedule);
                archiveSchedules.Add(schedule);
            }
            await context.SaveChangesAsync();

            //add a couple of lecture sections
            var archiveCourse = courses.FirstOrDefault(c => c.SemesterLevel == 1 && c.DefaultType == CourseType.Lecture);
            if (archiveCourse != null)
            {
                var section = new Section
                {
                    SectionNumber = "01",
                    DayOfWeek = DayOfWeekEnum.Monday,
                    StartTime = new TimeSpan(8, 0, 0),
                    EndTime = new TimeSpan(9, 50, 0),
                    CourseId = archiveCourse.Id,
                    SemesterId = archive.Id
                };
                context.Sections.Add(section);
                await context.SaveChangesAsync();

                foreach (var schedule in archiveSchedules)
                {
                    context.ScheduleSections.Add(new ScheduleSection
                    {
                        ScheduleId = schedule.Id,
                        SectionId = section.Id
                    });
                }
                await context.SaveChangesAsync();
            }

            Console.WriteLine("  Seeded: Fall 2024 Archive (locked, 3 schedule groups)");
        }

        //adjust a hospital lab schedule group to 12-capacity
        private static async Task AdjustGroupToHospitalCapacity(
            DataContext context,
            List<Schedule> scheduleGroups,
            List<Course> courses)
        {
            //find a schedule linked to a hospital-based lab course at semester level 2
            var hospitalLabCourses = courses
                .Where(c => c.DefaultType == CourseType.Lab &&
                       (c.Code is "NL3730" or "NL4730" or "NL4770" or "NL4880" or "NL4890"))
                .Select(c => c.Id)
                .ToHashSet();

            //pick a level 2 or 4 schedule group
            var target = scheduleGroups.FirstOrDefault(s => s.SemesterLevel == 2 && s.Capacity != 12);
            if (target == null)
                target = scheduleGroups.FirstOrDefault(s => s.SemesterLevel == 4 && s.Capacity != 12);

            if (target != null && target.Capacity != 12)
            {
                target.Capacity = 12;
                await context.SaveChangesAsync();
                Console.WriteLine($"  Seeded: Schedule '{target.Name}' (Sem {target.SemesterLevel}) capacity set to 12 for hospital lab demo");
            }
        }

        //sample instructors with section assignments and workload
        private static async Task SeedInstructorsAndAssignments(
            DataContext context,
            Semester activeSemester,
            Dictionary<int, List<Section>> sectionsByLevel)
        {
            if (await context.Instructors.AnyAsync())
                return;

            var instructors = new[]
            {
                new Instructor { Name = "Dr. Emily Carter", Email = "ecarter@selu.edu", Type = InstructorType.FullTime, Phone = "(985) 549-2100" },
                new Instructor { Name = "Prof. Michael Reed", Email = "mreed@selu.edu", Type = InstructorType.Adjunct, Phone = "(985) 549-2200" },
                new Instructor { Name = "Dr. Sarah Thompson", Email = "sthompson@selu.edu", Type = InstructorType.FullTime },
                new Instructor { Name = "Prof. James Okafor", Email = "jokafor@selu.edu", Type = InstructorType.Overload },
                new Instructor { Name = "Dr. Lisa Nguyen", Email = "lnguyen@selu.edu", Type = InstructorType.FullTime, Phone = "(985) 549-3000" }
            };

            context.Instructors.AddRange(instructors);
            await context.SaveChangesAsync();

            //assign instructors to sections across levels
            var assignmentCount = 0;
            var instructorIdx = 0;

            foreach (var kvp in sectionsByLevel)
            {
                var sections = kvp.Value;
                //assign first 2-3 sections per level
                var toAssign = sections.Take(3).ToList();
                foreach (var section in toAssign)
                {
                    var inst = instructors[instructorIdx % instructors.Length];

                    //use SectionInstructor join table
                    var si = new SectionInstructor
                    {
                        SectionId = section.Id,
                        InstructorId = inst.Id
                    };
                    context.SectionInstructors.Add(si);
                    assignmentCount++;
                    instructorIdx++;
                }
            }

            //add one workload override to demo the override feature
            var overrideSection = sectionsByLevel.Values.SelectMany(s => s).FirstOrDefault();
            if (overrideSection != null)
            {
                var existingSi = await context.SectionInstructors
                    .FirstOrDefaultAsync(si => si.SectionId == overrideSection.Id);
                if (existingSi != null)
                {
                    existingSi.WorkloadOverride = 4.5m;
                    existingSi.WorkloadOverrideReason = "Coordinator release time — adjusted credit load for program coordination duties";
                }
            }

            await context.SaveChangesAsync();
            Console.WriteLine($"  Seeded: {instructors.Length} instructors with {assignmentCount} section assignments (1 workload override)");
        }

        //sample notes for the notes feature
        private static async Task SeedSampleNotes(DataContext context, List<Schedule> scheduleGroups)
        {
            if (await context.Notes.AnyAsync())
                return;

            var admin = await context.Users.FirstOrDefaultAsync(u => u.UserName == "admin@selu.edu");
            if (admin == null) return;

            var sched1 = scheduleGroups.FirstOrDefault(s => s.SemesterLevel == 1);
            var sched4 = scheduleGroups.FirstOrDefault(s => s.SemesterLevel == 4);

            if (sched1 != null)
            {
                context.Notes.Add(new Note
                {
                    Title = "Room 2007 schedule note",
                    Body = "Remember to coordinate with Dr. Williams for the sim lab time. Friday afternoons preferred.",
                    AuthorId = admin.Id,
                    ScheduleId = sched1.Id,
                    CreatedAt = DateTime.UtcNow.AddDays(-3)
                });
            }

            if (sched4 != null)
            {
                context.Notes.Add(new Note
                {
                    Title = "N4710 Term 1 planning",
                    Body = "Check with facility coordinator about OB rotation start date.",
                    AuthorId = admin.Id,
                    ScheduleId = sched4.Id,
                    CreatedAt = DateTime.UtcNow.AddDays(-1)
                });
            }

            context.Notes.Add(new Note
            {
                Title = "Import checklist",
                Body = "Verify all W# numbers match registrar records before final import. Check for duplicates across semesters.",
                AuthorId = admin.Id,
                SemesterId = scheduleGroups.FirstOrDefault()?.SemesterId,
                CreatedAt = DateTime.UtcNow.AddDays(-5),
                IsDone = true
            });

            await context.SaveChangesAsync();
            Console.WriteLine("  Seeded: 3 sample notes");
        }

        //sample changelog entries so the audit page isn't empty
        private static async Task SeedSampleChangeLog(
            DataContext context,
            Semester activeSemester,
            List<Schedule> scheduleGroups)
        {
            if (await context.ChangeLogs.AnyAsync())
                return;

            var entries = new[]
            {
                new ChangeLog
                {
                    EntityType = "Schedule",
                    EntityId = scheduleGroups.FirstOrDefault(s => s.SemesterLevel == 1)?.Id ?? 1,
                    Action = "Created",
                    Changes = "Created schedule Schedule A — Semester 1",
                    PerformedBy = "admin@selu.edu",
                    SemesterId = activeSemester.Id,
                    Timestamp = DateTime.UtcNow.AddDays(-6)
                },
                new ChangeLog
                {
                    EntityType = "Section",
                    EntityId = 1,
                    Action = "Updated",
                    Changes = "Updated section N3390-01 room assignment to KHSA 1005",
                    PerformedBy = "admin@selu.edu",
                    SemesterId = activeSemester.Id,
                    Timestamp = DateTime.UtcNow.AddDays(-5)
                },
                new ChangeLog
                {
                    EntityType = "Student",
                    EntityId = 0,
                    Action = "BulkImport",
                    Changes = "Imported 160 students via mass enrollment template",
                    PerformedBy = "admin@selu.edu",
                    SemesterId = activeSemester.Id,
                    Timestamp = DateTime.UtcNow.AddDays(-4)
                },
                new ChangeLog
                {
                    EntityType = "Schedule",
                    EntityId = scheduleGroups.FirstOrDefault(s => s.SemesterLevel == 3)?.Id ?? 3,
                    Action = "Updated",
                    Changes = "Assigned instructor Dr. Emily Carter to N3530 lecture section",
                    PerformedBy = "admin@selu.edu",
                    SemesterId = activeSemester.Id,
                    Timestamp = DateTime.UtcNow.AddDays(-3)
                },
                new ChangeLog
                {
                    EntityType = "Student",
                    EntityId = 5,
                    Action = "Deleted",
                    Changes = "Removed student from Schedule C — transferred to different cohort",
                    PerformedBy = "admin@selu.edu",
                    SemesterId = activeSemester.Id,
                    Timestamp = DateTime.UtcNow.AddDays(-2)
                },
                new ChangeLog
                {
                    EntityType = "Section",
                    EntityId = 2,
                    Action = "Created",
                    Changes = "Created new lab section NL3730-02 for Baton Rouge group",
                    PerformedBy = "admin@selu.edu",
                    SemesterId = activeSemester.Id,
                    Timestamp = DateTime.UtcNow.AddDays(-1)
                },
                new ChangeLog
                {
                    EntityType = "Semester",
                    EntityId = activeSemester.Id,
                    Action = "Updated",
                    Changes = "Updated clinical days to Tues/Wed for Spring 2026 Demo",
                    PerformedBy = "admin@selu.edu",
                    SemesterId = activeSemester.Id,
                    Timestamp = DateTime.UtcNow.AddHours(-6)
                }
            };

            context.ChangeLogs.AddRange(entries);
            await context.SaveChangesAsync();
            Console.WriteLine($"  Seeded: {entries.Length} changelog entries");
        }

        private static async Task SeedDemoAccounts(DataContext context)
        {
            //admin demo account
            if (!await context.Users.AnyAsync(u => u.UserName == "admin@selu.edu"))
            {
                using var hmac = new HMACSHA512();
                context.Users.Add(new AppUser
                {
                    UserName = "admin@selu.edu",
                    PasswordHash = hmac.ComputeHash(Encoding.UTF8.GetBytes("DemoAdmin2026!")),
                    PasswordSalt = hmac.Key,
                    Role = "Admin",
                    DisplayName = "Demo Admin"
                });
            }

            //viewer demo account
            if (!await context.Users.AnyAsync(u => u.UserName == "viewer@selu.edu"))
            {
                using var hmac = new HMACSHA512();
                context.Users.Add(new AppUser
                {
                    UserName = "viewer@selu.edu",
                    PasswordHash = hmac.ComputeHash(Encoding.UTF8.GetBytes("DemoViewer2026!")),
                    PasswordSalt = hmac.Key,
                    Role = "Viewer",
                    DisplayName = "Demo Viewer"
                });
            }

            await context.SaveChangesAsync();
        }
    }
}
