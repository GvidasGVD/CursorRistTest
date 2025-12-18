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

async Task EnsureTableAsync(SqlConnection connection)
{
    const string sql = @"IF NOT EXISTS (SELECT * FROM sysobjects WHERE name = 'Names' AND xtype = 'U')
                         CREATE TABLE Names (
                             Id INT IDENTITY(1,1) PRIMARY KEY,
                             Name NVARCHAR(255) NOT NULL,
                             CreatedAt DATETIME2 DEFAULT SYSUTCDATETIME()
                         );";

    await connection.OpenAsync();
    using var command = new SqlCommand(sql, connection);
    await command.ExecuteNonQueryAsync();
    await connection.CloseAsync();
}

app.MapGet("/api/names", async (SqlConnection connection) =>
{
    await EnsureTableAsync(connection);

    const string sql = "SELECT Id, Name, CreatedAt FROM Names ORDER BY CreatedAt DESC";

    await connection.OpenAsync();
    using var command = new SqlCommand(sql, connection);
    using var reader = await command.ExecuteReaderAsync();

    var results = new List<NameRecord>();
    while (await reader.ReadAsync())
    {
        results.Add(new NameRecord(
            reader.GetInt32(0),
            reader.GetString(1),
            reader.GetDateTime(2)
        ));
    }

    await connection.CloseAsync();

    return Results.Ok(results);
});

app.MapPost("/api/names", async (NameDto dto, SqlConnection connection) =>
{
    if (string.IsNullOrWhiteSpace(dto.Name))
    {
        return Results.BadRequest(new { error = "Name is required" });
    }

    await EnsureTableAsync(connection);

    const string sql = @"INSERT INTO Names (Name)
                         OUTPUT INSERTED.Id, INSERTED.Name, INSERTED.CreatedAt
                         VALUES (@name);";

    await connection.OpenAsync();
    using var command = new SqlCommand(sql, connection);
    command.Parameters.AddWithValue("@name", dto.Name.Trim());

    using var reader = await command.ExecuteReaderAsync();
    NameRecord? created = null;

    if (await reader.ReadAsync())
    {
        created = new NameRecord(
            reader.GetInt32(0),
            reader.GetString(1),
            reader.GetDateTime(2)
        );
    }

    await connection.CloseAsync();

    return created is not null
        ? Results.Created("/api/names/" + created.Id, created)
        : Results.StatusCode(StatusCodes.Status500InternalServerError);
});

app.Run();

record NameDto(string Name);
record NameRecord(int Id, string Name, DateTime CreatedAt);
