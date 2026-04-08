Set WshShell = CreateObject("WScript.Shell")
WshShell.Run "taskkill /F /IM pythonw.exe", 0, True
WshShell.Run "cmd /c taskkill /F /FI ""WINDOWTITLE eq WealthClaude*"" 2>nul", 0, True
MsgBox "All processors stopped!", vbInformation, "WealthClaude"
