using Backend.Endpoints;
using Microsoft.Data.SqlClient;

var builder = WebApplication.CreateBuilder(args);
var configuration = builder.Configuration;

// Build connection string from env vars to stay in sync with Docker/.env
string BuildConnectionString(IConfiguration config)
{
    var server = config["DB_SERVER"] ?? "localhost";
    var database = config["DB_NAME"] ?? "master";
    var user = config["DB_USER"] ?? "sa";
    var password = config["DB_PASSWORD"] ?? "YourStrong!Password";

    return $"Server={server};Database={database};User Id={user};Password={password};TrustServerCertificate=True;";
}

var connectionString = BuildConnectionString(configuration);

builder.Services.AddScoped<SqlConnection>(_ => new SqlConnection(connectionString));

var frontendUrl = configuration["FRONTEND_URL"] ?? "http://localhost:5173";

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins(frontendUrl)
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

var app = builder.Build();

app.UseCors("AllowFrontend");

// Map names-related endpoints (table creation + CRUD) in a separate file
app.MapNamesEndpoints();

app.Run();
