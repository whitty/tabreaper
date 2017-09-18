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

all:						\
	icons/tab-reap-light.svg		\
	icons/tab-reap-dark.svg

icons/tab-reap-dark.svg: icons/tab-reap.svg $(MAKEFILE_LIST)
	sed 's/context-fill/#4a4a4f/' $< > $@

icons/tab-reap-light.svg: icons/tab-reap.svg $(MAKEFILE_LIST)
	sed 's/context-fill/#f9f9fa/' $< > $@
