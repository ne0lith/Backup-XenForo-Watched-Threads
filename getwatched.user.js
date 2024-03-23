// ==UserScript==
// @name Backup XenForo Watched Threads
// @author ne0liberal
// @namespace https://github.com/ne0lith/Backup-XenForo-Watched-Threads/
// @updateURL https://github.com/ne0lith/Backup-XenForo-Watched-Threads/raw/main/getwatched.user.js
// @downloadURL https://github.com/ne0lith/Backup-XenForo-Watched-Threads/raw/main/getwatched.user.js
// @description Gets you the urls of all your watched threads
// @version 0.2.1
// @icon https://simp4.jpg.church/simpcityIcon192.png
// @match https://simpcity.su/watched/threads*
// @connect self
// @run-at document-start
// @grant GM_log
// ==/UserScript==

// OPEN TO PRs IF YOU WANT TO MAKE THIS BETTER :)

// CONFIGURATION OPTIONS

const export_file_name = 'exported_threads.txt' // this is the name of the file that will be downloaded
const skip_discussion_threads = false // this is for threads with "discussion" in the title
const skip_download_threads = false // this is for threads with "download" in the title
const enable_custom_thread_filter = true // this will skip links by thread id
const custom_thread_filter = [
    '44937',
    '28080',
    '10215',
]

// END CONFIGURATION OPTIONS

const threadUrls = []

function findLastPageLink() {
    const links = document.querySelectorAll('a[href*="threads?page="]')

    let lastPageLink = links[0]
    for (const link of links) {
        const pageNumber = Number(link.href.match(/page=(\d+)/)[1])

        if (pageNumber > Number(lastPageLink.href.match(/page=(\d+)/)[1])) {
            lastPageLink = link
        }
    }

    var lastPageNumber = Number(lastPageLink.href.match(/page=(\d+)/)[1])
    return lastPageNumber

}

function crawlPage(pageNumber, lastPageNumber) {
    const url = `https://simpcity.su/watched/threads?page=${pageNumber}`

    percentage_complete = Math.round((pageNumber / lastPageNumber) * 100)

    if (percentage_complete > 0) {
        document.querySelector('.checkmark').innerHTML = `Exporting Watched Threads (${percentage_complete}%)`
        document.querySelector('.checkmark').innerHTML += `<br><small>Crawling page ${pageNumber} of ${lastPageNumber}</small>`
    }

    if (percentage_complete == 100) {
        setTimeout(function () {
            document.querySelector('.checkmark').innerHTML = 'Export Watched Threads'
        }, 1000)
    }

    GM_log(`Crawling page ${pageNumber} of ${lastPageNumber}`)
    GM_log(`Fetching ${url}`)

    fetch(url)
        .then(response => response.text())
        .then(html => {
            const doc = new DOMParser().parseFromString(html, 'text/html')
            const links = doc.querySelectorAll('a[href*="/threads/"]')

            for (const link of links) {
                threadUrls.push(link.href)
            }

            if (pageNumber < lastPageNumber) {
                crawlPage(pageNumber + 1, lastPageNumber)
            } else {
                const prunedUrls = [...new Set(threadUrls)].filter(url => url.endsWith('/')).sort()

                for (const url of prunedUrls) {
                    if (url.includes('download') && skip_download_threads) {
                        const index = prunedUrls.indexOf(url)
                        prunedUrls.splice(index, 1)
                    }
                }

                for (const url of prunedUrls) {
                    if (url.includes('discussion') && skip_discussion_threads) {
                        const index = prunedUrls.indexOf(url)
                        prunedUrls.splice(index, 1)
                    }
                }

                if (enable_custom_thread_filter) {
                    for (const url of prunedUrls) {
                        for (const thread of custom_thread_filter) {
                            if (url.includes(thread)) {
                                const index = prunedUrls.indexOf(url)
                                prunedUrls.splice(index, 1)
                            }
                        }
                    }
                }

                var textFileContent = prunedUrls.join("\n");
                var link = document.createElement("a");
                link.href = "data:text/plain;charset=utf-8," + encodeURIComponent(textFileContent);
                link.download = export_file_name;
                link.click();
                GM_log(`Saved ${prunedUrls.length} urls to ${export_file_name}`)
            }
        })
}

function scrapeUrls() {
    const lastPageNumber = findLastPageLink()
    crawlPage(1, lastPageNumber)
}

function addLink() {
    let element = document.evaluate('/html/body/div[3]/div/div[3]/div/div/div', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;

    if (element) {
        let checkmark = document.createElement('span');

        checkmark.classList.add('checkmark');
        checkmark.innerHTML = 'Export Watched Threads';
        element.style.position = 'relative';
        checkmark.style.position = 'absolute';
        checkmark.style.right = 0;
        checkmark.style.cursor = 'pointer';
        element.appendChild(checkmark);
        checkmark.addEventListener('click', scrapeUrls);
    }

    let style = document.createElement('style');
    style.innerHTML = '.checkmark:hover { text-decoration: underline; }';
    document.head.appendChild(style);
}

window.onload = addLink;
