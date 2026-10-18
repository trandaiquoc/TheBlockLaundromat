$ErrorActionPreference = 'Stop'

$repositoryRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..\..\..'))
$sourcePath = Join-Path $repositoryRoot 'Docs\design\references\01-minecraft.png'
$outputDirectory = Join-Path $repositoryRoot 'Frontend\public\assets\project-screen\layers'
$roomPath = Join-Path $outputDirectory 'scene-minecraft-room-shell.png'
$exteriorPath = Join-Path $outputDirectory 'scene-minecraft-exterior-view.png'

if (-not (Test-Path -LiteralPath $sourcePath)) {
  throw "Minecraft reference image not found: $sourcePath"
}

Add-Type -AssemblyName System.Drawing
Add-Type -ReferencedAssemblies 'System.Drawing.dll' -TypeDefinition @'
using System;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Drawing.Imaging;
using System.Runtime.InteropServices;

public static class ProjectScreenSceneSplitter
{
    public static void Split(string sourcePath, string roomPath, string exteriorPath)
    {
        using (var original = new Bitmap(sourcePath))
        using (var source = new Bitmap(original.Width, original.Height, PixelFormat.Format32bppArgb))
        using (var mask = new Bitmap(original.Width, original.Height, PixelFormat.Format32bppArgb))
        using (var room = new Bitmap(original.Width, original.Height, PixelFormat.Format32bppArgb))
        using (var exterior = new Bitmap(original.Width, original.Height, PixelFormat.Format32bppArgb))
        {
            if (original.Width != 1672 || original.Height != 941)
                throw new InvalidOperationException("Expected the approved 1672 by 941 Minecraft reference.");

            using (var sourceGraphics = Graphics.FromImage(source))
                sourceGraphics.DrawImageUnscaled(original, 0, 0);

            using (var maskGraphics = Graphics.FromImage(mask))
            using (var opaque = new SolidBrush(Color.White))
            {
                maskGraphics.Clear(Color.Transparent);
                maskGraphics.SmoothingMode = SmoothingMode.None;
                maskGraphics.PixelOffsetMode = PixelOffsetMode.None;

                // Each polygon follows a visible window/door opening on the source canvas.
                Fill(maskGraphics, opaque, new Point[] {
                    new Point(105, 183), new Point(258, 251),
                    new Point(258, 678), new Point(108, 656)
                });
                Fill(maskGraphics, opaque, new Point[] {
                    new Point(1289, 128), new Point(1671, 111),
                    new Point(1671, 284), new Point(1289, 267)
                });
                Fill(maskGraphics, opaque, new Point[] {
                    new Point(1596, 284), new Point(1671, 284),
                    new Point(1671, 710), new Point(1596, 710)
                });
            }

            CopyMaskedPixels(source, mask, room, exterior);
            room.Save(roomPath, ImageFormat.Png);
            exterior.Save(exteriorPath, ImageFormat.Png);
            AssertCompositeMatchesSource(source, room, exterior);

            using (var savedRoom = new Bitmap(roomPath))
            using (var savedExterior = new Bitmap(exteriorPath))
                AssertCompositeMatchesSource(source, savedRoom, savedExterior);
        }
    }

    private static void Fill(Graphics graphics, Brush brush, Point[] points)
    {
        graphics.FillPolygon(brush, points);
    }

