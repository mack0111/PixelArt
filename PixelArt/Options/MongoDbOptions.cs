namespace PixelArt.Options;

public class MongoDbOptions
{
    public const string SectionName = "MongoDb";

    public string ConnectionString { get; set; } = "";
    public string DatabaseName { get; set; } = "pixelart";
    public string PixelsCollectionName { get; set; } = "pixels";
}
