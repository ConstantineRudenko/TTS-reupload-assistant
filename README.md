# TTS-reupload-assistant

Reroutes all URLs in a save file (images, meshes, asset bundles, etc.) to local copies for a complete re-upload. Downloads URLs that have not been cached.

```
Usage:
	reup.js <tts-save-file>  <temp-folder>

<tts-save-file>
	TTS save file to be processed

	example:	C:/User/Documents/My Games/
				Tabletop Simulator/Saves/
				TS_Save_96.json
				
<temp-folder>
	Any folder to hold the downloaded files.

Output
	Will be placed next to the original file
	with ".edited" in the end.
```
