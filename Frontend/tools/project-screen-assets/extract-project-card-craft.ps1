$ErrorActionPreference = 'Stop'

$repositoryRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..\..\..'))
$referencePath = Join-Path $repositoryRoot 'Docs\design\references\01-minecraft.png'
$outputPath = Join-Path $repositoryRoot 'Frontend\public\assets\project-screen\layers\project-card-craft.png'

if (-not (Test-Path -LiteralPath $referencePath)) {
  throw "Minecraft reference image not found: $referencePath"
}

Add-Type -AssemblyName System.Drawing
Add-Type -ReferencedAssemblies 'System.Drawing.dll' -TypeDefinition @'
using System;
using System.Drawing;
using System.Drawing.Imaging;

public static class ProjectCardExtractor
{
    private const int SourceX = 1176;
    private const int SourceY = 385;
    private const int Width = 158;
    private const int Height = 154;

    public static void Generate(string referencePath, string outputPath)
    {
        using (var reference = new Bitmap(referencePath))
        using (var card = new Bitmap(Width, Height, PixelFormat.Format32bppArgb))
        {
            for (var y = 0; y < Height; y++)
            {
                for (var x = 0; x < Width; x++)
                {
                    var alpha = Math.Max(
                        RoundedRectAlpha(x, y, 6, 8, 150, 144, 5),
                        EllipseAlpha(x, y, 80, 8, 8, 10));
                    if (alpha == 0 || IsPreviewOpening(x, y))
                    {
                        card.SetPixel(x, y, Color.Transparent);
                        continue;
                    }

                    var sampleX = y >= 121 ? 130 : x;
                    var pixel = reference.GetPixel(SourceX + sampleX, SourceY + y);
                    card.SetPixel(x, y, Color.FromArgb(alpha, pixel.R, pixel.G, pixel.B));
                }
            }

            card.Save(outputPath, ImageFormat.Png);
        }
    }

    private static bool IsPreviewOpening(int x, int y)
    {
        return x >= 10 && x <= 145 && y >= 12 && y <= 120;
    }

    private static int RoundedRectAlpha(float x, float y, float left, float top, float width, float height, float radius)
    {
        var qx = Math.Abs(x - (left + width / 2)) - (width / 2 - radius);
        var qy = Math.Abs(y - (top + height / 2)) - (height / 2 - radius);
        var outsideX = Math.Max(qx, 0);
        var outsideY = Math.Max(qy, 0);
        var distance = (float)Math.Sqrt(outsideX * outsideX + outsideY * outsideY) + Math.Min(Math.Max(qx, qy), 0) - radius;
        return Coverage(distance);
    }

    private static int EllipseAlpha(float x, float y, float centerX, float centerY, float radiusX, float radiusY)
    {
        var dx = (x - centerX) / radiusX;
        var dy = (y - centerY) / radiusY;
        var distance = ((float)Math.Sqrt(dx * dx + dy * dy) - 1) * Math.Min(radiusX, radiusY);
        return Coverage(distance);
    }

    private static int Coverage(float distance)
    {
        return (int)Math.Round(Math.Max(0, Math.Min(1, 1 - distance)) * 255);
    }
}
'@

[ProjectCardExtractor]::Generate($referencePath, $outputPath)
Write-Output "Created $outputPath"
