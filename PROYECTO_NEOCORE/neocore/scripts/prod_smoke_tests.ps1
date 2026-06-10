param(
  [string]$ApiBaseUrl = "https://api.neocoree.xyz",
  [string]$ClientPassword = ("QA!" + [guid]::NewGuid().ToString("N").Substring(0, 16)),
  [string]$ProfessionalEmail = "",
  [string]$ProfessionalPassword = "",
  [string]$AdminEmail = "",
  [string]$AdminPassword = "",
  [int]$BulkRegisterAttempts = 0
)

$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

function Write-Step($msg) {
  Write-Host "`n=== $msg ===" -ForegroundColor Cyan
}

function Try-InvokeJson($method, $url, $headers = $null, $body = $null) {
  try {
    if ($null -ne $body) {
      $json = ($body | ConvertTo-Json -Depth 8)
      return Invoke-RestMethod -Method $method -Uri $url -Headers $headers -ContentType "application/json" -Body $json -TimeoutSec 30
    }
    return Invoke-RestMethod -Method $method -Uri $url -Headers $headers -TimeoutSec 30
  } catch {
    $status = "N/A"
    try { $status = [int]$_.Exception.Response.StatusCode.value__ } catch {}
    throw "HTTP $status en $method $url -> $($_.Exception.Message)"
  }
}

$result = [ordered]@{
  timestamp_utc = (Get-Date).ToUniversalTime().ToString("o")
  api_base_url = $ApiBaseUrl
  health = ""
  client_user = ""
  booking_id = $null
  booking_status = ""
  professional_confirm = "SKIPPED"
  admin_stats = "SKIPPED"
  bulk_register = @()
}

Write-Step "1) Health check"
$health = Try-InvokeJson "GET" "$ApiBaseUrl/api/health/"
$result.health = $health.status
Write-Host "API health: $($health.status)"

Write-Step "2) Registro cliente"
$rand = Get-Random -Minimum 10000 -Maximum 99999
$clientEmail = "qa.client.$rand@example.com"
$registerBody = @{
  email = $clientEmail
  password1 = $ClientPassword
  password2 = $ClientPassword
  first_name = "QA"
  last_name = "Client$rand"
  phone = "+34612$rand"
  gdpr_consent = $true
}
$registerResp = Try-InvokeJson "POST" "$ApiBaseUrl/api/auth/register/" $null $registerBody
$result.client_user = $clientEmail
Write-Host "Cliente creado: $clientEmail"

Write-Step "3) Login cliente"
$loginResp = Try-InvokeJson "POST" "$ApiBaseUrl/api/auth/login/" $null @{ email = $clientEmail; password = $ClientPassword }
$clientAccess = $loginResp.access
$authHeader = @{ Authorization = "Bearer $clientAccess" }
Write-Host "Login cliente OK"

Write-Step "4) Obtener servicios y profesionales"
$servicesResp = Try-InvokeJson "GET" "$ApiBaseUrl/api/services/" $authHeader
$services = @()
if ($servicesResp.results) { $services = $servicesResp.results } else { $services = $servicesResp }
if (-not $services -or $services.Count -eq 0) { throw "No hay servicios disponibles" }
$service = $services[0]

$professionals = Try-InvokeJson "GET" "$ApiBaseUrl/api/auth/users/professionals/"
if (-not $professionals -or $professionals.Count -eq 0) { throw "No hay profesionales disponibles" }
$professional = $professionals[0]

Write-Host "Servicio usado: $($service.name)"
Write-Host "Profesional usado: $($professional.full_name)"

Write-Step "5) Buscar slots"
$startDate = (Get-Date).AddDays(1).ToString("yyyy-MM-dd")
$endDate = (Get-Date).AddDays(7).ToString("yyyy-MM-dd")
$slotsResp = Try-InvokeJson "GET" "$ApiBaseUrl/api/availability/slots/get_slots/?professional_id=$($professional.id)&service_duration=$($service.duration_minutes)&start_date=$startDate&end_date=$endDate"
if (-not $slotsResp.slots -or $slotsResp.slots.Count -eq 0) { throw "No hay slots disponibles" }
$slot = $slotsResp.slots[0]

Write-Step "6) Crear reserva"
$bookingBody = @{
  service = $service.id
  professional = $professional.id
  start_datetime = $slot.start_datetime
  end_datetime = $slot.end_datetime
  client_notes = "Reserva QA automatizada"
}
$bookingResp = Try-InvokeJson "POST" "$ApiBaseUrl/api/bookings/" $authHeader $bookingBody
$result.booking_id = $bookingResp.id
$result.booking_status = $bookingResp.status
Write-Host "Reserva creada: #$($bookingResp.id) estado=$($bookingResp.status)"

if ($ProfessionalEmail -and $ProfessionalPassword) {
  Write-Step "7) Confirmar reserva como profesional"
  $proLogin = Try-InvokeJson "POST" "$ApiBaseUrl/api/auth/login/" $null @{ email = $ProfessionalEmail; password = $ProfessionalPassword }
  $proHeader = @{ Authorization = "Bearer $($proLogin.access)" }
  $confirmResp = Try-InvokeJson "POST" "$ApiBaseUrl/api/bookings/$($bookingResp.id)/confirm/" $proHeader @{}
  $result.professional_confirm = "OK:$($confirmResp.status)"
  Write-Host "Reserva confirmada por profesional: $($confirmResp.status)"
}

if ($AdminEmail -and $AdminPassword) {
  Write-Step "8) Ver stats como admin"
  $adminLogin = Try-InvokeJson "POST" "$ApiBaseUrl/api/auth/login/" $null @{ email = $AdminEmail; password = $AdminPassword }
  $adminHeader = @{ Authorization = "Bearer $($adminLogin.access)" }
  $stats = Try-InvokeJson "GET" "$ApiBaseUrl/api/bookings/stats/?days=30" $adminHeader
  $result.admin_stats = "OK: total=$($stats.total_bookings)"
  Write-Host "Admin stats OK. Total bookings: $($stats.total_bookings)"
}

if ($BulkRegisterAttempts -gt 0) {
  Write-Step "9) Bulk register controlado"
  for ($i = 1; $i -le $BulkRegisterAttempts; $i++) {
    $e = "qa.bulk.$i.$rand@example.com"
    $body = @{
      email = $e
      password1 = $ClientPassword
      password2 = $ClientPassword
      first_name = "Bulk"
      last_name = "User$i"
      phone = "+34613$rand"
      gdpr_consent = $true
    }
    try {
      $null = Try-InvokeJson "POST" "$ApiBaseUrl/api/auth/register/" $null $body
      $result.bulk_register += "attempt=$i status=201"
    } catch {
      $result.bulk_register += "attempt=$i error=$($_.Exception.Message)"
    }
  }
}

Write-Step "RESULTADO"
$result | ConvertTo-Json -Depth 8
