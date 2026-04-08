Set WshShell = CreateObject("WScript.Shell")
WshShell.CurrentDirectory = Replace(WScript.ScriptFullName, "\launcher\START - All Processors.vbs", "")
WshShell.Run """C:\Users\Krishna\AppData\Local\Programs\Python\Python314\pythonw.exe"" wealthclaude-processor.py", 0, False
MsgBox "Both processors started!" & vbCrLf & vbCrLf & _
       "  Instagram Reels" & vbCrLf & _
       "  YouTube Videos" & vbCrLf & vbCrLf & _
       "Runs in background. Use STOP to kill.", _
       vbInformation, "WealthClaude"
