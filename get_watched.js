// ==UserScript==
// @name Backup XenForo Watched Threads
// @author ne0liberal
// @description Gets you the urls of all your watched threads
// @version 0.0.6
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

// CONFIGURATION OPTIONS

const export_file_name = 'exported_threads.txt' // this is the name of the file that will be downloaded

const skip_discussion_threads = false // this is for threads with "discussion" in the title
const skip_download_threads = false // this is for threads with "download" in the title

const enable_custom_thread_filter = false // this will remove links by thread id
const custom_thread_filter = [
    '44937',
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

                // i dont know the best way to create an exported file, so i just did this
                const element = document.createElement('a')
                element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(prunedUrls.join('\n')))
                element.setAttribute('download', export_file_name)
                element.style.display = 'none'
                document.body.appendChild(element)
                element.click()
                document.body.removeChild(element)

                GM_log(`Saved ${prunedUrls.length} urls to ${export_file_name}`)
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
