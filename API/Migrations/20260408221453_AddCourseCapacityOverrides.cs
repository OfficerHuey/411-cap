using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace API.Migrations
{
    /// <inheritdoc />
    public partial class AddCourseCapacityOverrides : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "DefaultLabCapacity",
                table: "Courses",
                type: "int",
                nullable: false,
                defaultValue: 8);

            migrationBuilder.AddColumn<int>(
                name: "DefaultLectureCapacity",
                table: "Courses",
                type: "int",
                nullable: false,
                defaultValue: 35);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DefaultLabCapacity",
                table: "Courses");

            migrationBuilder.DropColumn(
                name: "DefaultLectureCapacity",
                table: "Courses");
        }
    }
}
