Set WshShell = CreateObject("WScript.Shell")
WshShell.CurrentDirectory = Replace(WScript.ScriptFullName, "\start-all-background.vbs", "")
WshShell.Run """C:\Users\Krishna\AppData\Local\Programs\Python\Python314\pythonw.exe"" wealthclaude-processor.py", 0, False
MsgBox "WealthClaude Processor started in background!" & vbCrLf & vbCrLf & _
       "Running:" & vbCrLf & _
       "  - Instagram Reel Processor" & vbCrLf & _
       "  - YouTube Video Processor" & vbCrLf & vbCrLf & _
       "It runs even after closing this window." & vbCrLf & vbCrLf & _
       "To STOP: Double-click stop-all.vbs or launcher/STOP", _
       vbInformation, "WealthClaude"
