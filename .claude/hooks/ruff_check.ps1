$raw = [Console]::In.ReadToEnd()
try {
    $d = $raw | ConvertFrom-Json
    $f = $d.tool_input.file_path
    if ($f -and $f -like '*.py') {
        $result = & "G:\Dashboard\Dashboard_v001\.venv\Scripts\ruff.exe" check $f 2>&1
        if ($LASTEXITCODE -ne 0) {
            $msg = $result -join "`n"
            @{ hookSpecificOutput = @{ hookEventName = "PostToolUse"; additionalContext = "ruff check: $msg" } } | ConvertTo-Json -Compress
        }
    }
} catch {}
