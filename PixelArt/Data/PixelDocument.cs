using MongoDB.Bson.Serialization.Attributes;
using PixelArt.Models;

namespace PixelArt.Data;

public class PixelDocument
{
    [BsonId]
    public string Id { get; set; } = "";

    public int X { get; set; }
    public int Y { get; set; }
    public string Color { get; set; } = "#FFFFFF";
    public string? PaintedBy { get; set; }

    [BsonDateTimeOptions(Kind = DateTimeKind.Utc)]
    public DateTime? PaintedAt { get; set; }

    public static string BuildId(int x, int y) => $"{x}_{y}";

    public static PixelDocument FromPixel(Pixel p) => new()
    {
        Id = BuildId(p.X, p.Y),
        X = p.X,
        Y = p.Y,
        Color = p.Color,
        PaintedBy = p.PaintedBy,
        PaintedAt = p.PaintedAt
    };

    public Pixel ToPixel() => new()
    {
        X = X,
        Y = Y,
        Color = Color,
        PaintedBy = PaintedBy,
        PaintedAt = PaintedAt
    };
}
