.PHONY: all icons code test

PATH := node_modules/.bin:$(PATH)
export PATH

all: icons code

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
	web-ext run $(addprefix --firefox ,$(WEB_EXT_FIREFOX))

NODE := node

test: icons
	@node -r jsdom </dev/null 2>/dev/null || npm install
	node test/util_test.js
	$(foreach js,$(wildcard *.json _locales/*/*.json),node $(js) && ) true
	web-ext lint

.PHONY: build
build: icons code
	web-ext build --overwrite-dest  --ignore-files="*~" "test"  "Makefile" "README.md" "icons/*.png" "package.json" \
	vendor/

code: punycode.js

punycode.js: vendor/punycode/punycode.js vendor/punycode/LICENSE-MIT.txt $(MAKEFILE_LIST)
	sed 's:^:// :' vendor/punycode/LICENSE-MIT.txt > $@
	echo "" >> $@
	sed '/module.exports = /d' $< >> $@

.PHONY: export
export:
	git archive -o tabreaper_$$(git describe).tar --format=tar HEAD
	git submodule foreach 'git archive --prefix=$$sm_path/ -o $$toplevel/x.tar HEAD && tar --catenate -f $$toplevel/tabreaper_$$(git -C $$toplevel describe).tar $$toplevel/x.tar && rm $$toplevel/x.tar'
	gzip -9 tabreaper_$$(git describe).tar

.PHONY: build_env
build_env:
	npm --version || sudo apt -y install npm
	sudo apt install -y librsvg2-bin zip
	npm install node npm # install captive versions of node, npm
	rm -f package-lock.json # reset package-lock.json
	npm install
