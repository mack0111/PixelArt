using Microsoft.Extensions.Options;
using MongoDB.Driver;
using PixelArt.Data;
using PixelArt.Models;
using PixelArt.Options;

namespace PixelArt.Services;

public interface IPixelBoardService
{
    Pixel[][] GetBoard();
    Pixel UpdatePixel(int x, int y, string color, string paintedBy);
    Pixel? RestorePixel(int x, int y, string color);
}

public class PixelBoardService : IPixelBoardService
{
    private readonly int _boardWidth;
    private readonly int _boardHeight;
    private readonly Pixel[][] _board;
    private readonly IMongoCollection<PixelDocument> _pixels;
    private readonly object _lock = new();

    public PixelBoardService(
        IMongoClient mongoClient,
        IOptions<MongoDbOptions> mongoOptions,
        IOptions<PixelBoardOptions> boardOptions)
    {
        var o = boardOptions.Value;
        if (o.Width <= 0 || o.Height <= 0)
            throw new InvalidOperationException("PixelBoard: Width and Height must be positive.");

        _boardWidth = o.Width;
        _boardHeight = o.Height;

        _board = Enumerable.Range(0, _boardHeight)
            .Select(y => Enumerable.Range(0, _boardWidth)
                .Select(x => new Pixel { X = x, Y = y })
                .ToArray())
            .ToArray();

        var m = mongoOptions.Value;
        var db = mongoClient.GetDatabase(m.DatabaseName);
        _pixels = db.GetCollection<PixelDocument>(m.PixelsCollectionName);

        InitializeFromMongo().GetAwaiter().GetResult();
    }

    private async Task InitializeFromMongo()
    {
        var expected = (long)_boardWidth * _boardHeight;
        var count = await _pixels.CountDocumentsAsync(FilterDefinition<PixelDocument>.Empty);
        if (count == 0)
        {
            var docs = new List<PixelDocument>(_boardWidth * _boardHeight);
            for (var y = 0; y < _boardHeight; y++)
            for (var x = 0; x < _boardWidth; x++)
                docs.Add(PixelDocument.FromPixel(_board[y][x]));
            await _pixels.InsertManyAsync(docs);
            return;
        }

        var list = await _pixels.Find(FilterDefinition<PixelDocument>.Empty).ToListAsync();
        foreach (var doc in list)
        {
            if (doc.X < 0 || doc.X >= _boardWidth || doc.Y < 0 || doc.Y >= _boardHeight)
                continue;
            _board[doc.Y][doc.X] = doc.ToPixel();
        }

        if (list.Count < expected)
        {
            var existing = list.Select(d => (d.X, d.Y)).ToHashSet();
            var missing = new List<PixelDocument>();
            for (var y = 0; y < _boardHeight; y++)
            for (var x = 0; x < _boardWidth; x++)
            {
                if (existing.Contains((x, y)))
                    continue;
                missing.Add(PixelDocument.FromPixel(_board[y][x]));
            }
            if (missing.Count > 0)
                await _pixels.InsertManyAsync(missing);
        }
    }

    private void PersistPixel(Pixel pixel)
    {
        var doc = PixelDocument.FromPixel(pixel);
        _pixels.ReplaceOne(
            Builders<PixelDocument>.Filter.Eq(d => d.Id, doc.Id),
            doc,
            new ReplaceOptions { IsUpsert = true });
    }

    public Pixel[][] GetBoard()
    {
        lock (_lock) return _board;
    }

    public Pixel UpdatePixel(int x, int y, string color, string paintedBy)
    {
        lock (_lock)
        {
            var pixel = _board[y][x];
            pixel.Color = color;
            pixel.PaintedBy = paintedBy;
            pixel.PaintedAt = DateTime.UtcNow;
            PersistPixel(pixel);
            return pixel;
        }
    }

    public Pixel? RestorePixel(int x, int y, string color)
    {
        lock (_lock)
        {
            if (x < 0 || x >= _boardWidth || y < 0 || y >= _boardHeight) return null;
            var pixel = _board[y][x];
            pixel.Color = color;
            pixel.PaintedBy = null;
            pixel.PaintedAt = null;
            PersistPixel(pixel);
            return pixel;
        }
    }
}
