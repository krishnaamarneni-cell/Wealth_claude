Set WshShell = CreateObject("WScript.Shell")
WshShell.CurrentDirectory = Replace(WScript.ScriptFullName, "\start-background.vbs", "")
WshShell.Run "pythonw master_processor.py", 0, False
MsgBox "YouTube Processor started in background!" & vbCrLf & vbCrLf & "It will keep running even if you close this window." & vbCrLf & vbCrLf & "To stop it: Open Task Manager > Details > find pythonw.exe > End Task", vbInformation, "WealthClaude"
