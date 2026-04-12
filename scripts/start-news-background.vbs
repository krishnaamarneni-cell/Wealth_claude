Set WshShell = CreateObject("WScript.Shell")
WshShell.CurrentDirectory = Replace(WScript.ScriptFullName, "\start-news-background.vbs", "")
WshShell.Run """C:\Users\Krishna\AppData\Local\Programs\Python\Python314\pythonw.exe"" news-image-processor.py --fetch --loop", 0, False
MsgBox "News Image Processor started in background!" & vbCrLf & vbCrLf & "To stop: use Task Manager or stop-all.vbs", vbInformation, "WealthClaude"
