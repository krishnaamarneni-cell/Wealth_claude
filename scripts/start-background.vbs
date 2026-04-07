Set WshShell = CreateObject("WScript.Shell")
WshShell.Run "pythonw """ & Replace(WScript.ScriptFullName, "start-background.vbs", "video-processor.py") & """ --loop", 0, False
MsgBox "Video Processor started in background!" & vbCrLf & vbCrLf & "To stop it: Open Task Manager > Details > find pythonw.exe > End Task", vbInformation, "WealthClaude"
