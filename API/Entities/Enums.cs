namespace NursingScheduler.API.Entities
{
    //defines the types of classes available in the palette
    //it's used by course default type and section views
    public enum CourseType
    {
        Lecture,
        Lab,
        Clinical
    }

    //semester 4 courses split into term 1 and term 2
    public enum TermType
    {
        Full,
        Term1,
        Term2
    }

    //instructor employment classification
    public enum InstructorType
    {
        FullTime,
        Adjunct,
        Overload
    }

    //categorizes rooms by their function
    public enum RoomType
    {
        Lecture,
        Lab,
        SimLab,
        Clinical,
        Online
    }

    //the days of the week for the weekly grid
    //used by the day of the week section
    public enum DayOfWeekEnum
    {
        Monday,
        Tuesday,
        Wednesday,
        Thursday,
        Friday
    }
}