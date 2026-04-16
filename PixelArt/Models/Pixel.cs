namespace PixelArt.Models;

public class Pixel
{
    public int X { get; set; }
    public int Y { get; set; }
    public string Color { get; set; } = "#FFFFFF";
    public string? PaintedBy { get; set; }   
    public DateTime? PaintedAt { get; set; } 
}
