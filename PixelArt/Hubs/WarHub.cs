using Microsoft.AspNetCore.SignalR;
using PixelArt.Models;
using PixelArt.Services;
using System.Collections.Concurrent;

namespace PixelArt.Hubs;

public class WarHub : Hub
{
    private readonly IWarGameService _warService;

    // connectionId → username
    private static readonly ConcurrentDictionary<string, string> _users = new();

    private static readonly object _connectionLock = new();
    private static int _activeConnections;

    public WarHub(IWarGameService warService)
    {
        _warService = warService;
    }

    public override async Task OnConnectedAsync()
    {
        lock (_connectionLock)
            _activeConnections++;

        await Clients.Caller.SendAsync("WarStateUpdated", _warService.GetState());
        await Clients.Caller.SendAsync("WarBoardLoaded", _warService.GetBoard());
        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        if (_users.TryRemove(Context.ConnectionId, out var username))
        {
            _warService.RemovePlayer(username);
            await Clients.All.SendAsync("WarStateUpdated", _warService.GetState());
        }

        lock (_connectionLock)
        {
            _activeConnections--;
            if (_activeConnections == 0)
            {
                _users.Clear();
                _warService.ResetGame();
            }
        }

        await base.OnDisconnectedAsync(exception);
    }

    public async Task RegisterWarUser(string username)
    {
        _users[Context.ConnectionId] = username;
        await Clients.Caller.SendAsync("WarStateUpdated", _warService.GetState());
    }

    public async Task JoinTeam(string username, string teamStr)
    {
        if (!Enum.TryParse<WarTeam>(teamStr, true, out var team))
        {
            await Clients.Caller.SendAsync("WarError", "ทีมไม่ถูกต้อง");
            return;
        }

        var (ok, error) = _warService.JoinTeam(username, team);
        if (!ok)
        {
            await Clients.Caller.SendAsync("WarError", error);
            return;
        }

        await Clients.All.SendAsync("WarStateUpdated", _warService.GetState());
    }

    public async Task StartWar(int durationSeconds = 180)
    {
        var state = _warService.StartGame(durationSeconds);
        var board = _warService.GetBoard();
        await Clients.All.SendAsync("WarStarted", state, board);
    }

    public async Task WarPaintPixel(string username, int x, int y)
    {
        var (ok, pixel) = _warService.PaintPixel(username, x, y);
        if (!ok || pixel == null) return;

        var state = _warService.GetState();
        await Clients.All.SendAsync("WarPixelUpdated", pixel);
        await Clients.All.SendAsync("WarScoreUpdated", state.RedCount, state.BlueCount, state.TotalPixels);
    }

    public async Task ResetWar()
    {
        _warService.ResetGame();
        await Clients.All.SendAsync("WarReset");
        await Clients.All.SendAsync("WarStateUpdated", _warService.GetState());
        await Clients.All.SendAsync("WarBoardLoaded", _warService.GetBoard());
    }
}
