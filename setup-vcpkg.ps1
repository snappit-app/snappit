param(
    [Parameter(ValueFromRemainingArguments = $true)]
    [string[]]$Command
)

$ErrorActionPreference = "Stop"

function Add-ToPathOnce {
    param([string]$Dir)
    if ([string]::IsNullOrWhiteSpace($Dir)) {
        return
    }

    if (!(Test-Path $Dir)) {
        return
    }

    if ($env:PATH -notlike "*$Dir*") {
        $env:PATH = "$Dir;$env:PATH"
    }
}

$vcpkgRoot = if ($env:VCPKG_ROOT) { $env:VCPKG_ROOT } else { "C:\vcpkg" }
$env:VCPKG_ROOT = $vcpkgRoot
$env:VCPKG_DEFAULT_TRIPLET = if ($env:VCPKG_DEFAULT_TRIPLET) { $env:VCPKG_DEFAULT_TRIPLET } else { "x64-windows" }
$env:VCPKGRS_DYNAMIC = "true"

$vcpkgBin = Join-Path $env:VCPKG_ROOT "installed\$($env:VCPKG_DEFAULT_TRIPLET)\bin"
Add-ToPathOnce -Dir $vcpkgBin

$clangSearchPaths = @(
    $env:LIBCLANG_PATH,
    "C:\Program Files\LLVM\bin",
    "C:\Program Files\Microsoft Visual Studio\2022\Community\VC\Tools\Llvm\x64\bin",
    "C:\Program Files\Microsoft Visual Studio\2022\BuildTools\VC\Tools\Llvm\x64\bin",
    "C:\Program Files\Microsoft Visual Studio\2022\Professional\VC\Tools\Llvm\x64\bin",
    "C:\Program Files\Microsoft Visual Studio\2022\Enterprise\VC\Tools\Llvm\x64\bin"
) | Where-Object { $_ }

$clangCandidates = @(
    $clangSearchPaths | Where-Object {
        (Test-Path (Join-Path $_ "libclang.dll")) -or
        (Test-Path (Join-Path $_ "clang.dll"))
    }
)

if ($clangCandidates.Count -gt 0) {
    $env:LIBCLANG_PATH = $clangCandidates | Select-Object -First 1
    Add-ToPathOnce -Dir $env:LIBCLANG_PATH
} else {
    Write-Warning "clang.dll/libclang.dll was not found. Install LLVM and set LIBCLANG_PATH."
}

if (!$Command -or $Command.Count -eq 0) {
    Write-Host "Environment configured for Windows OCR build."
    Write-Host "VCPKG_ROOT=$env:VCPKG_ROOT"
    Write-Host "VCPKG_DEFAULT_TRIPLET=$env:VCPKG_DEFAULT_TRIPLET"
    Write-Host "VCPKGRS_DYNAMIC=$env:VCPKGRS_DYNAMIC"
    Write-Host "LIBCLANG_PATH=$env:LIBCLANG_PATH"
    exit 0
}

$cmd = $Command[0]
$args = @()
if ($Command.Count -gt 1) {
    $args = $Command[1..($Command.Count - 1)]
}

& $cmd @args
exit $LASTEXITCODE
