# RdLn Mock Prototype: External Word Compare

This is a standalone mock prototype for a possible RdLn feature that offers `External Word Compare` as an alternative path for file-based input workflows.

## What it does

- Presents a mock RdLn-style desktop UI
- Lets you choose two local `.docx` files
- Validates the pair in the Electron main process
- Attempts to launch Microsoft Word comparison on Windows
- Leaves the comparison result in Word

## What it does not do

- It does not integrate with the main RdLn app
- It does not support `.pdf`
- It does not import the Word comparison result back into RdLn
- It does not support browser/web usage

## Architecture note

This prototype keeps the integration flow app-owned inside Electron, but because the repo does not currently include a native Node COM library, the actual Word automation is performed through an inline Windows automation bridge invoked from the Electron main process.

That means:

- the UI and workflow are directly owned by the app
- there is no separate reusable helper script file in this prototype
- it is still not a pure native Node COM implementation

If this feature graduates, the next architecture choice would be either:

1. keep this app-owned bridge approach and harden it
2. adopt a true native Windows/COM integration dependency

## How to run

From this folder:

```powershell
npx electron .
```

Or:

```powershell
npm start
```

This assumes Electron is already available from the repo's installed dependencies.

## Suggested test cases

1. Select two valid `.docx` files and launch compare
2. Select the same file twice and confirm validation blocks it
3. Try with a missing file path after moving or deleting a file
4. Try on a machine without Word installed and inspect the failure message

## Production gaps

- better detection of Word installation
- stronger Office-version compatibility handling
- more precise user-facing error states
- packaging and trust/security review for desktop automation

