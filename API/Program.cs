using NursingScheduler.API.Data;
using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using NursingScheduler.API.Interfaces;
using NursingScheduler.API.Services;

//disable default jwt claim type mapping so claims like "nameid" and "role"
//stay as their raw names instead of being rewritten to long xml-schema urls
System.IdentityModel.Tokens.Jwt.JwtSecurityTokenHandler.DefaultInboundClaimTypeMap.Clear();

var builder = WebApplication.CreateBuilder(args);

//database connection
builder.Services.AddDbContext<DataContext>(options =>
{
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection"));
});

//jwt service
builder.Services.AddScoped<ITokenService, TokenService>();

//conflict detection engine
builder.Services.AddScoped<IConflictService, ConflictService>();

//audit trail service
builder.Services.AddScoped<IAuditService, AuditService>();

//email service (console logger for dev, swap to smtp for prod)
builder.Services.AddScoped<IEmailService, ConsoleEmailService>();

//file storage options — bound from appsettings "FileStorage" section
builder.Services.Configure<FileStorageOptions>(
    builder.Configuration.GetSection(FileStorageOptions.SectionName));

//raise multipart body limit to match configured MaxFileSizeMB so uploads
//larger than Kestrel's ~30MB default can succeed up to the app's cap
var fileStorageMax = builder.Configuration
    .GetSection(FileStorageOptions.SectionName)
    .Get<FileStorageOptions>()?.MaxFileSizeBytes ?? 50L * 1024 * 1024;
builder.Services.Configure<Microsoft.AspNetCore.Http.Features.FormOptions>(o =>
{
    o.MultipartBodyLengthLimit = fileStorageMax;
});
builder.WebHost.ConfigureKestrel(o =>
{
    o.Limits.MaxRequestBodySize = fileStorageMax;
});

//cors policy, now allows react frontend
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp", policy =>
    {
        policy.WithOrigins("http://localhost:5173", "http://localhost:5180")
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

//auth services
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(builder.Configuration["TokenKey"]!)),
            ValidateIssuer = false,
            ValidateAudience = false
        };
    });

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(
            new System.Text.Json.Serialization.JsonStringEnumConverter());
    });
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

//middleware pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

//app.UseHttpsRedirection();
app.UseStaticFiles(); //serve static files from the web folder
app.UseRouting();

app.UseCors("AllowReactApp");
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

//spa fallback for production builds
app.MapFallbackToFile("/index.html");

//auto migration & seeding
using var scope = app.Services.CreateScope();
var services = scope.ServiceProvider;
try
{
    var context = services.GetRequiredService<DataContext>();
    await context.Database.MigrateAsync();
    await Seed.SeedCourses(context);
    await Seed.SeedRooms(context);

    //only seed sample data in non-production environments
    if (!app.Environment.IsProduction())
    {
        await SeedSampleData.Seed(context);
    }
}
catch (Exception ex)
{
    var logger = services.GetRequiredService<ILogger<Program>>();
    logger.LogError(ex, "Fatal error during migration or seeding");

    if (app.Environment.IsDevelopment())
    {
        //in development, migration failures are always fatal so bugs surface immediately
        Console.Error.WriteLine("\n============================================");
        Console.Error.WriteLine("MIGRATION OR SEEDING FAILED — TERMINATING");
        Console.Error.WriteLine("============================================");
        Console.Error.WriteLine(ex.ToString());
        Console.Error.WriteLine("============================================\n");
        Environment.Exit(1);
    }

    //in production, log and continue so the app serves read-only traffic
}

app.Run();
