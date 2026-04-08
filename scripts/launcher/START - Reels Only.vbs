Set WshShell = CreateObject("WScript.Shell")
WshShell.CurrentDirectory = Replace(WScript.ScriptFullName, "\launcher\START - Reels Only.vbs", "")
WshShell.Run """C:\Users\Krishna\AppData\Local\Programs\Python\Python314\pythonw.exe"" wealthclaude-processor.py --reels-only", 0, False
MsgBox "Instagram Reel processor started!" & vbCrLf & vbCrLf & _
       "Runs in background. Use STOP to kill.", _
       vbInformation, "WealthClaude"
