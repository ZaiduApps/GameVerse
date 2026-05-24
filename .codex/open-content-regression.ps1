param(
    [Parameter(Mandatory = $false)]
    [string]$ApiKey = "",

    [Parameter(Mandatory = $false)]
    [string]$BaseUrl = "http://127.0.0.1:9527"
)

$ErrorActionPreference = "Stop"

if ([string]::IsNullOrWhiteSpace($ApiKey)) {
    $ApiKey = $env:OPEN_CONTENT_API_KEY
}

if ([string]::IsNullOrWhiteSpace($ApiKey)) {
    throw "Missing API key. Pass -ApiKey <key> or set OPEN_CONTENT_API_KEY."
}

function Invoke-JsonPost {
    param(
        [Parameter(Mandatory = $true)][string]$Url,
        [Parameter(Mandatory = $true)][hashtable]$Headers,
        [Parameter(Mandatory = $true)][string]$Body
    )

    $response = Invoke-WebRequest -Method Post -Uri $Url -Headers $Headers -Body $Body -ContentType "application/json" -SkipHttpErrorCheck
    $content = $response.Content
    $json = $null
    try {
        $json = $content | ConvertFrom-Json -Depth 20
    }
    catch {
        $json = $null
    }
    return [PSCustomObject]@{
        StatusCode = [int]$response.StatusCode
        Raw = $content
        Json = $json
    }
}

function Invoke-JsonGet {
    param(
        [Parameter(Mandatory = $true)][string]$Url,
        [Parameter(Mandatory = $true)][hashtable]$Headers
    )

    $response = Invoke-WebRequest -Method Get -Uri $Url -Headers $Headers -SkipHttpErrorCheck
    $content = $response.Content
    $json = $null
    try {
        $json = $content | ConvertFrom-Json -Depth 20
    }
    catch {
        $json = $null
    }
    return [PSCustomObject]@{
        StatusCode = [int]$response.StatusCode
        Raw = $content
        Json = $json
    }
}

function Assert-Condition {
    param(
        [Parameter(Mandatory = $true)][bool]$Condition,
        [Parameter(Mandatory = $true)][string]$Message
    )

    if (-not $Condition) {
        throw $Message
    }
}

$timestamp = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
$idem = "post-reg-$timestamp-a1"

$headers = @{
    "X-API-Key" = $ApiKey
}

Write-Host "== Open Content Regression =="
Write-Host "Base URL: $BaseUrl"
Write-Host "Idempotency-Key: $idem"

# 1) First post should succeed with OK
$urlPosts = "$BaseUrl/open/content/posts"
$bodyPost = @{
    post_type = "post"
    title = "回归测试-普通帖子"
    content = "回归测试内容-普通帖子"
} | ConvertTo-Json -Depth 20

$res1 = Invoke-JsonPost -Url $urlPosts -Headers (@{ "X-API-Key" = $ApiKey; "Idempotency-Key" = $idem }) -Body $bodyPost
$res1Code = [string]($res1.Json.code)
$res1InnerCode = [string]($res1.Json.data.code)
Write-Host "[1] status=$($res1.StatusCode) code=$res1Code inner_code=$res1InnerCode"
Assert-Condition (($res1.StatusCode -eq 200) -or ($res1.StatusCode -eq 201)) "[1] Expected HTTP 200/201, got $($res1.StatusCode). Raw: $($res1.Raw)"
Assert-Condition (($res1Code -eq "OK") -or ($res1Code -eq "0") -or ($res1InnerCode -eq "OK")) "[1] Expected success code. Raw: $($res1.Raw)"

# 2) Replay same request should return OK_REPLAY
$res2 = Invoke-JsonPost -Url $urlPosts -Headers (@{ "X-API-Key" = $ApiKey; "Idempotency-Key" = $idem }) -Body $bodyPost
$res2Code = [string]($res2.Json.code)
$res2InnerCode = [string]($res2.Json.data.code)
$res2Replay = [bool]($res2.Json.idempotent_replay -or $res2.Json.data.idempotent_replay)
Write-Host "[2] status=$($res2.StatusCode) code=$res2Code inner_code=$res2InnerCode replay=$res2Replay"
Assert-Condition (($res2.StatusCode -eq 200) -or ($res2.StatusCode -eq 201)) "[2] Expected HTTP 200/201, got $($res2.StatusCode). Raw: $($res2.Raw)"
Assert-Condition (($res2Code -eq "OK_REPLAY") -or ($res2InnerCode -eq "OK_REPLAY") -or $res2Replay) "[2] Expected replay response. Raw: $($res2.Raw)"

# 3) Same idem with different payload should conflict
$bodyConflict = @{
    post_type = "post"
    title = "回归测试-冲突"
    content = "回归测试内容-冲突"
} | ConvertTo-Json -Depth 20

$res3 = Invoke-JsonPost -Url $urlPosts -Headers (@{ "X-API-Key" = $ApiKey; "Idempotency-Key" = $idem }) -Body $bodyConflict
Write-Host "[3] status=$($res3.StatusCode) code=$($res3.Json.code)"
Assert-Condition ($res3.StatusCode -eq 409) "[3] Expected HTTP 409, got $($res3.StatusCode). Raw: $($res3.Raw)"
Assert-Condition ($res3.Json.code -eq "IDEMPOTENCY_KEY_CONFLICT") "[3] Expected code=IDEMPOTENCY_KEY_CONFLICT. Raw: $($res3.Raw)"

# 4) News post should succeed and type=news
$idemNews = "post-reg-$timestamp-news"
$bodyNews = @{
    post_type = "news"
    title = "回归测试-新闻"
    summary = "新闻摘要"
    content = "新闻正文"
} | ConvertTo-Json -Depth 20

$res4 = Invoke-JsonPost -Url $urlPosts -Headers (@{ "X-API-Key" = $ApiKey; "Idempotency-Key" = $idemNews }) -Body $bodyNews
$res4PostType = [string]($res4.Json.data.post_type)
if ([string]::IsNullOrWhiteSpace($res4PostType)) {
    $res4PostType = [string]($res4.Json.data.data.post_type)
}
Write-Host "[4] status=$($res4.StatusCode) code=$($res4.Json.code) post_type=$res4PostType"
Assert-Condition (($res4.StatusCode -eq 200) -or ($res4.StatusCode -eq 201)) "[4] Expected HTTP 200/201, got $($res4.StatusCode). Raw: $($res4.Raw)"
Assert-Condition ($res4PostType -eq "news") "[4] Expected post_type=news. Raw: $($res4.Raw)"

# 5) My posts should be accessible
$urlMyPosts = "$BaseUrl/open/content/my/posts?page=1&pageSize=5"
$res5 = Invoke-JsonGet -Url $urlMyPosts -Headers $headers
$listCount = @($res5.Json.list).Count
Write-Host "[5] status=$($res5.StatusCode) list_count=$listCount"
Assert-Condition ($res5.StatusCode -eq 200) "[5] Expected HTTP 200, got $($res5.StatusCode). Raw: $($res5.Raw)"

Write-Host ""
Write-Host "All regression checks passed."
