# Comprehensive Migration Analysis Script
# Analyzes all axios calls, @deprecated types, and maps them to available Zodios endpoints

Write-Host "=== COMPREHENSIVE MIGRATION ANALYSIS ===" -ForegroundColor Cyan
Write-Host "Scanning for all deprecated code and API calls..." -ForegroundColor Yellow

$srcDir = ".\src"
$apiFile = "$srcDir\api\generated\api.ts"

# Function to extract Zodios endpoint names from api.ts
function Get-ZodiosEndpoints {
    if (Test-Path $apiFile) {
        try {
            $apiContent = Get-Content $apiFile -Raw
            if (-not $apiContent) {
                Write-Host "Warning: API file is empty" -ForegroundColor Yellow
                return @()
            }
            
            $endpoints = @()
            
            # Look for endpoint definitions more broadly
            $endpointMatches = [regex]::Matches($apiContent, "alias:\s*['""]([^'""]+)['""]")
            foreach ($match in $endpointMatches) {
                $endpoints += $match.Groups[1].Value
            }
            
            return $endpoints
        }
        catch {
            Write-Host "Error reading API file: $_" -ForegroundColor Red
            return @()
        }
    }
    return @()
}

# Get all available Zodios endpoints
$zodiosEndpoints = Get-ZodiosEndpoints
Write-Host "Found $($zodiosEndpoints.Count) Zodios endpoints" -ForegroundColor Green

