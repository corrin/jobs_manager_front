# Simple Deprecated Code Counter
Write-Host "Scanning deprecated code..." -ForegroundColor Yellow

$srcDir = ".\src"

# Count axios calls (excluding plugins)
$axiosCount = (Get-ChildItem -Path $srcDir -Recurse -Include *.ts,*.vue | 
    Where-Object { $_.FullName -notlike "*plugins\axios.ts" } |
    Select-String "axios\." | Measure-Object).Count

# Count fetch calls  
$fetchCount = (Get-ChildItem -Path $srcDir -Recurse -Include *.ts,*.vue |
    Select-String "fetch\(" | Measure-Object).Count

# Count @deprecated annotations
$deprecatedCount = (Get-ChildItem -Path $srcDir -Recurse -Include *.ts,*.vue |
    Select-String "@deprecated" | Measure-Object).Count

# Count by category
$utilsDeprecated = (Get-ChildItem -Path "$srcDir\utils" -Recurse -Include *.ts,*.vue -ErrorAction SilentlyContinue |
    Select-String "@deprecated" | Measure-Object).Count

$vueDeprecated = (Get-ChildItem -Path $srcDir -Recurse -Include *.vue |
    Select-String "@deprecated" | Measure-Object).Count

$totalApi = $axiosCount + $fetchCount
$completedItems = 24
$totalItems = $totalApi + $deprecatedCount
$remaining = $totalItems - $completedItems
$progress = [math]::Round(($completedItems / $totalItems) * 100, 0)

Write-Host "RESULTS:" -ForegroundColor Green
Write-Host "API calls (axios): $axiosCount" -ForegroundColor White
Write-Host "API calls (fetch): $fetchCount" -ForegroundColor White
Write-Host "Total API calls: $totalApi" -ForegroundColor Yellow
Write-Host "@deprecated types: $deprecatedCount" -ForegroundColor White
Write-Host "Utils deprecated: $utilsDeprecated" -ForegroundColor White  
Write-Host "Vue deprecated: $vueDeprecated" -ForegroundColor White
Write-Host "Total items: $totalItems" -ForegroundColor Yellow
Write-Host "Completed: $completedItems" -ForegroundColor Green
Write-Host "Remaining: $remaining" -ForegroundColor Red
Write-Host "Progress: $progress%" -ForegroundColor Cyan

# List files with most API calls
Write-Host "`nFiles with API calls:" -ForegroundColor Cyan
Get-ChildItem -Path $srcDir -Recurse -Include *.ts,*.vue | 
    Where-Object { $_.FullName -notlike "*plugins\axios.ts" } |
    ForEach-Object {
        $file = $_
        $axiosInFile = (Get-Content $file.FullName | Select-String "axios\." | Measure-Object).Count
        $fetchInFile = (Get-Content $file.FullName | Select-String "fetch\(" | Measure-Object).Count
        $total = $axiosInFile + $fetchInFile
        if ($total -gt 0) {
            $relativePath = $file.FullName -replace [regex]::Escape((Get-Location).Path + "\src\"), "src\"
            Write-Host "  $relativePath : $total calls" -ForegroundColor White
        }
    }

# List files with most @deprecated
Write-Host "`nTop @deprecated files:" -ForegroundColor Cyan
Get-ChildItem -Path $srcDir -Recurse -Include *.ts,*.vue |
    ForEach-Object {
        $file = $_
        $depCount = (Get-Content $file.FullName | Select-String "@deprecated" | Measure-Object).Count
        if ($depCount -gt 0) {
            $relativePath = $file.FullName -replace [regex]::Escape((Get-Location).Path + "\src\"), "src\"
            [PSCustomObject]@{
                File = $relativePath
                Count = $depCount
            }
        }
    } | Sort-Object Count -Descending | Select-Object -First 10 |
    ForEach-Object {
        Write-Host "  $($_.File) : $($_.Count) @deprecated" -ForegroundColor White
    }
