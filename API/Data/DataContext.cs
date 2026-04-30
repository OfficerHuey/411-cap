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
        public DbSet<Room> Rooms { get; set; }
        public DbSet<Instructor> Instructors { get; set; }
        public DbSet<ChangeLog> ChangeLogs { get; set; }
        public DbSet<SectionInstructor> SectionInstructors { get; set; }
        public DbSet<Note> Notes { get; set; }
        public DbSet<PasswordResetToken> PasswordResetTokens { get; set; }
        public DbSet<AppFile> AppFiles { get; set; }
        public DbSet<Conversation> Conversations { get; set; }
        public DbSet<ConversationParticipant> ConversationParticipants { get; set; }
        public DbSet<Message> Messages { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            //app-files — admin-managed file catalog
            modelBuilder.Entity<AppFile>(b =>
            {
                b.Property(f => f.FileName).HasMaxLength(255).IsRequired();
                b.Property(f => f.OriginalFileName).HasMaxLength(255).IsRequired();
                b.Property(f => f.ContentType).HasMaxLength(255).IsRequired();
                b.Property(f => f.StoragePath).HasMaxLength(500).IsRequired();
                b.Property(f => f.Title).HasMaxLength(255);
                b.Property(f => f.Description).HasMaxLength(1000);

                b.HasIndex(f => f.UploadedByUserId);
                b.HasIndex(f => f.IsDeleted);

                b.HasOne(f => f.UploadedBy)
                    .WithMany()
                    .HasForeignKey(f => f.UploadedByUserId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            //conversations + participants + messages — polling-based messaging
            modelBuilder.Entity<Conversation>(b =>
            {
                b.Property(c => c.Title).HasMaxLength(200);
                b.HasIndex(c => c.LastMessageAt);
            });

            modelBuilder.Entity<ConversationParticipant>(b =>
            {
                //each user appears at most once per conversation
                b.HasIndex(p => new { p.ConversationId, p.UserId }).IsUnique();

                b.HasOne(p => p.Conversation)
                    .WithMany(c => c.Participants)
                    .HasForeignKey(p => p.ConversationId)
                    .OnDelete(DeleteBehavior.Cascade);

                //restrict — don't let a user row deletion wipe out their
                //entire message history from other users' threads
                b.HasOne(p => p.User)
                    .WithMany()
                    .HasForeignKey(p => p.UserId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            modelBuilder.Entity<Message>(b =>
            {
                b.Property(m => m.Content).HasMaxLength(4000).IsRequired();
                //composite index powers the "messages in this conversation by
                //time" query that drives the thread paginator
                b.HasIndex(m => new { m.ConversationId, m.SentAt });

                b.HasOne(m => m.Conversation)
                    .WithMany(c => c.Messages)
                    .HasForeignKey(m => m.ConversationId)
                    .OnDelete(DeleteBehavior.Cascade);

                b.HasOne(m => m.Sender)
                    .WithMany()
                    .HasForeignKey(m => m.SenderId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            //set default capacity to 8 for lab groups
            modelBuilder.Entity<Schedule>()
                .Property(s => s.Capacity)
                .HasDefaultValue(8);

            //decimal precision for workload override
            modelBuilder.Entity<SectionInstructor>()
                .Property(si => si.WorkloadOverride)
                .HasPrecision(5, 2);

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

            //notes — schedule cascade, semester/section use NoAction to avoid cycle
            modelBuilder.Entity<Note>()
                .HasOne(n => n.Semester)
                .WithMany()
                .HasForeignKey(n => n.SemesterId)
                .OnDelete(DeleteBehavior.NoAction);

            modelBuilder.Entity<Note>()
                .HasOne(n => n.Schedule)
                .WithMany()
                .HasForeignKey(n => n.ScheduleId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Note>()
                .HasOne(n => n.Section)
                .WithMany()
                .HasForeignKey(n => n.SectionId)
                .OnDelete(DeleteBehavior.NoAction);

            modelBuilder.Entity<Note>()
                .HasOne(n => n.Author)
                .WithMany()
                .HasForeignKey(n => n.AuthorId)
                .OnDelete(DeleteBehavior.Restrict);
        }
    }
}