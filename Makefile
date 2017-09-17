.PHONY: all

all: tabreaper.zip

tabreaper.zip:					\
	LICENSE.txt				\
	manifest.json				\
	tabreaper.css				\
	tabreaper.html				\
	tabreaper.js				\
	icons/tab-reap.svg
	rm -f $@
	zip -r -FS $@ $^

all: icons/tab-reap-solid.svg

icons/tab-reap-solid.svg: icons/tab-reap.svg
	sed 's/context-fill/rgba(12, 12, 13, .8)/' $< > $@
