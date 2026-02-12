using Microsoft.EntityFrameworkCore;
using NursingScheduler.API.Entities;

namespace NursingScheduler.API.Data
{
    //this class manages the connection to the database
    public class DataContext : DbContext
    {
        public DataContext(DbContextOptions options) : base(options)
        {
        }

        //these properties create the tables in the database
        public DbSet<AppUser> Users { get; set; }
        public DbSet<Semester> Semesters { get; set; }
        public DbSet<Course> Courses { get; set; }
        public DbSet<Schedule> Schedules { get; set; }
        public DbSet<Section> Sections { get; set; }
        public DbSet<ScheduleSection> ScheduleSections { get; set; }
        public DbSet<Student> Students { get; set; }

        //this method handles the relationships and rules
        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            //relationship: one schedule has many students
            //if a schedule is deleted, delete all students inside it
            modelBuilder.Entity<Student>()
                .HasOne(s => s.Schedule)
                .WithMany(sc => sc.Students)
                .HasForeignKey(s => s.ScheduleId)
                .OnDelete(DeleteBehavior.Cascade);

            //relationship: the bridge table (schedule_section)
            //this allows the many to many link between buckets and classes
            modelBuilder.Entity<ScheduleSection>()
                .HasOne(ss => ss.Schedule)
                .WithMany(s => s.ScheduleSections)
                .HasForeignKey(ss => ss.ScheduleId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<ScheduleSection>()
                .HasOne(ss => ss.Section)
                .WithMany(s => s.ScheduleSections)
                .HasForeignKey(ss => ss.SectionId)
                .OnDelete(DeleteBehavior.Cascade);

            //prevents duplicate links between the same schedule and section
            modelBuilder.Entity<ScheduleSection>()
                .HasIndex(ss => new { ss.ScheduleId, ss.SectionId })
                .IsUnique();

            //relationship: course to section
            //if a course is deleted from palette, don;t delete sections
            //safer to keep history
            modelBuilder.Entity<Section>()
                .HasOne(s => s.Course)
                .WithMany(c => c.Sections)
                .HasForeignKey(s => s.CourseId)
                .OnDelete(DeleteBehavior.Restrict);

            

        }
    }
}