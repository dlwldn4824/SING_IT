param(
  [ValidateRange(1, 65535)]
  [int]$Port = 8080
)

$python = Get-Command python -ErrorAction SilentlyContinue
if ($python) {
  & $python.Source -m http.server $Port
  exit $LASTEXITCODE
}

$launcher = Get-Command py -ErrorAction SilentlyContinue
if ($launcher) {
  & $launcher.Source -m http.server $Port
  exit $LASTEXITCODE
}

throw "Python 3가 필요합니다. 설치 후 다시 실행하세요."