    private static void CopyMaskedPixels(Bitmap source, Bitmap mask, Bitmap room, Bitmap exterior)
    {
        var bounds = new Rectangle(0, 0, source.Width, source.Height);
        var sourceData = source.LockBits(bounds, ImageLockMode.ReadOnly, PixelFormat.Format32bppArgb);
        var maskData = mask.LockBits(bounds, ImageLockMode.ReadOnly, PixelFormat.Format32bppArgb);
        var roomData = room.LockBits(bounds, ImageLockMode.WriteOnly, PixelFormat.Format32bppArgb);
        var exteriorData = exterior.LockBits(bounds, ImageLockMode.WriteOnly, PixelFormat.Format32bppArgb);
        var rowBytes = source.Width * 4;
        var sourceRow = new byte[rowBytes];
        var maskRow = new byte[rowBytes];
        var roomRow = new byte[rowBytes];
        var exteriorRow = new byte[rowBytes];

        try
        {
            for (var y = 0; y < source.Height; y++)
            {
                Marshal.Copy(IntPtr.Add(sourceData.Scan0, y * sourceData.Stride), sourceRow, 0, rowBytes);
                Marshal.Copy(IntPtr.Add(maskData.Scan0, y * maskData.Stride), maskRow, 0, rowBytes);

                for (var x = 0; x < source.Width; x++)
                {
                    var offset = x * 4;
                    var sourceAlpha = sourceRow[offset + 3];
                    var maskAlpha = maskRow[offset + 3];
                    Buffer.BlockCopy(sourceRow, offset, roomRow, offset, 4);
                    Buffer.BlockCopy(sourceRow, offset, exteriorRow, offset, 4);
                    roomRow[offset + 3] = (byte)(sourceAlpha * (255 - maskAlpha) / 255);
                    exteriorRow[offset + 3] = (byte)(sourceAlpha * maskAlpha / 255);

                    if (roomRow[offset + 3] == 0)
                        roomRow[offset] = roomRow[offset + 1] = roomRow[offset + 2] = 0;
                    if (exteriorRow[offset + 3] == 0)
                        exteriorRow[offset] = exteriorRow[offset + 1] = exteriorRow[offset + 2] = 0;
                }

                Marshal.Copy(roomRow, 0, IntPtr.Add(roomData.Scan0, y * roomData.Stride), rowBytes);
                Marshal.Copy(exteriorRow, 0, IntPtr.Add(exteriorData.Scan0, y * exteriorData.Stride), rowBytes);
            }
        }
        finally
        {
            source.UnlockBits(sourceData);
            mask.UnlockBits(maskData);
            room.UnlockBits(roomData);
            exterior.UnlockBits(exteriorData);
        }
    }

    private static void AssertCompositeMatchesSource(Bitmap source, Bitmap room, Bitmap exterior)
    {
        using (var composite = new Bitmap(source.Width, source.Height, PixelFormat.Format32bppArgb))
        using (var graphics = Graphics.FromImage(composite))
        {
            graphics.Clear(Color.Transparent);
            graphics.DrawImageUnscaled(exterior, 0, 0);
            graphics.DrawImageUnscaled(room, 0, 0);

            var bounds = new Rectangle(0, 0, source.Width, source.Height);
            var sourceData = source.LockBits(bounds, ImageLockMode.ReadOnly, PixelFormat.Format32bppArgb);
            var compositeData = composite.LockBits(bounds, ImageLockMode.ReadOnly, PixelFormat.Format32bppArgb);
            var rowBytes = source.Width * 4;
            var sourceRow = new byte[rowBytes];
            var compositeRow = new byte[rowBytes];

            try
            {
                for (var y = 0; y < source.Height; y++)
                {
                    Marshal.Copy(IntPtr.Add(sourceData.Scan0, y * sourceData.Stride), sourceRow, 0, rowBytes);
                    Marshal.Copy(IntPtr.Add(compositeData.Scan0, y * compositeData.Stride), compositeRow, 0, rowBytes);

                    for (var x = 0; x < rowBytes; x++)
                    {
                        if (sourceRow[x] != compositeRow[x])
                            throw new InvalidOperationException("The split layers do not recompose to the original Minecraft reference.");
                    }
                }
            }
            finally
            {
                source.UnlockBits(sourceData);
                composite.UnlockBits(compositeData);
            }
        }
    }
}
'@

[ProjectScreenSceneSplitter]::Split($sourcePath, $roomPath, $exteriorPath)
Write-Output "Created $roomPath"
Write-Output "Created $exteriorPath"
