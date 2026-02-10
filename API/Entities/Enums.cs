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