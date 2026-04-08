Set WshShell = CreateObject("WScript.Shell")
WshShell.CurrentDirectory = Replace(WScript.ScriptFullName, "\launcher\START - YouTube Only.vbs", "")
WshShell.Run """C:\Users\Krishna\AppData\Local\Programs\Python\Python314\pythonw.exe"" wealthclaude-processor.py --youtube-only", 0, False
MsgBox "YouTube processor started!" & vbCrLf & vbCrLf & _
       "Runs in background. Use STOP to kill.", _
       vbInformation, "WealthClaude"
