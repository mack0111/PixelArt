using Microsoft.AspNetCore.Mvc;
using PixelArt.Services;

namespace PixelArt.Controllers;

[ApiController]
[Route("[controller]")]
public class PixelBoardController : ControllerBase
{
    private readonly IPixelBoardService _boardService;

    public PixelBoardController(IPixelBoardService boardService)
    {
        _boardService = boardService;
    }

    
    [HttpGet]
    public IActionResult GetBoard()
    {
        return Ok(_boardService.GetBoard());
    }
}
