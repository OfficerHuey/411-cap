namespace NursingScheduler.API.DTOs.Import
{
    //parsed room record from the import template
    public class ImportedRoomDto
    {
        public string Number { get; set; } = "";
        public string Building { get; set; } = "";
        public string Campus { get; set; } = "";
        public int Capacity { get; set; }
        public string Type { get; set; } = "";
        public string? ValidationError { get; set; }
        public int RowNumber { get; set; }
    }

    //full import preview returned before committing
    public class RoomImportResultDto
    {
        public int TotalParsed { get; set; }
        public List<ImportedRoomDto> Valid { get; set; } = new();
        public List<ImportRowError> Errors { get; set; } = new();
    }

    //data sent when committing room import
    public class CommitRoomDto
    {
        public required string Number { get; set; }
        public required string Building { get; set; }
        public required string Campus { get; set; }
        public int Capacity { get; set; }
        public required string Type { get; set; }
    }
}
