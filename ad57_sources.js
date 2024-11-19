// ==UserScript==
// @name         AD57 SOURCES
// @namespace    http://tampermonkey.net/
// @version      0.2
// @description  Modifies the register source with link to full quality image.
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
    let formattedSource = '';
    let totalPages = 0;
    let clipboardMonitorInterval = null;

    if (uniqueIdMatch && uniqueIdMatch.length > 1) {
        const uniqueId = uniqueIdMatch[1];
        localStorageData = JSON.parse(localStorage.getItem(uniqueId));
        if (localStorageData) {
            console.log('Retrieved data:', localStorageData);
        } else {
            console.log("No data found in local storage for", uniqueId);
        }
    }

    function updateImageUrl(pageNumber) {
        if (!cheminsArray[pageNumber - 1]) return;
        const baseUrl = localStorageData.imageSrc.split('@@')[0];
        const newImageUrl = baseUrl + '@@' + cheminsArray[pageNumber - 1] + '/N/T0/100/100/Y';
        return newImageUrl;
    }

    function updateFormattedSource(pageNumber, totalPages, imageUrl) {
        formattedSource = `${localStorageData.regSrc} i. <a href="${imageUrl}">${pageNumber}</a>/${totalPages}`;
        return formattedSource;
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

    function handleClipboardContent(text) {
        const number = parseInt(text);
        if (!isNaN(number) && number > 0 && number <= totalPages) {
            const input = document.querySelector('input[type="text"]');
            if (input) {
                input.value = number;
                const inputEvent = new Event('input', { bubbles: true });
                input.dispatchEvent(inputEvent);
            }
        }
    }

    // Use paste event instead of continuous monitoring
    function setupClipboardListener() {
        document.addEventListener('paste', (e) => {
            const text = e.clipboardData.getData('text');
            handleClipboardContent(text);
        });

        // Only monitor clipboard when document is focused
        document.addEventListener('visibilitychange', () => {
            if (document.hidden && clipboardMonitorInterval) {
                clearInterval(clipboardMonitorInterval);
                clipboardMonitorInterval = null;
            }
        });

        // Add focus monitoring
        window.addEventListener('focus', () => {
            if (!clipboardMonitorInterval) {
                navigator.clipboard.readText()
                    .then(handleClipboardContent)
                    .catch(() => {}); // Silently handle errors
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
            const initialImageUrl = updateImageUrl(1);
            formattedSource = updateFormattedSource(1, totalPages, initialImageUrl);

            infoBar.innerHTML = `
                ${localStorageData.regSrc} i.<input type="text" value="1" style="width: 32px; padding: 0 2px; margin: 0 2px;">/${totalPages}
                (<a href="${initialImageUrl}" target="_blank" style="color: white; text-decoration: underline;">voir image</a> /
                <a href="#" style="color: white; text-decoration: underline;" class="copy-btn">copier source</a>)<br>
                <div style="color: #ccc; font-size: 0.9em;">${localStorageData.descText}</div>
            `;

            const input = infoBar.querySelector('input');
            const imageLink = infoBar.querySelector('a[target="_blank"]');
            const copyBtn = infoBar.querySelector('.copy-btn');

            input.addEventListener('input', (e) => {
                const pageNumber = parseInt(e.target.value);
                if (pageNumber > 0 && pageNumber <= totalPages) {
                    const newImageUrl = updateImageUrl(pageNumber);
                    if (newImageUrl) {
                        imageLink.href = newImageUrl;
                        formattedSource = updateFormattedSource(pageNumber, totalPages, newImageUrl);
                    }
                }
            });

            copyBtn.addEventListener('click', (e) => {
                e.preventDefault();
                copyToClipboard(formattedSource);
            });
        }

        document.body.insertBefore(infoBar, document.body.firstChild);

        // Set up clipboard handling
        setupClipboardListener();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', createInfoBar);
    } else {
        createInfoBar();
    }
})();
