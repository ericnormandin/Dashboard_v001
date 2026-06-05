$raw = [Console]::In.ReadToEnd()
try {
    $d = $raw | ConvertFrom-Json
    $f = $d.tool_input.file_path
    if ($f -and $f -like '*.py') {
        & "G:\Dashboard\Dashboard_v001\.venv\Scripts\ruff.exe" format $f 2>&1 | Out-Null
    }
} catch {}
