.PHONY: all icons test

all: icons

icons:						\
	icons/tab-reap-light.svg		\
	icons/tab-reap-dark-64.png		\
	icons/tab-reap-dark.svg

icons/tab-reap-dark.svg: icons/tab-reap.svg $(MAKEFILE_LIST)
	sed 's/context-fill/#4a4a4f/' $< > $@

icons/tab-reap-light.svg: icons/tab-reap.svg $(MAKEFILE_LIST)
	sed 's/context-fill/#f9f9fa/' $< > $@

icons/tab-reap-dark-%.png: icons/tab-reap-dark.svg
	rsvg-convert -w $* -a $< -o $@

.PHONY: run
run: icons
	web-ext run

NODE := $(firstword $(shell which nodejs) $(shell which node))

test: icons
	@node -r jsdom </dev/null 2>/dev/null || npm install
	$(NODE) test/util_test.js
	web-ext lint

.PHONY: build
build: icons
	web-ext build --overwrite-dest  --ignore-files="*~" "test"  "Makefile" "README.md" "icons/*.png" "package.json"
