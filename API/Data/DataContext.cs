using Microsoft.EntityFrameworkCore;
using NursingScheduler.API.Entities;
using System.IO;
using System.Text.RegularExpressions;

namespace NursingScheduler.API.Data
{
    public class DataContext : DbContext
    {
        public DataContext(DbContextOptions options) : base(options)
        {
        }

        //these map the entities to the database tables
        public DbSet<AppUser> Users { get; set; }
        public DbSet<Semester> Semesters { get; set; }
        public DbSet<Course> Courses { get; set; }
        public DbSet<Schedule> Schedules { get; set; }
        public DbSet<Section> Sections { get; set; }
        public DbSet<ScheduleSection> ScheduleSections { get; set; }
        public DbSet<Student> Students { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);
            //if you delete a schedule(bucket), delete the sections in it
            //this configures the many to many bridge table
            //it tells the db "a schedule_section connects a schedule and a section"
            modelBuilder.Entity<ScheduleSection>()
                .HasOne(ss => ss.Schedule)
                .WithMany(s => s.ScheduleSections)
                .HasForeignKey(ss => ss.ScheduleId)
                .OnDelete(DeleteBehavior.Cascade); //if bucket deleted, delete the link
            //if you delete a section(class) do not auto delete the links
            modelBuilder.Entity<ScheduleSection>()
                .HasOne(ss => ss.Section)
                .WithMany(s => s.ScheduleSections)
                .HasForeignKey(ss => ss.SectionId)
                .OnDelete(DeleteBehavior.Restrict); //had to change because of db confusion on deletetion pathway
        }

        //Gets Semester Level from spreadsheet/csv title
        public static class SemesterLevelResolver
        {
            public static int GetSemesterLevel(string filePath)
            {
                string fileName = Path.GetFileName(filePath);

                char firstChar = fileName[0];

                if (!char.IsDigit(firstChar))
                {
                    throw new Exception(
                        "First character of filename must be a digit. File: " + fileName
                    );
                }

                return firstChar - '0';
            }
        }

        //Seeds Courses from spreadsheet/csv
        public static class CourseSeeder
        {
            public static void SeedFromScheduleCsv(AppDbContext context, string csvPath)
            {
                int semesterLevel = SemesterLevelResolver.GetSemesterLevel(csvPath);

                var rows = CourseScheduleCsvReader.Read(csvPath);

                foreach (var row in rows)
                {
                    // Example: N3390-1 or N3390-4X -> N3390
                    string courseCode = row.Course.Split('-')[0];
                    courseCode = courseCode.Replace("X", "").Trim();

                    bool exists = context.Courses.Any(c =>
                        c.Code == courseCode &&
                        c.SemesterLevel == semesterLevel
                    );

                    if (exists)
                        continue;

                    CourseType courseType = CourseType.Lecture;

                    if (!string.IsNullOrWhiteSpace(row.DeliveryFormat))
                    {
                        Enum.TryParse(
                            row.DeliveryFormat,
                            true,
                            out courseType
                        );
                    }

                    Course course = new Course
                    {
                        Code = courseCode,
                        Name = courseCode,
                        SemesterLevel = semesterLevel,
                        DefaultType = courseType
                    };

                    context.Courses.Add(course);
                }

                context.SaveChanges();
            }
        }


    }
}