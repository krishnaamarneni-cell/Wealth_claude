Set WshShell = CreateObject("WScript.Shell")
WshShell.CurrentDirectory = Replace(WScript.ScriptFullName, "\launcher\START - Reels Only.vbs", "")
WshShell.Run "pythonw wealthclaude-processor.py --reels-only", 0, False
MsgBox "Instagram Reel processor started!" & vbCrLf & vbCrLf & _
       "Runs in background. Use STOP to kill.", _
       vbInformation, "WealthClaude"
