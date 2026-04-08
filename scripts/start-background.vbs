Set WshShell = CreateObject("WScript.Shell")
WshShell.CurrentDirectory = Replace(WScript.ScriptFullName, "\start-background.vbs", "")
WshShell.Run """C:\Users\Krishna\AppData\Local\Programs\Python\Python314\pythonw.exe"" video-processor.py --loop", 0, False
MsgBox "Video Processor started in background!" & vbCrLf & vbCrLf & "To stop it: Double-click stop-all.vbs", vbInformation, "WealthClaude"
