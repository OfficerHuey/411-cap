namespace NursingScheduler.API.Constants
{
    public static class SemesterLevelConfig
    {
        //cluster ratio: how many labs roll up to one lecture section
        //semesters 1-3 use 1:4 (one lecture, four labs)
        //semester 4 uses 1:5 because of smaller faculty ratios at higher levels
        //semester 5 is preceptorship-based and doesn't use the cluster pattern
        public static int LabsPerLecture(int semesterLevel) => semesterLevel switch
        {
            1 => 4,
            2 => 4,
            3 => 4,
            4 => 5,
            5 => 1,
            _ => 4
        };
    }
}
