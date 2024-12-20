# TTS-reupload-assistant

Reroutes all URLs in a save file (images, meshes, asset bundles, etc.) to local copies for a complete re-upload. Downloads URLs that have not been cached.

```
Usage:
    reup.js <tts-save-file> <tts-cache-folder> <temp-folder> [options]

Arguments:
    <tts-save-file>
        TTS save file to be processed.
        Example:    "Documents/My Games/Tabletop Simulator/
                      Saves/TS_Save_96.json"
    <tts-cache-folder>
        TTS local mod cache.
        Example:    "Documents/My Games/Tabletop Simulator/Mods/"
    <temp-folder>
        Any folder to hold the downloaded files.

Options:
    --no-links
        By default soft links are created for existing cached files.
        Use this option to force copying instead.
    --timeout=T  [default: 3000]
        How long to wait in milliseconds for the server response
        before giving up on a URL.
    --simultaneous=N [default: 5]
        How many files should be downloaded simultaneously.

Output:
    Will be placed next to the original file with ".edited"
    added to the name.
```
