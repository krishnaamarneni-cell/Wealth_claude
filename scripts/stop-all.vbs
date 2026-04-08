Set WshShell = CreateObject("WScript.Shell")

' Kill all pythonw.exe processes (background processors)
WshShell.Run "taskkill /F /IM pythonw.exe", 0, True

' Also kill any python.exe running our scripts
WshShell.Run "cmd /c taskkill /F /FI ""WINDOWTITLE eq WealthClaude*"" 2>nul", 0, True

MsgBox "All WealthClaude processors stopped!" & vbCrLf & vbCrLf & _
       "To restart: Double-click start-all-background.vbs", _
       vbInformation, "WealthClaude"
