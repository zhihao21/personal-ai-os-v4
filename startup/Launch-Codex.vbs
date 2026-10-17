Set files = CreateObject("Scripting.FileSystemObject")
Set shell = CreateObject("WScript.Shell")
root = files.GetParentFolderName(WScript.ScriptFullName)
nodePath = files.GetAbsolutePathName(files.BuildPath(root, "..\..\.tools\node-v24.20.0-win-x64\node.exe"))
launcherPath = files.BuildPath(root, "codex-launcher.mjs")
If files.FileExists(nodePath) And files.FileExists(launcherPath) Then
  shell.Run Chr(34) & nodePath & Chr(34) & " " & Chr(34) & launcherPath & Chr(34), 0, False
Else
  shell.Run "explorer.exe shell:AppsFolder\OpenAI.Codex_2p2nqsd0c76g0!App", 1, False
End If
