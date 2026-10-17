Set files = CreateObject("Scripting.FileSystemObject")
Set shell = CreateObject("WScript.Shell")
root = files.GetParentFolderName(WScript.ScriptFullName)
launcherPath = files.BuildPath(root, "Invoke-CodexStartup.ps1")
If files.FileExists(launcherPath) Then
  shell.Run "powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -STA -WindowStyle Hidden -File " & Chr(34) & launcherPath & Chr(34), 0, False
Else
  shell.Run "explorer.exe shell:AppsFolder\OpenAI.Codex_2p2nqsd0c76g0!App", 1, False
End If