# Analyze axios calls
Write-Host "`n=== AXIOS CALLS ANALYSIS ===" -ForegroundColor Cyan
$axiosFiles = @()
Get-ChildItem -Path $srcDir -Recurse -Include *.ts,*.vue | 
    Where-Object { $_.FullName -notlike "*plugins\axios.ts" } |
    ForEach-Object {
        $file = $_
        try {
            $content = Get-Content $file.FullName -Raw -ErrorAction SilentlyContinue
            if (-not $content) {
                return  # Skip empty files
            }
            
            $axiosMatches = [regex]::Matches($content, "axios\.(get|post|put|patch|delete)\s*\([^)]*\)")
            
            if ($axiosMatches.Count -gt 0) {
                foreach ($match in $axiosMatches) {
                    $relativePath = $file.FullName -replace [regex]::Escape((Get-Location).Path + "\src\"), "src\"
                    $lineNumber = ($content.Substring(0, $match.Index) -split "`n").Count
                    
                    # Extract URL from the axios call - enhanced
                    $url = "axios call"
                    $fullUrl = "Unknown"
                    
                    # Try to extract URL patterns
                    if ($match.Value -match "'/[^']*'") {
                        $url = $matches[0] -replace "'", ""
                        $fullUrl = $url
                    } elseif ($match.Value -match '"/[^"]*"') {
                        $url = $matches[0] -replace '"', ''
                        $fullUrl = $url
                    } elseif ($match.Value -match '`/[^`]*`') {
                        $url = $matches[0] -replace '`', ''
                        $fullUrl = $url
                    } elseif ($match.Value -match '\$\{[^}]*\}') {
                        # Template literal URLs
                        $fullUrl = $match.Value
                        if ($match.Value -match '/[^/\$`"'']*') {
                            $url = $matches[0]
                        }
                    }
                    
                    # Determine if Zodios endpoint might be available
                    $potentialEndpoint = ""
                    $zodiosAvailable = $false
                    
                    # Check for specific known mappings first
                    $knownMappings = @{
                        "/job/rest/jobs/files/upload/" = "uploadJobFilesRest"
                        "/api/company-defaults/" = "api_company_defaults_retrieve"
                        "/system-errors" = "xero_errors_list"
                        "/api/xero/" = ""  # No Zodios endpoint for Xero custom endpoints
                        "/job/rest/jobs/toggle-complex/" = ""  # No Zodios endpoint
                        "/django-jobs/" = "quoting_api_django_jobs_list"
                        "/django-job-executions/" = "quoting_api_django_job_executions_list"
                    }
                    
                    foreach ($mapping in $knownMappings.GetEnumerator()) {
                        if ($url -like "*$($mapping.Key)*" -and $mapping.Value -ne "") {
                            $potentialEndpoint = $mapping.Value
                            $zodiosAvailable = $true
                            break
                        }
                    }
                    
                    # If no direct mapping found, try pattern matching
                    if (-not $zodiosAvailable) {
                        foreach ($endpoint in $zodiosEndpoints) {
                            $endpointPath = $endpoint -replace '_', '/'
                            # More flexible matching
                            if ($url -match "job.*rest.*files" -and $endpoint -match "JobFiles") {
                                $potentialEndpoint = $endpoint
                                $zodiosAvailable = $true
                                break
                            }
                            elseif ($url -match "staff" -and $endpoint -match "staff") {
                                $potentialEndpoint = $endpoint
                                $zodiosAvailable = $true
                                break
                            }
                            elseif ($url -match "timesheet" -and $endpoint -match "timesheet") {
                                $potentialEndpoint = $endpoint
                                $zodiosAvailable = $true
                                break
                            }
                        }
                    }
                    
                    $axiosFiles += [PSCustomObject]@{
                        File = $relativePath
                        Line = $lineNumber
                        Method = $match.Groups[1].Value.ToUpper()
                        Call = $match.Value
                        URL = $url
                        FullURL = $fullUrl
                        ZodiosAvailable = $zodiosAvailable
                        PotentialEndpoint = $potentialEndpoint
                        Priority = if ($zodiosAvailable) { "HIGH" } else { "MANUAL" }
                    }
                }
            }
        }
        catch {
            Write-Host "Error processing file $($file.FullName): $_" -ForegroundColor Red
        }
    }

Write-Host "Found $($axiosFiles.Count) axios calls" -ForegroundColor Yellow

# Analyze fetch calls
Write-Host "`n=== FETCH CALLS ANALYSIS ===" -ForegroundColor Cyan
$fetchFiles = @()
Get-ChildItem -Path $srcDir -Recurse -Include *.ts,*.vue |
    ForEach-Object {
        $file = $_
        try {
            $content = Get-Content $file.FullName -Raw -ErrorAction SilentlyContinue
            if (-not $content) {
                return  # Skip empty files
            }
            
            $fetchMatches = [regex]::Matches($content, "fetch\s*\([^)]*\)")
            
            if ($fetchMatches.Count -gt 0) {
                foreach ($match in $fetchMatches) {
                    $relativePath = $file.FullName -replace [regex]::Escape((Get-Location).Path + "\src\"), "src\"
                    $lineNumber = ($content.Substring(0, $match.Index) -split "`n").Count
                    
                    $fetchFiles += [PSCustomObject]@{
                        File = $relativePath
                        Line = $lineNumber
                        Call = $match.Value
                        Priority = "HIGH"
                        Status = "Replace with Zodios"
                    }
                }
            }
        }
        catch {
            Write-Host "Error processing file $($file.FullName): $_" -ForegroundColor Red
        }
    }

Write-Host "Found $($fetchFiles.Count) fetch calls" -ForegroundColor Yellow

# Analyze @deprecated annotations
Write-Host "`n=== @DEPRECATED ANALYSIS ===" -ForegroundColor Cyan
$deprecatedFiles = @()
Get-ChildItem -Path $srcDir -Recurse -Include *.ts,*.vue |
    ForEach-Object {
        $file = $_
        $content = Get-Content $file.FullName
        $deprecatedLines = @()
        
        for ($i = 0; $i -lt $content.Count; $i++) {
            if ($content[$i] -match "@deprecated") {
                $relativePath = $file.FullName -replace [regex]::Escape((Get-Location).Path + "\src\"), "src\"
                    # Extract type/interface name from the deprecated context
                    $typeName = ""
                    if ($content[$i + 1] -match "^(export\s+)?(interface\s+|type\s+|const\s+)([A-Za-z][A-Za-z0-9_]*)" ) {
                        $typeName = $matches[3]
                    }
                    
                    $deprecatedLines += [PSCustomObject]@{
                        File = $relativePath
                        Line = $i + 1
                        Content = $content[$i].Trim()
                        Context = if ($i + 1 -lt $content.Count) { $content[$i + 1].Trim() } else { "" }
                        TypeName = $typeName
                        Category = if ($typeName -match "(Service|Store|Composable)") { "Service" } 
                                  elseif ($typeName -match "(Component|View|Modal)") { "Component" }
                                  else { "Type" }
                    }
            }
        }
        
        if ($deprecatedLines.Count -gt 0) {
            $deprecatedFiles += $deprecatedLines
        }
    }

Write-Host "Found $($deprecatedFiles.Count) @deprecated annotations" -ForegroundColor Yellow

# Group deprecated by file
$deprecatedByFile = $deprecatedFiles | Group-Object File | Sort-Object Count -Descending

# Create comprehensive report
$reportContent = @"
# DEPRECATED CODE MIGRATION REPORT

## Executive Summary

**CRITICAL**: Complete migration from Axios + manual interfaces to Zodios + Zod schemas required.

| Category | Total Found | Migrated | Remaining | Progress |
|----------|-------------|----------|-----------|----------|
| Axios API calls | $($axiosFiles.Count) | 0 | $($axiosFiles.Count) | 0% |
| Fetch API calls | $($fetchFiles.Count) | 0 | $($fetchFiles.Count) | 0% |
| @deprecated types | $($deprecatedFiles.Count) | 24 | $($deprecatedFiles.Count - 24) | $([math]::Round(24 / $deprecatedFiles.Count * 100, 1))% |
| **TOTAL ITEMS** | **$($axiosFiles.Count + $fetchFiles.Count + $deprecatedFiles.Count)** | **24** | **$($axiosFiles.Count + $fetchFiles.Count + $deprecatedFiles.Count - 24)** | **$([math]::Round(24 / ($axiosFiles.Count + $fetchFiles.Count + $deprecatedFiles.Count) * 100, 1))%** |

## Available Zodios Endpoints ($($zodiosEndpoints.Count) total)

"@

# Add Zodios endpoints list
$reportContent += "`n### Generated API Endpoints`n"
foreach ($endpoint in $zodiosEndpoints | Sort-Object) {
    $reportContent += "- ``$endpoint```n"
}

# Add axios calls analysis
$readyToMigrate = ($axiosFiles | Where-Object { $_.ZodiosAvailable }).Count
$manualMigration = ($axiosFiles | Where-Object { -not $_.ZodiosAvailable }).Count

$reportContent += "`n## Migration Readiness Summary`n`n"
$reportContent += "| Migration Type | Count | Percentage |`n"
$reportContent += "|----------------|-------|------------|`n"
$reportContent += "| **Ready for Zodios** | $readyToMigrate | $([math]::Round($readyToMigrate / $axiosFiles.Count * 100, 1))% |`n"
$reportContent += "| **Manual Migration** | $manualMigration | $([math]::Round($manualMigration / $axiosFiles.Count * 100, 1))% |`n"
$reportContent += "| **Total Axios Calls** | $($axiosFiles.Count) | 100% |`n"

$reportContent += "`n## Axios Calls Requiring Migration ($($axiosFiles.Count) total)`n`n"
$reportContent += "| File | Line | Method | URL | Zodios Available | Status |`n"
$reportContent += "|------|------|--------|-----|------------------|--------|`n"

foreach ($call in $axiosFiles | Sort-Object File, Line) {
    $zodiosStatus = if ($call.ZodiosAvailable) { "✅ YES" } else { "❌ NO" }
    $migrationStatus = if ($call.ZodiosAvailable) { "🔄 Ready" } else { "⚠️ Manual" }
    $endpoint = if ($call.PotentialEndpoint) { " ($($call.PotentialEndpoint))" } else { "" }
    
    $reportContent += "| ``$($call.File)`` | $($call.Line) | $($call.Method) | ``$($call.URL)`` | $zodiosStatus$endpoint | $migrationStatus |`n"
}

# Add fetch calls analysis
if ($fetchFiles.Count -gt 0) {
    $reportContent += "`n## Fetch Calls Requiring Migration ($($fetchFiles.Count) total)`n`n"
    $reportContent += "| File | Line | Call | Status |`n"
    $reportContent += "|------|------|------|--------|`n"
    
    foreach ($call in $fetchFiles | Sort-Object File, Line) {
        $reportContent += "| ``$($call.File)`` | $($call.Line) | ``$($call.Call)`` | 🔄 Replace with Zodios |`n"
    }
}

# Add deprecated types analysis
$reportContent += "`n## @deprecated Types by File ($($deprecatedFiles.Count) total)`n`n"
$reportContent += "| File | Count | Sample Deprecated Items | Priority |`n"
$reportContent += "|------|-------|-------------------------|----------|`n"

foreach ($group in $deprecatedByFile | Select-Object -First 20) {
    $sampleItems = ($group.Group | Select-Object -First 3 | ForEach-Object { $_.Context -replace "^(export\s+)?(interface\s+|type\s+|const\s+)", "" -replace "\s*{.*", "" -replace "\s*=.*", "" }).Trim() -join ", "
    $priority = switch ($group.Count) {
        { $_ -ge 10 } { "HIGH" }
        { $_ -ge 5 } { "MEDIUM" }
        default { "LOW" }
    }
    $reportContent += "| ``$($group.Name)`` | $($group.Count) | ``$sampleItems`` | $priority |`n"
}

# Add action plan
$reportContent += @"

## Migration Action Plan

### Phase 1: API Calls Migration (Priority: CRITICAL)
1. **Immediate**: Replace axios calls that have Zodios endpoints available
2. **Manual**: Handle file uploads and custom endpoints not in OpenAPI spec
3. **Remove**: All manual ``response.data`` parsing and fallback logic

### Phase 2: Type Migration (Priority: HIGH)  
1. **Import**: Use generated schemas from ``@/api/generated/api``
2. **Extend**: Create local schemas in ``@/api/local/schemas`` for UI-specific types
3. **Replace**: All manual interfaces with ``z.infer<typeof XxxSchema>``

### Phase 3: Validation (Priority: MEDIUM)
1. **Test**: All migrated endpoints work correctly
2. **Verify**: Type safety is maintained
3. **Clean**: Remove all deprecated code

### Files Requiring Immediate Attention

#### High Priority (Many API calls + deprecated types)
"@

# Add high priority files
$highPriorityFiles = @()
foreach ($axiosCall in $axiosFiles) {
    $deprecatedGroup = $deprecatedByFile | Where-Object { $_.Name -eq $axiosCall.File }
    $deprecatedCount = if ($deprecatedGroup) { $deprecatedGroup.Count } else { 0 }
    if ($deprecatedCount -gt 0) {
        $existing = $highPriorityFiles | Where-Object { $_.File -eq $axiosCall.File }
        if ($existing) {
            $existing.ApiCalls++
        } else {
            $highPriorityFiles += [PSCustomObject]@{
                File = $axiosCall.File
                ApiCalls = 1
                DeprecatedTypes = $deprecatedCount
                TotalIssues = 1 + $deprecatedCount
            }
        }
    }
}

$highPriorityFiles = $highPriorityFiles | Sort-Object TotalIssues -Descending

foreach ($file in $highPriorityFiles | Select-Object -First 10) {
    $reportContent += "- ``$($file.File)`` - $($file.ApiCalls) API calls + $($file.DeprecatedTypes) deprecated types = $($file.TotalIssues) total issues`n"
}

$reportContent += @"

#### API-Only Files (No deprecated types)
"@

$apiOnlyFiles = $axiosFiles | Where-Object { 
    $file = $_.File
    -not ($deprecatedByFile | Where-Object { $_.Name -eq $file })
} | Group-Object File | Sort-Object Count -Descending

foreach ($group in $apiOnlyFiles | Select-Object -First 5) {
    $reportContent += "- ``$($group.Name)`` - $($group.Count) API calls`n"
}

$reportContent += @"

## Next Steps

1. **RUN**: ``npm run type-check`` to verify current state
2. **MIGRATE**: Start with highest priority files
3. **TEST**: Each file after migration
4. **UPDATE**: This report as progress is made

---
*Generated on: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')*
*Zodios endpoints available: $($zodiosEndpoints.Count)*
*Total migration items: $($axiosFiles.Count + $fetchFiles.Count + $deprecatedFiles.Count)*
"@

# Save the report
$reportPath = "DEPRECATED_REPORT.md"
$reportContent | Out-File -FilePath $reportPath -Encoding UTF8

Write-Host "`n=== REPORT GENERATED ===" -ForegroundColor Green
Write-Host "Report saved to: $reportPath" -ForegroundColor White
Write-Host "Total axios calls: $($axiosFiles.Count)" -ForegroundColor Yellow
Write-Host "Total fetch calls: $($fetchFiles.Count)" -ForegroundColor Yellow  
Write-Host "Total @deprecated: $($deprecatedFiles.Count)" -ForegroundColor Yellow
Write-Host "Zodios endpoints: $($zodiosEndpoints.Count)" -ForegroundColor Green
Write-Host "TOTAL MIGRATION ITEMS: $($axiosFiles.Count + $fetchFiles.Count + $deprecatedFiles.Count)" -ForegroundColor Red

# Export detailed data for further analysis
$apiOnlyFiles = $axiosFiles | Where-Object { 
    $file = $_.File
    -not ($deprecatedByFile | Where-Object { $_.Name -eq $file })
} | Group-Object File | Sort-Object Count -Descending

$detailedData = @{
    AxiosCalls = $axiosFiles
    FetchCalls = $fetchFiles  
    DeprecatedTypes = $deprecatedFiles
    ZodiosEndpoints = $zodiosEndpoints
    HighPriorityFiles = $highPriorityFiles
    ApiOnlyFiles = $apiOnlyFiles
    Summary = @{
        TotalAxiosCalls = $axiosFiles.Count
        ReadyToMigrate = $readyToMigrate
        ManualMigration = $manualMigration
        TotalDeprecated = $deprecatedFiles.Count
        TotalZodiosEndpoints = $zodiosEndpoints.Count
        TotalMigrationItems = $axiosFiles.Count + $fetchFiles.Count + $deprecatedFiles.Count
    }
}

$detailedData | ConvertTo-Json -Depth 10 | Out-File -FilePath "migration-analysis-data.json" -Encoding UTF8
Write-Host "Detailed data exported to: migration-analysis-data.json" -ForegroundColor Cyan
