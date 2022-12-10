# Backup-XenForo-Watched-Threads
Userscript that exports all of your watched threads.

Export your watched threads by clicking the "Export Watched Threads" below. Give it some time to work, or you can monitor the process by looking at your console!

edit the config at the top

```
const export_file_name = 'exported_threads.txt' // this is the name of the file that will be downloaded

const skip_discussion_threads = false // this is for threads with "discussion" in the title
const skip_download_threads = false // this is for threads with "download" in the title

const enable_custom_thread_filter = false // this will remove links by thread id
const custom_thread_filter = [
    '44937',
]
```
