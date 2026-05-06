$processIds = netstat -ano |
  Select-String "LISTENING" |
  Where-Object { $_.Line -match "(:|\[::\]:)3000\s" } |
  ForEach-Object { ($_ -split "\s+")[-1] } |
  Select-Object -Unique

if (-not $processIds) {
  Write-Host "No process is using port 3000."
  exit 0
}

foreach ($processId in $processIds) {
  $process = Get-Process -Id $processId -ErrorAction SilentlyContinue

  if ($process) {
    Write-Host "Stopping $($process.ProcessName) process $processId on port 3000..."

    try {
      Stop-Process -Id $processId -ErrorAction Stop
    } catch {
      Write-Host "Could not stop process $processId. Close the terminal running it, or stop it from Task Manager."
      exit 1
    }
  }
}
