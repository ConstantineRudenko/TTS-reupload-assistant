# TTS-reupload-assistant

## Problems

Normally, "Upload All" option in  Tabletop Simulator will not upload files that are already in Steam cloud. This means, if you have a save file that relies on content scattered all over your Steam cloud, you can't re-upload all of it to a single new folder to make sure that all the dependencies of this save file will remain alive after you clean up some old junk from your Steam cloud.

Tabletop Simulator will not upload files that are already in Steam cloud, even if it isn't **your** Steam cloud. Which means files can suddenly become unavailable after *supposedly* making a backup of a room from Steam Workshop in your own Steam cloud.

## Solution

This program will download *(or extract from cache)* all files *(images, meshes, sounds, asset bundles, etc.)* linked by a Tabletop Simulator save file. All these files will be placed into a user-provided directory, and a new save file will be created next to the original one, with all the links rerouted to said directory.

This will force Tabletop Simulator to re-upload **all files** *(when clicking "Upload All" on the new save file)*, even those that were already linked to someone's Steam cloud *(yours or otherwise)*.

Now you can make sure that a single folder in your Steam cloud contains all the dependencies of the given save file, and it is not going anywhere.


## Self-signed certificates

Deno will refuse to download files from a server with self-signed certificate by default. To support such servers, use the option `--unsafely-ignore-certificate-errors` as follows.

```
deno run --unsafely-ignore-certificate-errors src/mod.js
```

## Usage

```
TTS Reupload Helper
Usage:
    tts-mc-reup <tts-save-file> <tts-cache-folder> <temp-folder> [options]

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
    --resume
        By default the <temp-folder> is expected to be empty, and an error
        will be raised otherwise. With this flag, files that already exist
        in <temp-folder> will not be re-downloaded. This allows to resume
        after a crash. If the wrong <temp-folder> is provided or the save file
        has changed since the last attempt, resuming will corrupt the newly
        created save file by linking wrong files from <temp-folder>.
    --links
        Make soft links instead of copying local files.
    --max-attempts=N [default:5]
        How many times to retry a failed download before giving up.
    --simultaneous=N [default: 5]
        How many files should be downloaded simultaneously.
    --timeout=T  [default: 10000]
        How long to wait in milliseconds for the server response
        before giving up on a URL.

Output:
    Will be placed next to the original file with ".reupload"
    added to the name.
```
