using Microsoft.Extensions.Options;
using MongoDB.Driver;
using PixelArt.Hubs;
using PixelArt.Options;
using PixelArt.Services;
using Scalar.AspNetCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddOpenApi();
builder.Services.AddControllers();

// SignalR สำหรับ real-time pixel updates
builder.Services.AddSignalR()
    .AddJsonProtocol(options =>
    {
        options.PayloadSerializerOptions.Converters.Add(
            new System.Text.Json.Serialization.JsonStringEnumConverter());
    });

builder.Services.Configure<PixelBoardOptions>(
    builder.Configuration.GetSection(PixelBoardOptions.SectionName));
builder.Services.Configure<MongoDbOptions>(
    builder.Configuration.GetSection(MongoDbOptions.SectionName));

builder.Services.AddSingleton<IMongoClient>(sp =>
{
    var mongo = sp.GetRequiredService<IOptions<MongoDbOptions>>().Value;
    if (string.IsNullOrWhiteSpace(mongo.ConnectionString))
        throw new InvalidOperationException("MongoDb:ConnectionString is required (e.g. appsettings.Development.json or environment).");
    return new MongoClient(mongo.ConnectionString);
});

// PixelBoardService เป็น Singleton เพื่อให้ทุก user เห็น board เดียวกัน (state ใน memory + persist ลง Mongo)
builder.Services.AddSingleton<IPixelBoardService, PixelBoardService>();
builder.Services.AddSingleton<IWarGameService, WarGameService>();
builder.Services.AddScoped<IWeatherForecastService, WeatherForecastService>();

// CORS สำหรับ React frontend (localhost:5173 = Vite default)
builder.Services.AddCors(options =>
{
    options.AddPolicy("ReactApp", policy =>
    {
        policy.WithOrigins("http://localhost:5173", "http://localhost:3000", "http://localhost:5204")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials(); // จำเป็นสำหรับ SignalR
    });
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.MapScalarApiReference();
}

app.UseHttpsRedirection();
app.UseCors("ReactApp");
app.MapControllers();

// SignalR Hub endpoint
app.MapHub<PixelHub>("/hubs/pixel");
app.MapHub<WarHub>("/hubs/war");

app.Run();
