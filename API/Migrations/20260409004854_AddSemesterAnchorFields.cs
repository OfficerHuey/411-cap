using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace API.Migrations
{
    /// <inheritdoc />
    public partial class AddSemesterAnchorFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "AnchorRotation",
                table: "Semesters",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsAnchorTemplate",
                table: "Semesters",
                type: "bit",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AnchorRotation",
                table: "Semesters");

            migrationBuilder.DropColumn(
                name: "IsAnchorTemplate",
                table: "Semesters");
        }
    }
}
