namespace PixelArt.Models;

public enum WarTeam { None, Red, Blue }

public class WarPixel
{
    public int X { get; set; }
    public int Y { get; set; }
    public WarTeam Team { get; set; } = WarTeam.None;
    public string? PaintedBy { get; set; }
}

public class WarGameState
{
    public bool IsRunning { get; set; }
    public DateTime? EndsAt { get; set; }
    public int SecondsLeft => IsRunning && EndsAt.HasValue
        ? Math.Max(0, (int)(EndsAt.Value - DateTime.UtcNow).TotalSeconds)
        : 0;
    public int RedCount { get; set; }
    public int BlueCount { get; set; }
    public int TotalPixels { get; set; }
    public WarTeam? Winner { get; set; }
   
    public Dictionary<string, WarTeam> Players { get; set; } = new();
}
