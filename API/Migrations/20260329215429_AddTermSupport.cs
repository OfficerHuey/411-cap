using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace API.Migrations
{
    /// <inheritdoc />
    public partial class AddTermSupport : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "Term",
                table: "Sections",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "TermEndDate",
                table: "Sections",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "TermStartDate",
                table: "Sections",
                type: "datetime2",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Term",
                table: "Sections");

            migrationBuilder.DropColumn(
                name: "TermEndDate",
                table: "Sections");

            migrationBuilder.DropColumn(
                name: "TermStartDate",
                table: "Sections");
        }
    }
}
