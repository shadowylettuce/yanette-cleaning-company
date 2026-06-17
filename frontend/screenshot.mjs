// screenshot.mjs — takes a screenshot of a localhost page using Puppeteer
// Usage: node screenshot.mjs http://localhost:3000
// Usage: node screenshot.mjs http://localhost:3000 hero-section   (adds label to filename)

import puppeteer from 'puppeteer'  // import Puppeteer, the headless browser library
import fs from 'fs'                 // import Node's built-in file system module
import path from 'path'             // import Node's built-in path utilities

const url = process.argv[2]         // grab the URL from the first CLI argument (node script.mjs <URL>)
const label = process.argv[3]       // grab the optional label from the second CLI argument

if (!url) {                         // if no URL was provided, print usage and exit
  console.error('Usage: node screenshot.mjs <url> [label]')
  process.exit(1)                   // exit with error code 1 so Claude knows something went wrong
}

const outputDir = './temporary-screenshots'                  // the folder where screenshots will be saved

if (!fs.existsSync(outputDir)) {                             // if the folder doesn't exist yet
  fs.mkdirSync(outputDir, { recursive: true })               // create it (and any parent folders needed)
}

// find the next available screenshot number so we never overwrite an existing file
let n = 1                                                    // start counting from 1
while (fs.existsSync(path.join(outputDir, buildFilename(n, label)))) { // keep incrementing while that filename exists
  n++
}

const filename = buildFilename(n, label)                     // build the final filename using the next available number
const filepath = path.join(outputDir, filename)              // combine the folder path and filename into a full path

const browser = await puppeteer.launch({                     // launch a headless Chrome browser
  headless: 'new',                                           // use the new headless mode (more stable)
  args: ['--no-sandbox', '--disable-setuid-sandbox']         // disable sandbox for Windows compatibility
})

const page = await browser.newPage()                         // open a new browser tab

await page.setViewport({ width: 1440, height: 900 })         // set the viewport to a standard desktop size

await page.goto(url, { waitUntil: 'networkidle2' })          // navigate to the URL and wait until network activity settles

await page.screenshot({ path: filepath, fullPage: true })    // take a full-page screenshot and save it to our path

await browser.close()                                        // close the browser to free memory

console.log(`Screenshot saved: ${filepath}`)                 // print the saved path so Claude can read the file

// helper function — builds the screenshot filename based on number and optional label
function buildFilename(n, label) {
  const base = `screenshot-${n}`                             // base name is always screenshot-N
  return label ? `${base}-${label}.png` : `${base}.png`     // if a label was given, append it before .png
}
