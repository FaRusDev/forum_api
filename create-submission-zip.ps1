# Script untuk membuat ZIP submission yang BENAR
# Hanya include file yang WAJIB, exclude yang tidak perlu

# Nama ZIP output
$zipName = "forum-api-submission-final.zip"

# Hapus ZIP lama jika ada
if (Test-Path $zipName) {
    Remove-Item $zipName -Force
    Write-Host "✅ Deleted old ZIP: $zipName" -ForegroundColor Green
}

# Daftar file/folder yang WAJIB di-include
$itemsToInclude = @(
    "src",
    "migrations",
    "tests",
    "config",
    ".github",
    "package.json",
    "package-lock.json",
    ".env.example",
    ".gitignore",
    "Procfile",
    "railway.json",
    "README.md",
    "nginx.conf",
    "Forum API V2 Test.postman_collection.json",
    "Forum API V2 Test.postman_environment.json",
    "Forum API V1 Test.postman_collection.json",
    "Forum API V1 Test.postman_environment.json"
)

Write-Host "`n🎯 Creating submission ZIP with ONLY required files..." -ForegroundColor Cyan
Write-Host "=" * 70 -ForegroundColor Cyan

# Buat temporary folder
$tempFolder = "forum-api-temp"
if (Test-Path $tempFolder) {
    Remove-Item $tempFolder -Recurse -Force
}
New-Item -ItemType Directory -Path $tempFolder -Force | Out-Null

# Copy files yang diperlukan
foreach ($item in $itemsToInclude) {
    if (Test-Path $item) {
        $destination = Join-Path $tempFolder $item
        
        if (Test-Item $item -PathType Container) {
            # Jika folder, copy dengan exclude tertentu
            Write-Host "📁 Copying folder: $item" -ForegroundColor Yellow
            
            # Exclude config/database/test.json (ada di .gitignore)
            if ($item -eq "config") {
                robocopy $item $destination /E /XF "test.json" /NFL /NDL /NJH /NJS | Out-Null
            } else {
                Copy-Item -Path $item -Destination $destination -Recurse -Force
            }
        } else {
            # Jika file, copy langsung
            Write-Host "📄 Copying file: $item" -ForegroundColor Yellow
            Copy-Item -Path $item -Destination $destination -Force
        }
        Write-Host "   ✅ Copied: $item" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  Not found (skipped): $item" -ForegroundColor Red
    }
}

Write-Host "`n📦 Creating ZIP archive..." -ForegroundColor Cyan

# Buat ZIP
Compress-Archive -Path "$tempFolder\*" -DestinationPath $zipName -Force

# Hapus temporary folder
Remove-Item $tempFolder -Recurse -Force

Write-Host "=" * 70 -ForegroundColor Cyan
Write-Host "✅ ZIP created successfully: $zipName" -ForegroundColor Green
Write-Host ""

# Tampilkan info ZIP
$zipInfo = Get-Item $zipName
$zipSizeMB = [math]::Round($zipInfo.Length / 1MB, 2)
Write-Host "📊 ZIP Information:" -ForegroundColor Cyan
Write-Host "   File: $($zipInfo.Name)" -ForegroundColor White
Write-Host "   Size: $zipSizeMB MB" -ForegroundColor White
Write-Host "   Path: $($zipInfo.FullName)" -ForegroundColor White

Write-Host "`n🔍 Verifying ZIP contents..." -ForegroundColor Cyan

# List isi ZIP
$zipContents = [System.IO.Compression.ZipFile]::OpenRead($zipInfo.FullName)
$fileCount = $zipContents.Entries.Count

Write-Host "   Total files/folders: $fileCount" -ForegroundColor White
Write-Host ""
Write-Host "   Top-level items:" -ForegroundColor Yellow

$topLevel = $zipContents.Entries | Where-Object { 
    $_.FullName -notmatch '/' -or $_.FullName -match '^[^/]+/$' 
} | Select-Object -First 20

foreach ($entry in $topLevel) {
    if ($entry.FullName -match '/$') {
        Write-Host "   📁 $($entry.FullName)" -ForegroundColor Cyan
    } else {
        Write-Host "   📄 $($entry.FullName)" -ForegroundColor White
    }
}

$zipContents.Dispose()

Write-Host "`n" + ("=" * 70) -ForegroundColor Cyan
Write-Host "🎉 SUBMISSION ZIP READY!" -ForegroundColor Green
Write-Host ("=" * 70) -ForegroundColor Cyan
Write-Host ""
Write-Host "⚠️  CRITICAL CHECKLIST BEFORE SUBMIT:" -ForegroundColor Red
Write-Host ""
Write-Host "   ✅ Environment Postman pointing to production Railway?" -ForegroundColor Yellow
Write-Host "      (Forum API V2 Test.postman_environment.json)"
Write-Host ""
Write-Host "   ✅ Rate limiting di src/Infrastructures/http/createServer.js?" -ForegroundColor Yellow
Write-Host "      (Application-level middleware)"
Write-Host ""
Write-Host "   ✅ README.md explains application-level rate limiting?" -ForegroundColor Yellow
Write-Host ""
Write-Host "   ✅ All tests passing (161 tests)?" -ForegroundColor Yellow
Write-Host ""
Write-Host "   ✅ Production Railway accessible?" -ForegroundColor Yellow
Write-Host "      https://forumapi-production.up.railway.app"
Write-Host ""
Write-Host "=" * 70 -ForegroundColor Cyan
Write-Host ""
