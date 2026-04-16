using Microsoft.AspNetCore.SignalR;
using PixelArt.Hubs;
using PixelArt.Models;

namespace PixelArt.Services;

public interface IWarGameService
{
    WarGameState GetState();
    WarPixel[][] GetBoard();
    (bool ok, string? error) JoinTeam(string username, WarTeam team);
    (bool ok, WarPixel? pixel) PaintPixel(string username, int x, int y);
    WarGameState StartGame(int durationSeconds = 180);
    void ResetGame();
    WarTeam GetTeam(string username);
    void RemovePlayer(string username);
}

public class WarGameService : IWarGameService
{
    private readonly int _width;
    private readonly int _height;
    private readonly WarPixel[][] _board;
    private readonly object _lock = new();
    private readonly IHubContext<WarHub> _hubContext;

    private WarGameState _state = new();
    private readonly Dictionary<string, WarTeam> _playerTeams = new();
    private Timer? _timer;

    public WarGameService(IHubContext<WarHub> hubContext)
    {
        _hubContext = hubContext;
        _width = 32;
        _height = 32;
        _board = Enumerable.Range(0, _height)
            .Select(y => Enumerable.Range(0, _width)
                .Select(x => new WarPixel { X = x, Y = y })
                .ToArray())
            .ToArray();
        _state.TotalPixels = _width * _height;
    }

    public WarGameState GetState()
    {
        lock (_lock)
        {
            _state.Players = new Dictionary<string, WarTeam>(_playerTeams);
            return _state;
        }
    }

    public WarPixel[][] GetBoard()
    {
        lock (_lock) return _board;
    }

    public (bool ok, string? error) JoinTeam(string username, WarTeam team)
    {
        lock (_lock)
        {
            if (_state.IsRunning)
                return (false, "เกมกำลังดำเนินอยู่ รอเกมจบก่อน");
            if (team == WarTeam.None)
                return (false, "เลือกทีมให้ถูกต้อง");
            _playerTeams[username] = team;
            _state.Players = new Dictionary<string, WarTeam>(_playerTeams);
            return (true, null);
        }
    }

    public (bool ok, WarPixel? pixel) PaintPixel(string username, int x, int y)
    {
        lock (_lock)
        {
            if (!_state.IsRunning) return (false, null);
            if (x < 0 || x >= _width || y < 0 || y >= _height) return (false, null);
            if (!_playerTeams.TryGetValue(username, out var team) || team == WarTeam.None)
                return (false, null);

            var pixel = _board[y][x];
            var oldTeam = pixel.Team;
            pixel.Team = team;
            pixel.PaintedBy = username;

            // อัปเดต counts
            if (oldTeam == WarTeam.Red) _state.RedCount--;
            else if (oldTeam == WarTeam.Blue) _state.BlueCount--;

            if (team == WarTeam.Red) _state.RedCount++;
            else if (team == WarTeam.Blue) _state.BlueCount++;

            return (true, pixel);
        }
    }

    public WarGameState StartGame(int durationSeconds = 180)
    {
        lock (_lock)
        {
          
            foreach (var row in _board)
                foreach (var p in row) { p.Team = WarTeam.None; p.PaintedBy = null; }

            _state.RedCount = 0;
            _state.BlueCount = 0;
            _state.IsRunning = true;
            _state.Winner = null;
            _state.EndsAt = DateTime.UtcNow.AddSeconds(durationSeconds);
            _state.Players = new Dictionary<string, WarTeam>(_playerTeams);
        }

        // Tick ทุก 1 วินาที
        _timer?.Dispose();
        _timer = new Timer(_ => Tick(), null, 1000, 1000);

        return GetState();
    }

    public void ResetGame()
    {
        lock (_lock)
        {
            _timer?.Dispose();
            _timer = null;
            foreach (var row in _board)
                foreach (var p in row) { p.Team = WarTeam.None; p.PaintedBy = null; }
            _state = new WarGameState { TotalPixels = _width * _height };
            _playerTeams.Clear();
        }
    }

    public WarTeam GetTeam(string username)
    {
        lock (_lock) { return _playerTeams.TryGetValue(username, out var t) ? t : WarTeam.None; }
    }

    public void RemovePlayer(string username)
    {
        lock (_lock) _playerTeams.Remove(username);
    }

    private void Tick()
    {
        WarGameState state;
        lock (_lock) state = GetState();

        if (state.SecondsLeft <= 0 && state.IsRunning)
        {
            lock (_lock)
            {
                _state.IsRunning = false;
                _state.Winner = _state.RedCount >= _state.BlueCount ? WarTeam.Red : WarTeam.Blue;
                _timer?.Dispose();
                _timer = null;
                state = GetState();
            }
            _hubContext.Clients.All.SendAsync("WarEnded", state);
        }
        else
        {
            _hubContext.Clients.All.SendAsync("WarTick", state.SecondsLeft, state.RedCount, state.BlueCount);
        }
    }
}
