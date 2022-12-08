// ==UserScript==
// @name Backup XenForo Watched Threads
// @author ne0liberal
// @description Gets you the urls of all your watched threads
// @version 0.0.1
// @icon https://simp4.jpg.church/simpcityIcon192.png
// @match https://simpcity.su/watched/threads
// @connect self
// @run-at document-start
// @grant GM_log
// @grant GM_setClipboard
// ==/UserScript==

// JUST PREFACING THIS SCRIPT WITH A WARNING THAT THIS IS A VERY BAD SCRIPT AND I WROTE IT IN 5 MINUTES
// WHEN I WAS BORED AND I'M NOT GOING TO FIX IT BECAUSE IT WORKS AND I DON'T CARE
// IF YOU WANT TO USE IT, YOU CAN, BUT IT'S NOT GOING TO BE PERFECT
// I'M NOT RESPONSIBLE FOR ANYTHING THAT HAPPENS TO YOU OR YOUR COMPUTER
// YOU HAVE BEEN WARNED

// ALSO, IM OPEN TO PRs IF YOU WANT TO MAKE THIS BETTER :)

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

                // im removing threads containing "download" and "discussion" because they aren't threads, probably
                // you can remove this for loop if you want to keep them
                for (const url of prunedUrls) {
                    if (url.includes('download') || url.includes('discussion')) {
                        const index = prunedUrls.indexOf(url)
                        prunedUrls.splice(index, 1)
                    }
                }

                GM_setClipboard(prunedUrls.join('\n'))
                GM_log(`Copied ${prunedUrls.length} urls to the clipboard`)
            }
        })
}

function scrapeUrls() {
    const lastPageNumber = findLastPageLink()
    crawlPage(1, lastPageNumber)

}

// activate with shift + o (i think caps lock has to be on, because its only working for me when its on)
document.addEventListener('keydown', function (event) {
    if (event.shiftKey && event.key === 'o') {
        scrapeUrls()
    }
}
)
