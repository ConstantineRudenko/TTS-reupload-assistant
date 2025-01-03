# TTS-reupload-assistant

Normally, "Upload All" option in  Tabletop Simulator will not upload files that are already in Steam cloud, even if it isn't **your** Steam cloud. Which means files can suddenly become unavailable after *supposedly* making a backup in your Steam cloud.

This program will download *(or extracts from cache)* all files *(images, meshes, sounds, asset bundles, etc.)* linked by a Tabletop Simulator save file. All these files will be placed into a user-provided directory, and a new save file will be created next to the original one, with all the links rerouted to said directory.

This will force Tabletop Simulator to re-upload **all files** *(when clicking "Upload All" on the new save file)*, even those that were linked to someone's Steam cloud *(yours or otherwise)*.


## Self-signed certificates

Deno will refuse to download files from a server with self-signed certificate by default. To support such servers, use the option `--unsafely-ignore-certificate-errors` as follows.

```
deno run --unsafely-ignore-certificate-errors src/mod.js
```

## Usage

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
    --timeout=T  [default: 10000]
        How long to wait in milliseconds for the server response
        before giving up on a URL.
	--max-attempts=N [default:5]
		How many times to retry a failed download before giving up.
    --simultaneous=N [default: 5]
        How many files should be downloaded simultaneously.

Output:
    Will be placed next to the original file with ".reupload"
    added to the name.
```
