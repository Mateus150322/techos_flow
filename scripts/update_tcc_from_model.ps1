param(
    [string]$TemplatePath = "c:\Users\VAIO\Desktop\Mateus\O.S de serviço do tcc\TCC FORMATADO 01.docx",
    [string]$SourceHtmlPath = "c:\Users\VAIO\Documents\projetos\techos-flow\docs\TCC_TechOS_Flow_Atualizado_2026.html",
    [string]$OutputDocxPath = "c:\Users\VAIO\Desktop\Mateus\O.S de serviço do tcc\TCC FORMATADO 01 - atualizado 2026.docx",
    [string]$OutputPdfPath = "c:\Users\VAIO\Desktop\Mateus\O.S de serviço do tcc\TCC FORMATADO 01 - atualizado 2026.pdf"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Fix-Mojibake {
    param([string]$Text)

    if ([string]::IsNullOrWhiteSpace($Text)) {
        return $Text
    }

    $encoding1252 = [System.Text.Encoding]::GetEncoding(1252)
    $bytes = $encoding1252.GetBytes($Text)
    return [System.Text.Encoding]::UTF8.GetString($bytes)
}

function Find-Range {
    param(
        [Parameter(Mandatory = $true)]$Document,
        [Parameter(Mandatory = $true)][string]$Text
    )

    $range = $Document.Content
    $find = $range.Find
    $find.ClearFormatting() | Out-Null
    $find.Text = $Text
    $find.Forward = $true
    $find.Wrap = 1
    $find.MatchCase = $false
    $find.MatchWholeWord = $false

    if ($find.Execute()) {
        return $range
    }

    return $null
}

function Replace-First {
    param(
        [Parameter(Mandatory = $true)]$Range,
        [Parameter(Mandatory = $true)][string]$FindText,
        [Parameter(Mandatory = $true)][string]$ReplaceText
    )

    $find = $Range.Find
    $find.ClearFormatting() | Out-Null
    $find.Text = $FindText
    $find.Replacement.ClearFormatting() | Out-Null
    $find.Replacement.Text = $ReplaceText
    $find.Forward = $true
    $find.Wrap = 0
    $find.MatchCase = $false
    $find.MatchWholeWord = $false
    $find.Execute(
        $FindText,
        $false,
        $false,
        $false,
        $false,
        $false,
        $true,
        0,
        $false,
        $ReplaceText,
        1
    ) | Out-Null
}

function Ensure-ParentDirectory {
    param([string]$Path)
    $parent = Split-Path -Parent $Path
    if (-not (Test-Path -LiteralPath $parent)) {
        New-Item -ItemType Directory -Path $parent -Force | Out-Null
    }
}

Ensure-ParentDirectory -Path $OutputDocxPath
Ensure-ParentDirectory -Path $OutputPdfPath

$workspaceDocs = Join-Path (Split-Path -Parent $PSScriptRoot) "docs"
$cleanHtmlPath = Join-Path $workspaceDocs "_tmp_tcc_atualizado_limpo.html"
$workspaceDocxPath = Join-Path $workspaceDocs "TCC_FORMATADO_01_atualizado_2026.docx"
$workspacePdfPath = Join-Path $workspaceDocs "TCC_FORMATADO_01_atualizado_2026.pdf"

$rawHtml = Get-Content -LiteralPath $SourceHtmlPath -Raw
$cleanHtml = Fix-Mojibake -Text $rawHtml
[System.IO.File]::WriteAllText($cleanHtmlPath, $cleanHtml, [System.Text.Encoding]::UTF8)

$word = $null
$templateDocument = $null
$htmlDocument = $null

try {
    $word = New-Object -ComObject Word.Application
    $word.Visible = $false
    $word.DisplayAlerts = 0
    $word.ScreenUpdating = $false

    $templateDocument = $word.Documents.Open($TemplatePath)
    $templateDocument.SaveAs2($OutputDocxPath)
    $templateDocument.SaveAs2($workspaceDocxPath)

    $htmlDocument = $word.Documents.Open($cleanHtmlPath)

    $targetStart = Find-Range -Document $templateDocument -Text "RESUMO"
    if (-not $targetStart) {
        throw "Nao foi possivel localizar o ponto inicial 'RESUMO' no modelo."
    }

    $sourceStart = Find-Range -Document $htmlDocument -Text "Resumo"
    if (-not $sourceStart) {
        throw "Nao foi possivel localizar o ponto inicial 'Resumo' no HTML atualizado."
    }

    $coverRange = $templateDocument.Range(0, $targetStart.Start)
    Replace-First -Range $coverRange -FindText "2025" -ReplaceText "2026"

    $replaceRange = $templateDocument.Range($targetStart.Start, $templateDocument.Content.End)
    $replaceRange.Delete()

    $sourceRange = $htmlDocument.Range($sourceStart.Start, $htmlDocument.Content.End)
    $sourceRange.Copy()

    $insertRange = $templateDocument.Range($targetStart.Start, $targetStart.Start)
    $insertRange.Paste()

    $templateDocument.Save()
    Copy-Item -LiteralPath $OutputDocxPath -Destination $workspaceDocxPath -Force

    $templateDocument.ExportAsFixedFormat($OutputPdfPath, 17)
    Copy-Item -LiteralPath $OutputPdfPath -Destination $workspacePdfPath -Force

    Write-Output "DOCX:$OutputDocxPath"
    Write-Output "PDF:$OutputPdfPath"
    Write-Output "DOCX_WORKSPACE:$workspaceDocxPath"
    Write-Output "PDF_WORKSPACE:$workspacePdfPath"
}
finally {
    if ($htmlDocument -ne $null) {
        $htmlDocument.Close(0)
    }

    if ($templateDocument -ne $null) {
        $templateDocument.Close(0)
    }

    if ($word -ne $null) {
        $word.Quit()
    }

    [System.GC]::Collect()
    [System.GC]::WaitForPendingFinalizers()
}
