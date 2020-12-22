# Tab Reaper

![Tab Reaper](icons/tab-reap.svg) https://addons.mozilla.org/firefox/addon/tab-reaper/

[![Build Status](https://travis-ci.org/whitty/tabreaper.svg?branch=master)](https://travis-ci.org/whitty/tabreaper)

Too many tabs? It's a chore to find and click through them all to
close them. Just hit Tab Reaper, type in a URL or part of one, hit
"Close Them!" and watch them all disappear.

Features:

 - Close by URL
 - Close by Title
 - Preserve your pinned tabs
 - Choose case sensitivity
 - Close individual tabs from the list
 - Close duplicate tabs
 - Support for IDN domain names

# Build instructions

## Requirements

Required packages for building

 * web-ext from npm
 * GNU make (tested on ubuntu 18.04)
 * rsvg-convert from `librsvg2-bin`
 * zip (info zip)

For testing:

 * nodejs for testing

## Building

Generate zip/xpi

```
make build
```

Start the extension in a local browser session

```
make run
```

Run unittests

```
make test
```
