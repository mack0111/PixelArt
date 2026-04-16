using Microsoft.AspNetCore.SignalR;
using PixelArt.Models;
using PixelArt.Services;
using System.Collections.Concurrent;

namespace PixelArt.Hubs;

public class PixelHub : Hub
{
    private readonly IPixelBoardService _boardService;

    // connectionId → username
    private static readonly ConcurrentDictionary<string, string> _users = new();

    // connectionId → (x, y) cursor position
    private static readonly ConcurrentDictionary<string, (int x, int y)> _cursors = new();

    private static readonly ConcurrentDictionary<string, Stack<(int x, int y, string prevColor)>>
        _undoStacks = new();

    private static readonly List<ChatMessage> _chatMessages = new();
    private static readonly object _chatLock = new();
    private const int MaxChatMessages = 100;

    private static readonly object _connectionLock = new();
    private static int _activeConnections;

    public PixelHub(IPixelBoardService boardService)
    {
        _boardService = boardService;
    }

    public override async Task OnConnectedAsync()
    {
        lock (_connectionLock)
            _activeConnections++;

        _undoStacks[Context.ConnectionId] = new Stack<(int, int, string)>();

        var board = _boardService.GetBoard();
        await Clients.Caller.SendAsync("BoardLoaded", board);

       
        await Clients.Caller.SendAsync("OnlineUsers", _users.Values.ToList());

        
        List<ChatMessage> history;
        lock (_chatLock) { history = _chatMessages.ToList(); }
        await Clients.Caller.SendAsync("ChatHistory", history);

        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        _undoStacks.TryRemove(Context.ConnectionId, out _);
        _cursors.TryRemove(Context.ConnectionId, out _);

        if (_users.TryRemove(Context.ConnectionId, out var username))
        {
            await Clients.Others.SendAsync("UserLeft", username);
            await Clients.All.SendAsync("OnlineUsers", _users.Values.ToList());
        }

        lock (_connectionLock)
        {
            _activeConnections--;
            if (_activeConnections == 0)
                ClearEphemeralServerState();
        }

        await base.OnDisconnectedAsync(exception);
    }

    /// <summary>
    /// เมื่อไม่มี SignalR connection เหลือบน PixelHub — ล้าง chat / cursors / undo / รายชื่อค้าง (ไม่แตะกระดานใน Mongo)
    /// </summary>
    private static void ClearEphemeralServerState()
    {
        _users.Clear();
        _cursors.Clear();
        _undoStacks.Clear();
        lock (_chatLock)
            _chatMessages.Clear();
    }

  
    public async Task RegisterUser(string username)
    {
        _users[Context.ConnectionId] = username;
        await Clients.All.SendAsync("UserJoined", username);
        await Clients.All.SendAsync("OnlineUsers", _users.Values.ToList());
    }

    public async Task PaintPixel(int x, int y, string color, string username)
    {
        var board = _boardService.GetBoard();
        var prevColor = board[y][x].Color;

        if (_undoStacks.TryGetValue(Context.ConnectionId, out var stack))
            stack.Push((x, y, prevColor));

        var updatedPixel = _boardService.UpdatePixel(x, y, color, username);
        await Clients.All.SendAsync("PixelUpdated", updatedPixel);
    }

    public async Task UndoLastPixel()
    {
        if (!_undoStacks.TryGetValue(Context.ConnectionId, out var stack) || stack.Count == 0)
            return;

        var (x, y, prevColor) = stack.Pop();
        var restoredPixel = _boardService.RestorePixel(x, y, prevColor);
        if (restoredPixel != null)
            await Clients.All.SendAsync("PixelUpdated", restoredPixel);
    }

    // Client ส่ง cursor position มาเมื่อ hover บน pixel
    public async Task MoveCursor(int x, int y)
    {
        _cursors[Context.ConnectionId] = (x, y);
        var username = _users.GetValueOrDefault(Context.ConnectionId, "???");
        await Clients.Others.SendAsync("CursorMoved", new { username, x, y });
    }

    
    public async Task SendMessage(string text)
    {
        var username = _users.GetValueOrDefault(Context.ConnectionId);
        if (string.IsNullOrWhiteSpace(username) || string.IsNullOrWhiteSpace(text)) return;

      
        var safeText = text.Trim();
        if (safeText.Length > 300) safeText = safeText[..300];

        var message = new ChatMessage
        {
            Username = username,
            Text = safeText,
            SentAt = DateTime.UtcNow,
        };

        lock (_chatLock)
        {
            _chatMessages.Add(message);
            if (_chatMessages.Count > MaxChatMessages)
                _chatMessages.RemoveAt(0);
        }

        await Clients.All.SendAsync("MessageReceived", message);
    }
}
