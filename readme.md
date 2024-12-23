# AD57 Archives Revamp

## Overview
This repository contains two Tampermonkey userscripts designed to enhance the user experience when browsing the Moselle Digital Archives (AD57) website.

Prefer the **[AD57 alphabetic index as root/bookmark to start browsing](https://num.archives57.com/visualiseur/index.php/rechercheTheme/requeteConstructor/1/1/R/A/0)**.

### Scripts
The scripts are automatically activated on archive search results pages and registres viewer.

1. **AD57 STACK (`ad57_stack.js`)**:
   - Consolidates registers results by commune across multiple pages into a single clean list
   - Improves readability by removing redundant information and cleaning up the layout
   - Generate a comprehensive and cleaner list of registers
   - Standardizes commune names with proper capitalization and accents
   - Automatically stores the metadata of sources in localStorage for use by AD57 SOURCES

2. **AD57 SOURCES** (`ad57_sources.js`):
   - Enhances document viewer with a top information source bar
     * Current document detailed source with page number and total
     * Direct links to full resolution images (current, +1, +2 pages)
     * Multiple source copying options:
       - Single page source
       - Source including next page (+1)
       - Source including next two pages (+2)
     * Optional checkbox to copy sources without hyperlinks
     * Smart hiding of unavailable options near document end

## Installation

### Prerequisites
- A Chromium-based, Safari, Opera Next or Firefox browser
- The adequate [Tampermonkey Extension](https://www.tampermonkey.net/)

### Script URLs
- **[AD57 STACK](https://raw.githubusercontent.com/a2line/ad57revamp/master/ad57_stack.js)**:

`https://raw.githubusercontent.com/a2line/ad57revamp/master/ad57_stack.js`

- **[AD57 SOURCES](https://raw.githubusercontent.com/a2line/ad57revamp/master/ad57_sources.js)**:

`https://raw.githubusercontent.com/a2line/ad57revamp/master/ad57_sources.js`

### Install Scripts
#### Method 1: Direct URL Installation
(In TamperMonkey Legacy)
1. Open Tampermonkey Dashboard
2. Click the "Utilities" tab
3. Paste the raw GitHub script URL in “Import from URL” input
4. Click "Install"

#### Method 2: Manual Installation
1. Open Tampermonkey Dashboard
2. Click the "+" tab
3. Copy-paste the entire script content
4. Save the script

## Notes
- Obviously only working on the Archives départementales de la Moselle (AD57) website.
- Scripts were tested using Tampermonkey Legacy 5.1.1 under Chrome 109/Windows 7, but should work on last versions.
- Requires an active internet connection
- Compatibility may vary with website updates…

## Disclaimer
These scripts are community-developed and not officially affiliated with the Moselle Archives.

## License
Copyright © 2024 A2

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and
associated documentation files (the “Software”), to deal in the Software without restriction,
including without limitation the rights to use, copy, modify, merge, publish, distribute,
sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial
portions of the Software.

The Software is provided “as is”, without warranty of any kind, express or implied, including but
not limited to the warranties of merchantability, fitness for a particular purpose and
noninfringement. In no event shall the authors or copyright holders be liable for any claim, damages
or other liability, whether in an action of contract, tort or otherwise, arising from, out of or in
connection with the software or the use or other dealings in the Software.