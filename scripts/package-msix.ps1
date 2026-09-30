param(
    [string]$MsiPath = "$env:USERPROFILE\Downloads\VoiceScribe_0.1.0_x64_en-US.msi",
    [string]$OutputDir = "$env:USERPROFILE\Downloads"
)

$ErrorActionPreference = "Stop"

Write-Host "============================================="
Write-Host "VoiceScribe MSI to MSIX Packaging Script"
Write-Host "============================================="
Write-Host "Input MSI: $MsiPath"

if (-not (Test-Path $MsiPath)) {
    Write-Error "MSI file not found at: $MsiPath"
    exit 1
}

$repoRoot = (Resolve-Path "$PSScriptRoot\..").Path
$workDir = Join-Path $repoRoot "msix-build-temp"
$pkgDir = Join-Path $workDir "package"
$assetsDir = Join-Path $pkgDir "Assets"

if (Test-Path $workDir) {
    Remove-Item -Path $workDir -Recurse -Force
}
New-Item -ItemType Directory -Path $assetsDir -Force | Out-Null

Write-Host "Step 1: Extracting cabinet from MSI via WindowsInstaller COM..."
$cabPath = Join-Path $workDir "app.cab"

$wi = New-Object -ComObject WindowsInstaller.Installer
$db = $wi.GetType().InvokeMember("OpenDatabase", "InvokeMethod", $null, $wi, @($MsiPath, 0))
$view = $db.GetType().InvokeMember("OpenView", "InvokeMethod", $null, $db, @("SELECT Name, Data FROM _Streams WHERE Name='app.cab'"))
$view.GetType().InvokeMember("Execute", "InvokeMethod", $null, $view, $null)
$record = $view.GetType().InvokeMember("Fetch", "InvokeMethod", $null, $view, $null)

if (-not $record) {
    Write-Error "Could not locate app.cab stream inside MSI"
    exit 1
}

$fs = [System.IO.File]::Create($cabPath)
try {
    do {
        $chunk = $record.GetType().InvokeMember("ReadStream", "InvokeMethod", $null, $record, @(2, 65536, 2))
        if ($chunk -and $chunk.Length -gt 0) {
            if ($chunk -is [byte[]]) {
                $fs.Write($chunk, 0, $chunk.Length)
            } else {
                $bytes = [System.Text.Encoding]::Default.GetBytes($chunk)
                $fs.Write($bytes, 0, $bytes.Length)
            }
        } else {
            break
        }
    } while ($true)
} finally {
    $fs.Close()
}

Write-Host "Extracted cabinet size: $((Get-Item $cabPath).Length) bytes"

Write-Host "Step 2: Unpacking application binary from cabinet..."
$expandDir = Join-Path $workDir "expanded"
New-Item -ItemType Directory -Path $expandDir -Force | Out-Null
& expand.exe "$cabPath" -F:* "$expandDir" | Out-Null

$extractedFiles = Get-ChildItem -Path $expandDir -File
if ($extractedFiles.Count -eq 0) {
    Write-Error "Failed to extract binary from cabinet"
    exit 1
}

$extractedExe = $extractedFiles[0].FullName
$targetExe = Join-Path $pkgDir "VoiceScribe.exe"
Copy-Item -Path $extractedExe -Destination $targetExe -Force
Write-Host "Target executable prepared: $targetExe ($((Get-Item $targetExe).Length) bytes)"

Write-Host "Step 3: Staging AppxManifest.xml..."
$manifestSrc = Join-Path $repoRoot "src-tauri\AppxManifest.xml"
$manifestDst = Join-Path $pkgDir "AppxManifest.xml"
Copy-Item -Path $manifestSrc -Destination $manifestDst -Force

Write-Host "Step 4: Preparing Assets & Logos..."
Add-Type -AssemblyName System.Drawing
$iconBase = Join-Path $repoRoot "src-tauri\icons\128x128.png"

function Resize-Image($srcPath, $dstPath, $width, $height) {
    $srcImg = [System.Drawing.Image]::FromFile((Resolve-Path $srcPath).Path)
    $destBitmap = New-Object System.Drawing.Bitmap($width, $height)
    $graphic = [System.Drawing.Graphics]::FromImage($destBitmap)
    $graphic.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphic.DrawImage($srcImg, 0, 0, $width, $height)
    $graphic.Dispose()
    $srcImg.Dispose()
    $destBitmap.Save($dstPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $destBitmap.Dispose()
}

Resize-Image $iconBase (Join-Path $assetsDir "Square44x44Logo.png") 44 44
Resize-Image $iconBase (Join-Path $assetsDir "Square150x150Logo.png") 150 150
Resize-Image $iconBase (Join-Path $assetsDir "Wide310x150Logo.png") 310 150
Resize-Image $iconBase (Join-Path $assetsDir "StoreLogo.png") 50 50
Resize-Image $iconBase (Join-Path $assetsDir "SplashScreen.png") 620 300
Write-Host "Assets generated successfully."

Write-Host "Step 5: Locating makeappx.exe..."
$makeappx = Get-ChildItem "C:\Program Files (x86)\Windows Kits\10\bin" -Recurse -Filter "makeappx.exe" -ErrorAction SilentlyContinue |
    Where-Object { $_.FullName -like "*x64*" } |
    Sort-Object FullName -Descending |
    Select-Object -First 1

if (-not $makeappx) {
    Write-Error "makeappx.exe not found in Windows Kits"
    exit 1
}
Write-Host "Found makeappx: $($makeappx.FullName)"

[xml]$manifestXml = Get-Content $manifestDst
$version = $manifestXml.Package.Identity.Version
$displayVersion = ($version -replace '\.0$', '')
Write-Host "Packaging version: $version (Filename version: $displayVersion)"

$outFileName = "VoiceScribe_${displayVersion}_x64.msix"
$outMsixInDownloads = Join-Path $OutputDir $outFileName
$localOutDir = Join-Path $repoRoot "msix-output"
New-Item -ItemType Directory -Path $localOutDir -Force | Out-Null
$localMsix = Join-Path $localOutDir $outFileName

Write-Host "Step 6: Packaging MSIX..."
& $makeappx.FullName pack /d "$pkgDir" /p "$outMsixInDownloads" /nv /o
if ($LASTEXITCODE -ne 0) {
    Write-Error "makeappx pack failed with exit code $LASTEXITCODE"
    exit $LASTEXITCODE
}

# Also copy to local repo msix-output for convenience
Copy-Item -Path $outMsixInDownloads -Destination $localMsix -Force

Write-Host "============================================="
Write-Host "SUCCESS!"
Write-Host "Generated MSIX: $outMsixInDownloads"
Write-Host "Size: $((Get-Item $outMsixInDownloads).Length) bytes"
Write-Host "============================================="
