using API.Data;
using API.Helpers;
using API.Models;
using API.Repositories;
using API.Services;
using API.Settings;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using MongoDB.Driver;
//using Scalar.AspNetCore;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// Load and bind settings
builder.Services.Configure<MongoDBSettings>(builder.Configuration.GetSection("MongoDBSettings"));
builder.Services.Configure<JwtSettings>(builder.Configuration.GetSection("JwtSettings"));

// Register JwtHelper
builder.Services.AddSingleton<JwtHelper>(sp =>
{
    var settings = sp.GetRequiredService<IOptions<JwtSettings>>().Value;
    return new JwtHelper(settings);
});

// MongoDB & Repositories
builder.Services.AddSingleton<MongoDbContext>();
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IProjectRepository, ProjectRepository>();
builder.Services.AddScoped<ITaskRepository, TaskRepository>();

// Services
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<IProjectService, ProjectService>();
builder.Services.AddScoped<ITaskService, TaskService>();

// 9. Updated Program.cs (Add these lines to your existing Program.cs)
// Add these lines to your existing Program.cs where other repositories and services are registered:

// Register Comment Repository and Service (add these lines after your existing registrations)
builder.Services.AddScoped<ICommentRepository, CommentRepository>();
builder.Services.AddScoped<ICommentService, CommentService>();

// Add these to your Program.cs where you register other services
builder.Services.AddScoped<ITaskActivityRepository, TaskActivityRepository>();
builder.Services.AddScoped<ITaskActivityService, TaskActivityService>();
builder.Services.AddHttpContextAccessor(); // This is needed to access User claims in services

// Add Controllers
builder.Services.AddControllers();

// Add CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader();
    });
});

// Add JWT Authentication
var jwtSettings = builder.Configuration.GetSection("JwtSettings").Get<JwtSettings>();
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtSettings!.Issuer,
        ValidAudience = jwtSettings.Audience,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSettings.SecretKey))
    };
});

// Swagger config with JWT support
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "ToDo API", Version = "v1" });

    var securityScheme = new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Enter 'Bearer {token}'"
    };
    c.AddSecurityDefinition("Bearer", securityScheme);
    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
            },
            new string[] {}
        }
    });
});



var app = builder.Build();

// Enable Swagger
// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// Enable CORS
app.UseCors("AllowAll");

// Use Authentication and Authorization
app.UseAuthentication();
app.UseAuthorization();

//app.MapOpenApi();
//app.MapScalarApiReference();

app.MapControllers();

// Create admin if none exists
using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<MongoDbContext>();
    var adminExists = await dbContext.Users.Find(u => u.role == "admin").AnyAsync();

    if (!adminExists)
    {
        var adminUser = new User
        {
            name = "admin",
            email = "admin@example.com",
            password = BCrypt.Net.BCrypt.HashPassword("adminpassword"),
            role = "admin",
            isActive = true,
            createdAt = DateTime.UtcNow
        };

        await dbContext.Users.InsertOneAsync(adminUser);
        Console.WriteLine("Admin user created: admin@todo.com / Admin@123");
    }

    // Check if sample team leader exists
    var teamLeaderExists = await dbContext.Users.Find(u => u.role == "teamleader").AnyAsync();

    if (!teamLeaderExists)
    {
        // Create sample team leader
        var teamLeader = new User
        {
            name = "Team Leader One",
            email = "teamlead1@example.com",
            password = BCrypt.Net.BCrypt.HashPassword("TeamLead@123"),
            role = "teamleader",
            isActive = true,
            createdAt = DateTime.UtcNow,
            teamLeaderProjects = new List<string>()
        };

        await dbContext.Users.InsertOneAsync(teamLeader);
        Console.WriteLine("Team Leader created: teamlead1@example.com / TeamLead@123");

        // Create another team leader
        var teamLeader2 = new User
        {
            name = "Team Leader Two",
            email = "teamlead2@example.com",
            password = BCrypt.Net.BCrypt.HashPassword("TeamLead@123"),
            role = "teamleader",
            isActive = true,
            createdAt = DateTime.UtcNow,
            teamLeaderProjects = new List<string>()
        };

        await dbContext.Users.InsertOneAsync(teamLeader2);
        Console.WriteLine("Team Leader created: teamlead2@example.com / TeamLead@123");
    }
}

app.Run();