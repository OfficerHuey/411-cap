namespace NursingScheduler.API.DTOs.Student
{
    public class StudentDto
    {
        //display object for the list of students
        public int Id { get; set; }
        public required string Name { get; set; }
        public required string WNumber { get; set; }
        public required string Email { get; set; }
    }
}