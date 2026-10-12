$ErrorActionPreference = "Stop"
$vcvars = "C:\Program Files (x86)\Microsoft Visual Studio\2022\BuildTools\VC\Auxiliary\Build\vcvars64.bat"
if (-not (Test-Path $vcvars)) {
    Write-Error "Visual Studio Build Tools vcvars64.bat not found."
}
$scons = "python -m SCons platform=windows target=template_debug arch=x86_64 -j$env:NUMBER_OF_PROCESSORS"
cmd.exe /c "`"$vcvars`" && $scons"
