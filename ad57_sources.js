// ==UserScript==
// @name         AD57 SOURCES
// @namespace    http://tampermonkey.net/
// @version      0.5
// @description  Modifies the register source with link to full quality image.
// @author       A2
// @match        https://num.archives57.com/visualiseur/index.php/docnumViewer/calculHierarchieDocNum/*
// @grant        none
// @require      https://code.jquery.com/jquery-3.6.0.min.js
// ==/UserScript==

(function() {
    'use strict';

    // Robust Storage Manager
    const StorageManager = {
        setItem(key, data) {
            try {
                localStorage.setItem(key, JSON.stringify(data));
                sessionStorage.setItem(key, JSON.stringify(data));
                return true; // Indiquer le succès
            } catch (error) {
                console.error('Error storing data:', error);
                return false;
            }
        },

        getItem(key) {
            try {
                const localData = localStorage.getItem(key);
                if (localData) return JSON.parse(localData);

                const sessionData = sessionStorage.getItem(key);
                if (sessionData) return JSON.parse(sessionData);

                console.log(`No data found for key: ${key}`); // Log plus explicite
                return null;
            } catch (error) {
                console.error('Error retrieving data:', error);
                return null;
            }
        },

        // Ajout d'une méthode pour vérifier si une clé existe
        hasItem(key) {
            return localStorage.getItem(key) !== null || sessionStorage.getItem(key) !== null;
        }
    };

    // Check and warn if storage is empty
    function checkStoragePersistence() {
        try {
            const ad57Keys = Object.keys(localStorage)
            .filter(key => key.startsWith('AD57-'));

            if (ad57Keys.length === 0) {
                console.warn('No AD57 storage data found');

                const warningDiv = document.createElement('div');
                Object.assign(warningDiv.style, {
                    position: 'fixed',
                    top: '0',
                    left: '0',
                    width: '100%',
                    backgroundColor: 'red',
                    color: 'white',
                    padding: '10px',
                    zIndex: '9999',
                    textAlign: 'center'
                });
                warningDiv.innerText = 'Storage data has been lost. Please return to the search results page and try again.';

                document.body.insertBefore(warningDiv, document.body.firstChild);
                return false;
            }
            return true;
        } catch (error) {
            console.error('Error checking storage persistence:', error);
            return false;
        }
    }

    function getCurrentDocumentId() {
        const currentUrl = window.location.href;
        const match = currentUrl.match(/\/(\d+:\d+:\d+)\//);
        return match ? match[1] : null;
    }

    let localStorageData = null;
    let cheminsArray = [];
    let totalPages = 0;

    const documentId = getCurrentDocumentId();
    if (documentId) {
        const localStorageKey = `AD57-${documentId}`;
        localStorageData = StorageManager.getItem(localStorageKey);
        if (localStorageData) {
            console.log('Successfully retrieved storage key', localStorageKey,'data', localStorageData);
        } else {
            console.error('NO DATA COULD BE RETRIEVED');
        }
    }

    function getFullQualityImageUrl(pageNumber, withSize = false) {
        if (!cheminsArray[pageNumber - 1]) return null;
        const baseUrl = localStorageData.imageSrc.split('@@')[0];
        const url = baseUrl + '@@' + cheminsArray[pageNumber - 1];
        return withSize ? url + '/N/T0/100/100/Y' : url;
    }

    function createMultiPageSource(startPage, pageCount, noLinks = false) {
        const pages = [];
        const links = [];

        for (let i = 0; i < pageCount; i++) {
            const pageNum = startPage + i;
            if (pageNum > totalPages) break;

            const imageUrl = getFullQualityImageUrl(pageNum, true);
            if (!imageUrl) continue;

            pages.push(pageNum);
            if (noLinks) {
                links.push(pageNum.toString());
            } else {
                links.push(`<a href="${imageUrl}">${pageNum}</a>`);
            }
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

    function setupClipboardListener() {
        document.addEventListener('paste', (e) => {
            const text = e.clipboardData.getData('text');
            handleClipboardContent(text);
        });

        document.addEventListener('visibilitychange', () => {
            if (document.hidden && clipboardMonitorInterval) {
                clearInterval(clipboardMonitorInterval);
                clipboardMonitorInterval = null;
            }
        });

        window.addEventListener('focus', () => {
            if (!clipboardMonitorInterval) {
                navigator.clipboard.readText()
                    .then(handleClipboardContent)
                    .catch(() => {});
            }
        });
    }

    function updateNavigationVisibility(currentPage) {
        const showPlus1 = currentPage < totalPages;
        const showPlus2 = currentPage < totalPages - 1;

        // Éléments de visualisation
        const viewPlus1Elements = document.querySelectorAll('#view-plus-1, #view-plus-1-separator');
        const viewPlus2Elements = document.querySelectorAll('#view-plus-2, #view-plus-2-separator');

        // Éléments de copie
        const copyPlus1Elements = document.querySelectorAll('#copy-plus-1, #copy-plus-1-separator');
        const copyPlus2Elements = document.querySelectorAll('#copy-plus-2, #copy-plus-2-separator');

        viewPlus1Elements.forEach(el => el.style.display = showPlus1 ? 'inline' : 'none');
        viewPlus2Elements.forEach(el => el.style.display = showPlus2 ? 'inline' : 'none');
        copyPlus1Elements.forEach(el => el.style.display = showPlus1 ? 'inline' : 'none');
        copyPlus2Elements.forEach(el => el.style.display = showPlus2 ? 'inline' : 'none');
    }

    function createInfoBar() {
        // Ces constantes restent nécessaires pour le reste du script
        const mainInitFunction = Array.from(document.querySelectorAll('script'))
        .find(script => script.textContent.includes('main({'))
        .textContent;

        const docsArray = JSON.parse(mainInitFunction.match(/docs\s*:\s*(\[.*?\])/)[1]);
        cheminsArray = docsArray.map(doc => doc.chemin);
        totalPages = cheminsArray.length;

        const infoBar = document.createElement('div');
        // Les styles restent identiques
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
            ${localStorageData.regSrc} i.<span id="page-number" style="user-select: text">1</span>/${totalPages}
            <span id="navigation-container">
                (<a id="view-current" href="${fullQualityInitialUrl}" target="_blank" style="color: white; text-decoration: underline;" title="Visualiser l'image en pleine qualité">voir image</a>
                <span id="view-plus-1-separator"> / </span><a id="view-plus-1" href="${getFullQualityImageUrl(2) + '/N/T0/100/100/Y'}" target="_blank" style="color: white; text-decoration: underline;" title="Visualiser l'image suivante en pleine qualité">+1</a>
                <span id="view-plus-2-separator"> / </span><a id="view-plus-2" href="${getFullQualityImageUrl(3) + '/N/T0/100/100/Y'}" target="_blank" style="color: white; text-decoration: underline;" title="Visualiser l'image deux positions après celle-ci en pleine qualité">+2</a> |
                <a id="copy-current" href="#" style="color: white; text-decoration: underline;" class="copy-btn" title="Copier la source dans le presse papier">copier source</a>
                <span id="copy-plus-1-separator"> / </span><a id="copy-plus-1" href="#" style="color: white; text-decoration: underline;" class="copy-plus-1-btn" title="Copier la source dans le presse papier en incluant l'image suivante">+1</a>
                <span id="copy-plus-2-separator"> / </span><a id="copy-plus-2" href="#" style="color: white; text-decoration: underline;" class="copy-plus-2-btn" title="Copier la source dans le presse papier en incluant les deux images suivantes">+2</a>)
                <input type="checkbox" id="no-links-checkbox" style="margin-left: 5px; vertical-align: middle;" title="Source sans hyperlien">
            </span><br>
            <div style="color: #ccc; font-size: 0.9em;">${localStorageData.descText}</div>
        `;

        // Nouveau code pour monitorer la pagination avec mise à jour de la visibilité
        const checkJQPagination = setInterval(() => {
            const $pagination = $('.pagination');
            if ($pagination.length) {
                try {
                    const currentPage = $pagination.jqPagination('option', 'current_page');
                    if (currentPage) {
                        const pageSpan = document.querySelector('#page-number');
                        const navContainer = document.querySelector('#navigation-container');
                        if (pageSpan && navContainer) {
                            pageSpan.textContent = currentPage;

                            // Mise à jour des liens
                            const viewCurrentLink = document.querySelector('#view-current');
                            const viewPlus1Link = document.querySelector('#view-plus-1');
                            const viewPlus2Link = document.querySelector('#view-plus-2');

                            if (viewCurrentLink) viewCurrentLink.href = getFullQualityImageUrl(currentPage) + '/N/T0/100/100/Y';
                            if (viewPlus1Link) viewPlus1Link.href = getFullQualityImageUrl(currentPage + 1) + '/N/T0/100/100/Y';
                            if (viewPlus2Link) viewPlus2Link.href = getFullQualityImageUrl(currentPage + 2) + '/N/T0/100/100/Y';

                            // Mise à jour de la visibilité des boutons
                            updateNavigationVisibility(currentPage);
                        }
                    }
                } catch (e) {
                    console.error('Error updating page:', e);
                }
            }
        }, 100);

        // Gestionnaires d'événements modifiés pour gérer la case à cocher
        const copyBtn = infoBar.querySelector('.copy-btn');
        const copyPlus1Btn = infoBar.querySelector('.copy-plus-1-btn');
        const copyPlus2Btn = infoBar.querySelector('.copy-plus-2-btn');
        const noLinksCheckbox = infoBar.querySelector('#no-links-checkbox');

        copyBtn?.addEventListener('click', (e) => {
            e.preventDefault();
            const currentPage = parseInt(document.querySelector('#page-number').textContent);
            const source = createMultiPageSource(currentPage, 1, noLinksCheckbox.checked);
            if (source) copyToClipboard(source);
        });

        copyPlus1Btn?.addEventListener('click', (e) => {
            e.preventDefault();
            const currentPage = parseInt(document.querySelector('#page-number').textContent);
            const source = createMultiPageSource(currentPage, 2, noLinksCheckbox.checked);
            if (source) copyToClipboard(source);
        });

        copyPlus2Btn?.addEventListener('click', (e) => {
            e.preventDefault();
            const currentPage = parseInt(document.querySelector('#page-number').textContent);
            const source = createMultiPageSource(currentPage, 3, noLinksCheckbox.checked);
            if (source) copyToClipboard(source);
        });

        // Initialisation de la visibilité des boutons
        updateNavigationVisibility(1);
    }

        document.body.insertBefore(infoBar, document.body.firstChild);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', createInfoBar);
    } else {
        createInfoBar();
    }
})();