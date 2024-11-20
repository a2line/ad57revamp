// ==UserScript==
// @name         AD57 SOURCES
// @namespace    http://tampermonkey.net/
// @version      0.4
// @description  Modifies the register source with link to full quality image and adds multi-page source copying.
// @author       A2
// @match        https://num.archives57.com/visualiseur/index.php/docnumViewer/calculHierarchieDocNum/*
// @grant        none
// @require      https://code.jquery.com/jquery-3.6.0.min.js
// ==/UserScript==

(function() {
    'use strict';

    const currentUrl = window.location.href;
    const uniqueIdMatch = currentUrl.match(/\/(\d+:\d+:\d+)\//);
    let localStorageData = null;
    let cheminsArray = [];
    let totalPages = 0;

    if (uniqueIdMatch && uniqueIdMatch.length > 1) {
        const uniqueId = uniqueIdMatch[1];
        localStorageData = JSON.parse(localStorage.getItem(uniqueId));
    }

    function getFullQualityImageUrl(pageNumber, withSize = false) {
        if (!cheminsArray[pageNumber - 1]) return null;
        const baseUrl = localStorageData.imageSrc.split('@@')[0];
        const url = baseUrl + '@@' + cheminsArray[pageNumber - 1];
        return withSize ? url + '/N/T0/100/100/Y' : url;
    }

    function createMultiPageSource(startPage, pageCount) {
        const pages = [];
        const links = [];

        for (let i = 0; i < pageCount; i++) {
            const pageNum = startPage + i;
            if (pageNum > totalPages) break;

            const imageUrl = getFullQualityImageUrl(pageNum, true);
            if (!imageUrl) continue;

            pages.push(pageNum);
            links.push(`<a href="${imageUrl}">${pageNum}</a>`);
        }

        if (pages.length === 0) return null;

        return `${localStorageData.regSrc} i. ${links.join('-')}/${totalPages}`;
    }

    function copyToClipboard(text) {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        try {
            document.execCommand('copy');
        } catch (err) {
            console.error('Failed to copy text: ', err);
        }
        document.body.removeChild(textarea);
    }

    function setupClipboardListener() {
        document.addEventListener('paste', (e) => {
            const text = e.clipboardData.getData('text');
            const number = parseInt(text);
            const input = document.querySelector('input[type="text"]');

            if (!isNaN(number) && number > 0 && number <= totalPages && input) {
                input.value = number;
                const inputEvent = new Event('input', { bubbles: true });
                input.dispatchEvent(inputEvent);
            }
        });
    }

    function createInfoBar() {
        const mainInitFunction = Array.from(document.querySelectorAll('script'))
        .find(script => script.textContent.includes('main({'))
        .textContent;

        const docsArray = JSON.parse(mainInitFunction.match(/docs\s*:\s*(\[.*?\])/)[1]);
        cheminsArray = docsArray.map(doc => doc.chemin);
        totalPages = cheminsArray.length;

        const infoBar = document.createElement('div');
        infoBar.style.position = 'fixed';
        infoBar.style.top = '0';
        infoBar.style.left = '0';
        infoBar.style.width = '100%';
        infoBar.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        infoBar.style.color = 'white';
        infoBar.style.padding = '10px';
        infoBar.style.zIndex = '9999';
        infoBar.style.textAlign = 'center';

        if (localStorageData) {
            const initialImageUrl = getFullQualityImageUrl(1);
            const fullQualityInitialUrl = initialImageUrl + '/N/T0/100/100/Y';

            infoBar.innerHTML = `
                ${localStorageData.regSrc} i.<input type="text" value="1" style="width: 32px; padding: 0 2px; margin: 0 2px;">/${totalPages}
                (<a id="view-current" href="${fullQualityInitialUrl}" target="_blank" style="color: white; text-decoration: underline;" title="Visualiser l'image en pleine qualité">voir image</a> /
                <a id="view-plus-1" href="${getFullQualityImageUrl(2) + '/N/T0/100/100/Y'}" target="_blank" style="color: white; text-decoration: underline;" title="Visualiser l'image suivante en pleine qualité">+1</a> /
                <a id="view-plus-2" href="${getFullQualityImageUrl(3) + '/N/T0/100/100/Y'}" target="_blank" style="color: white; text-decoration: underline;" title="Visualiser l'image deux positions après celle-ci en pleine qualité">+2</a> |
                <a id="copy-current" href="#" style="color: white; text-decoration: underline;" class="copy-btn" title="Copier la source dans le presse papier">copier source</a> /
                <a id="copy-plus-1" href="#" style="color: white; text-decoration: underline;" class="copy-plus-1-btn" title="Copier la source dans le presse papier en incluant l'image suivante">+1</a> /
                <a id="copy-plus-2" href="#" style="color: white; text-decoration: underline;" class="copy-plus-2-btn" title="Copier la source dans le presse papier en incluant les deux images suivantes">+2</a>)<br>
                <div style="color: #ccc; font-size: 0.9em;">${localStorageData.descText}</div>
            `;

            const input = infoBar.querySelector('input');
            const viewImageLink = infoBar.querySelector('a[target="_blank"]');
            const viewPlus1Link = viewImageLink.nextElementSibling;
            const viewPlus2Link = viewPlus1Link.nextElementSibling;
            const copyBtn = infoBar.querySelector('.copy-btn');
            const copyPlus1Btn = infoBar.querySelector('.copy-plus-1-btn');
            const copyPlus2Btn = infoBar.querySelector('.copy-plus-2-btn');

            // Update full-quality links dynamically
            input.addEventListener('input', (e) => {
                const pageNumber = parseInt(e.target.value);
                if (pageNumber > 0 && pageNumber <= totalPages) {
                    viewImageLink.href = getFullQualityImageUrl(pageNumber) + '/N/T0/100/100/Y';
                    viewPlus1Link.href = getFullQualityImageUrl(pageNumber + 1) + '/N/T0/100/100/Y';
                    viewPlus2Link.href = getFullQualityImageUrl(pageNumber + 2) + '/N/T0/100/100/Y';
                }
            });

            copyBtn.addEventListener('click', (e) => {
                e.preventDefault();
                const currentPage = parseInt(input.value);
                const source = createMultiPageSource(currentPage, 1);
                if (source) copyToClipboard(source);
            });

            copyPlus1Btn.addEventListener('click', (e) => {
                e.preventDefault();
                const currentPage = parseInt(input.value);
                const source = createMultiPageSource(currentPage, 2);
                if (source) copyToClipboard(source);
            });

            copyPlus2Btn.addEventListener('click', (e) => {
                e.preventDefault();
                const currentPage = parseInt(input.value);
                const source = createMultiPageSource(currentPage, 3);
                if (source) copyToClipboard(source);
            });
        }

        document.body.insertBefore(infoBar, document.body.firstChild);
        setupClipboardListener();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', createInfoBar);
    } else {
        createInfoBar();
    }
})();