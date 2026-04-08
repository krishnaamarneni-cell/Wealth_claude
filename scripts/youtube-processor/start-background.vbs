Set WshShell = CreateObject("WScript.Shell")
WshShell.CurrentDirectory = Replace(WScript.ScriptFullName, "\start-background.vbs", "")
WshShell.Run """C:\Users\Krishna\AppData\Local\Programs\Python\Python314\pythonw.exe"" master_processor.py", 0, False
MsgBox "YouTube Processor started in background!" & vbCrLf & vbCrLf & "To stop it: Double-click stop-all.vbs in launcher folder", vbInformation, "WealthClaude"
