# monaco-viewer-js

## Description

Monaco Viewer is a Chromium (Edge/Chrome) extension that uses [Monaco Editor](https://microsoft.github.io/monaco-editor/) to display

- text
- JSON
- YAML
- XML
- JavaScript
- CSS

and other file/content types, replacing the browser's default plain-text viewer, with folding, formatting and a toolbar of navigation commands.

## Settings

Click the extension's toolbar icon to change the editor settings (theme, font, line numbers, read-only, format on load, ...) and the **Content types** handled by the viewer, one per line.

Content types the browser does not show as plain text (it downloads them, like `application/yaml`, or renders them as documents, like `application/xml`) are rewritten to plain text so the viewer can display them. For these types:

- the content is decoded as UTF-8,
- a `Content-Disposition: attachment` header is ignored, so the content is displayed instead of downloaded,
- `file://` URLs are not affected.

## Installation

Requires Edge or Chrome 128 or later, and [Node.js](https://nodejs.org/) to install Monaco Editor.

- Clone the repo locally and install the dependencies in the cloned folder:
  ```sh
  npm ci
  ```
- At the browser's extensions page ([edge://extensions/](edge://extensions/) or [chrome://extensions/](chrome://extensions/)):
    - turn on **Developer mode**,
    - click **Load unpacked** and select the folder of the locally cloned repo.
