using Microsoft.EntityFrameworkCore;
using NursingScheduler.API.Entities;

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
    }
}