# YouTube-Fast-Load
A pretty clever workaround for YouTube's video load slowdowns when blocking ads. I discovered that when watching videos in a playlist, they always loaded instantly and were unaffected by the slowdowns. So this extension simulates a video load as part of a playlist to load instantly.

## Key Features:

Automatic Playlist Simulation: Intercepts YouTube video requests and adds playlist parameters to make them load instantly
+ Fully supports opening videos in new tabs
+ Clean URL Display: Removes the artificial playlist parameters after the video loads
+ Toggle On/Off: Simple popup interface to enable/disable the extension
+ Efficient Performance: Minimal overhead with smart caching and cleanup

## How It Works:

Request Interception: The background script intercepts all YouTube watch page requests

URL Modification: Adds list=RD{videoId} and index=1 parameters to simulate a mix/playlist

Cleanup: The content script removes these parameters from the URL bar after loading

UI Hiding: Hides any playlist panels that might appear from the artificial parameters

## Installation:

1. Clone the repo to a folder
2. Enable developer mode
3. Click "Load unpacked" & select the folder
4. Profit

## Best Practices Implemented:

+ Error Handling: Try-catch blocks around critical operations
+ Memory Management: Automatic cache cleanup for old entries
+ Modular Design: Separated background logic from content script
+ Performance: Minimal DOM manipulation and efficient event handling
+ Clean Code: Clear naming conventions and organized structure

The extension should work immediately after installation, making all YouTube videos load as quickly as they do in playlists!
