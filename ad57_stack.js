// ==UserScript==
// @name         AD57 STACK
// @namespace    http://tampermonkey.net/
// @version      0.3
// @description  Modifies the page layout
// @author       A2
// @match        https://num.archives57.com/visualiseur/index.php/rechercheTheme/requeteConstructor/1/*
// @grant        none
// @require      https://code.jquery.com/jquery-3.6.0.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/jquery.blockUI/2.70/jquery.blockUI.min.js
// ==/UserScript==
(function() {
    'use strict';
    function clearLocalStorageWithPrefix(prefix) {
        for (let i = 0; i < localStorage.length; i++) {
            let key = localStorage.key(i);
            if (key.startsWith(prefix)) {
                console.log(`Removing key: ${key}`); // Debugging line
                localStorage.removeItem(key);
            }
        }
    }
    localStorage.clear();
    // Usage
    clearLocalStorageWithPrefix('AD57-');


    if (window.location.href.includes('/1/1/A/')) {
        window.location.href = 'https://num.archives57.com/visualiseur/index.php/rechercheTheme/requeteConstructor/1/2/A/0/0';
        return;
    }
    if (window.location.href.includes('/1/1/R/')) {
        $('#menu').remove();
        $('#content').remove();
    }
    $('html').css({'border': 'none'});
    $('ul.dvpt-liste_items li a[onclick^="winopen"]').each(function() {
        $(this).removeAttr('onclick').removeAttr('href').html('&#8226;');
    });
    $('body').css({ 'font-family': 'Noto Sans', 'font-size': 'x-large', 'line-height': '1.5'
                  });
    // Remove "Choix de la commune" useless text
    $('ul.dvpt-liste_resultat li:contains("Choix de la commune")').each(function() {
        const html = $(this).html();
        const newHtml = html.replace(/Choix de la commune\s*<br>/, '');
        $(this).html(newHtml);
    });

    let totalResults = null;

    function getTotalResults() {
        const match = $('.t.bt td:last-child').text().match(/(\d+)/);
        return match ? parseInt(match[1]) : 0;
    }

    // Function to apply all cleanup and formatting
    function applyCleanupAndFormatting() {
        // Remove the original #resultat div
        document.getElementById('resultat').style.display = 'none';

        $('.bouton_84px_type1, .bouton_176px_type1, .bouton_298px_type1').css({
            'width': 'auto',
            'height': 'auto',
            'padding': 'revert'
        });

        $('#content').removeClass('main_contener');

        // Process commune name and description
        var commDesc = '';
        var commune = $('.dvpt-liste_resultat li').text().trim().replace(/:.*/, '').toLowerCase();
        var text = $('.dvpt-liste_resultat li').text().trim();
        if (text.includes(':')) {
            commDesc = text.split(':')[1].trim();
        }

        var words = commune.split('-');
        for (var i = 0; i < words.length; i++) {
            switch (words[i].trim()) {
                case 'etangs (les)':
                    words[i] = 'Les Étangs';
                    break;
                case 'l\'hopital':
                    words[i] = 'L\'Hôpital';
                    break;
                case 'l orme':
                    words[i] = 'l’Orme';
                    break;
                case 'les':
                    words[i] = 'lès';
                    break;
                case 'a':
                    words[i] = 'à';
                    break;
                case 'la':
                case 'le':
                case 'aux':
                case 'sur':
                    break;
                default:
                    words[i] = words[i].charAt(0).toUpperCase() + words[i].slice(1);
            }
        }
        commune = words.join('-').trim();

        // Add header with commune name and result count
        $('body').prepend('<h1>' + commune + '</h1><div>' + totalResults + ' réponses' + '</div>')
            .css({ 'font-family': 'Noto Sans', 'font-size': 'x-large'});

        $('#resultats_complets, #resultats_complets a').css({
            'font-family': 'Noto Sans',
            'font-size': 'x-large',
            'line-height': '1.5'
        });
        // Fix width of date spans
        $('span.reponsemot > span:last-child').css('width', '160px');
        // Image handling
        $('#resultats_complets img[id^="img_"]').each(function() {
            $(this).css({
                'width': '120px',
                'height': 'auto',
                'position': 'relative',
                'z-index': '1',
                'transition': ''
            });
        });
        // Remove extra whitespace
        $('.reponsemot').each(function() {
            let html = $(this).html();
            html = html.replace(/&nbsp;{2,}/g, ' ');
            $(this).html(html);
        });
        const elementsToRemove = ['#menu', 'div:has(> span.titre_ecran)', 'h3', '.espace_bandeau', '.message', '#misePanier', 'form', '#content > *:lt(3)', 'img[src*="basket-sm.png"]', '#requete'];
        elementsToRemove.forEach(selector => {
            $(selector).remove();
        });
        $('#resultats_complets div:last').nextAll('br').addBack().remove();
        // Process all openDetail links
        $('a[id^="openDetail"]').each(function() {
            let imageSrc = '';
            let uniqueId = '';

            const onclickStr = $(this).attr('onclick');
            const baseUrl = onclickStr.match(/window\.open\('([^']+)'\+screen\.height\+'\/'?\+screen\.width/)[1];
            const completeUrl = `${baseUrl}${screen.height}/${screen.width}`;
            uniqueId = baseUrl.match(/\/(\d+:\d+:\d+)\/$/)[1];

            const imageContainer = $(this).closest('div').prev('a').find('div img');
            imageSrc = imageContainer.attr('src');
            $(this).removeAttr('onclick')
                .attr('href', completeUrl)
                .attr('target', '_blank')
                .attr('rel', 'noopener');

            const container = $(this).closest('span').parent();
            const spans = container.find('span').not(':has(a)');

            if (spans.length >= 2) {
                let referenceText = spans.eq(1).text().trim();
                let periodText = spans.eq(2).text().trim();

                let type = (periodText.includes('An')) ? "NMD" :
                ((parseInt(periodText.split('-')[0]) < 1793) ? "BMS" : "NMD");
                let descText = container.find('a').text();

                if (/^Naissances\.?$/.test(descText)) {
                    type = "N";
                } else if (/^Mariages\.?$/.test(descText)) {
                    type = "M";
                } else if (/^Décès\.?$/.test(descText)) {
                    type = "D";
                } else if (descText === "Baptêmes, mariages.") {
                    type = "BM";
                } else if (descText === "Mariages, décès.") {
                    type = "MD";
                } else if (descText === "Sépultures.") {
                    type = "S";
                }

                const regSrc = `AD57 ${type} ${commune} ${periodText} ${referenceText}`;
                const localStorageKey = `AD57-${uniqueId}`;

                if (localStorageKey && imageSrc && regSrc && descText) {
                    const localStorageData = {
                        imageSrc: imageSrc,
                        regSrc: regSrc,
                        descText: descText
                    };
                    if (!localStorage.getItem(uniqueId)) {
                        localStorage.setItem(uniqueId, JSON.stringify(localStorageData));
                    }
                }

                spans.not(':first').remove();
                container.find('br').remove();

                const $regSrc = $('<span>')
                .text(regSrc)
                .css({
                    'user-select': 'all',
                });

                container.append($regSrc);
            }
        });
    }

    function copyCurrentPageResults(registersProcessed) {
        const resultatsDiv = document.getElementById('resultat');
        let resultatsCompletsDiv = document.getElementById('resultats_complets');

        if (!resultatsCompletsDiv) {
            resultatsCompletsDiv = document.createElement('div');
            resultatsCompletsDiv.id = 'resultats_complets';
            document.body.prepend(resultatsCompletsDiv);
        }

        const resultatsPageDiv = document.createElement('div');
        resultatsPageDiv.id = `resultats${registersProcessed}`;
        resultatsCompletsDiv.appendChild(resultatsPageDiv);

        let currentResult = resultatsDiv.querySelector('#zoom ~ *');
        let registersOnThisPage = Math.min(20, totalResults - registersProcessed);

        for (let i = 0; i < registersOnThisPage && currentResult; i++) {
            let elementsAddedOnThisRegister = 0;
            while (elementsAddedOnThisRegister < 4 && currentResult) {
                if (currentResult.tagName.toLowerCase() !== 'script') {
                    resultatsPageDiv.appendChild(currentResult.cloneNode(true));
                    elementsAddedOnThisRegister++;
                }
                currentResult = currentResult.nextElementSibling;
            }
        }
        return registersOnThisPage;
    }

    function processPagination(registersProcessed = 0) {
        const processedOnThisPage = copyCurrentPageResults(registersProcessed);
        if (!processedOnThisPage) return;

        const remainingRegisters = totalResults - (registersProcessed + processedOnThisPage);

        if (remainingRegisters > 0) {
            const nextOffset = registersProcessed + 20;
            $.blockUI('<h1><img src=/visualiseur/application/views/images/busy.gif /> <b>Recherche en cours</b></h1>');
            $('#resultat').load(`/visualiseur/index.php/rechercheTheme/paginer/${nextOffset}`, function() {
                $.unblockUI();
                setTimeout(() => processPagination(nextOffset), 500);
            });
        } else {
            applyCleanupAndFormatting();
        }
    }

    (function checkBlockUI() {
        const blockUiElements = document.querySelectorAll('.blockUI');
        if (blockUiElements.length === 0) {
            if (!totalResults) totalResults = getTotalResults();
            processPagination(0);
        } else {
            setTimeout(checkBlockUI, 500);
        }
    })();
})();