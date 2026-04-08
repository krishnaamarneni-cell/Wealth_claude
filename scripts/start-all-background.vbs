Set WshShell = CreateObject("WScript.Shell")
WshShell.CurrentDirectory = Replace(WScript.ScriptFullName, "\start-all-background.vbs", "")
WshShell.Run "pythonw wealthclaude-processor.py", 0, False
MsgBox "WealthClaude Processor started in background!" & vbCrLf & vbCrLf & _
       "Running:" & vbCrLf & _
       "  - Instagram Reel Processor" & vbCrLf & _
       "  - YouTube Video Processor" & vbCrLf & vbCrLf & _
       "It runs even after closing this window." & vbCrLf & vbCrLf & _
       "To STOP: Task Manager > Details > pythonw.exe > End Task", _
       vbInformation, "WealthClaude"
