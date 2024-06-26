
CLOSURE_COMPILER=java -jar ./node_modules/google-closure-compiler-java/compiler.jar
CLOSURE_LIBRARY= ./node_modules/google-closure-library/closure

COMPILER_ARGS=--js $(SOURCES) --externs $(EXTERN) --output_wrapper "(function() {%output%})();" --dependency_mode=PRUNE_LEGACY --language_out ECMASCRIPT_2015 --entry_point branch_instance
COMPILER_MIN_ARGS=--compilation_level ADVANCED_OPTIMIZATIONS --language_out ECMASCRIPT_2015
COMPILER_DEBUG_ARGS=--formatting=print_input_delimiter --formatting=pretty_print --warning_level=VERBOSE
COMPILER_DEV_ARGS=
KEY_VALUE=

SOURCES=$(CLOSURE_LIBRARY)/goog/base.js\
$(CLOSURE_LIBRARY)/goog/json/json.js\
src/0_config.js\
src/0_jsonparse.js\
src/0_queue.js\
src/1_utils.js\
src/2_resources.js src/2_session.js src/2_storage.js\
src/3_api.js src/3_banner_utils.js\
src/4_banner_css.js src/4_banner_html.js\
src/5_banner.js\
src/6_branch.js\
src/7_initialization.js\
src/branch_view.js\
src/journeys_utils.js

EXTERN=src/extern.js

VERSION=$(shell grep "version" package.json | perl -pe 's/\s+"version": "(.*)",/$$1/')

ONPAGE_RELEASE=$(subst ",\",$(shell perl -pe 'BEGIN{$$sub="https://cdn.branch.io/branch-latest.min.js"};s\#SCRIPT_URL_HERE\#$$sub\#' src/onpage.js | $(CLOSURE_COMPILER) | node transform.js branch_sdk))
ONPAGE_DEV=$(subst ",\",$(shell perl -pe 'BEGIN{$$sub="build.js"};s\#SCRIPT_URL_HERE\#$$sub\#' src/onpage.js | $(CLOSURE_COMPILER) | node transform.js branch_sdk))
ONPAGE_TEST=$(subst ",\",$(shell perl -pe 'BEGIN{$$sub="../dist/build.js"};s\#SCRIPT_URL_HERE\#$$sub\#' src/onpage.js | $(CLOSURE_COMPILER) | node transform.js branch_sdk))

# Check if the target being executed is "dev" and set COMPILER_DEV_ARGS if API_ENDPOINT argument has value
$(info Building dev...)
ifeq ($(MAKECMDGOALS),dev)
    ifneq ($(API_ENDPOINT),)
        COMPILER_DEV_ARGS := --define='DEFAULT_API_ENDPOINT=$(API_ENDPOINT)'
    endif
endif

.PHONY: clean

all: dist/build.min.js dist/build.js example.html test/branch-deps.js test/integration-test.html
clean:
	rm -f dist/** docs/web/3_branch_web.md example.html test/branch-deps.js dist/build.min.js.gz test/integration-test.html
release: clean all dist/build.min.js.gz
	@echo "released"
dev-clean:
	rm -rf dev/*
dev: dev-clean dev-build example.html

test/branch-deps.js: $(SOURCES)
	npx closure-make-deps \
        --closure-path $(CLOSURE_LIBRARY)/goog \
		--f node_modules/google-closure-library/closure/goog/deps.js \
		--root src \
		--root test \
		--exclude test/web-config.js \
		--exclude test/branch-deps.js > test/branch-deps.js

dist/build.js: $(SOURCES) $(EXTERN)
	mkdir -p dist && \
	$(CLOSURE_COMPILER) $(COMPILER_ARGS) $(COMPILER_DEBUG_ARGS) > dist/build.js

dist/build.min.js: $(SOURCES) $(EXTERN)
	mkdir -p dist && \
	$(CLOSURE_COMPILER) $(COMPILER_ARGS) $(COMPILER_MIN_ARGS) > dist/build.min.js

dist/build.min.js.gz: dist/build.min.js
	mkdir -p dist && \
	gzip -c dist/build.min.js > dist/build.min.js.gz

dev-build: $(SOURCES) $(EXTERN)
	mkdir -p dev && \
	$(CLOSURE_COMPILER) $(COMPILER_ARGS) $(COMPILER_DEBUG_ARGS) $(COMPILER_DEV_ARGS) > dev/build.js

example.html: src/web/example.template.html
ifeq ($(MAKECMDGOALS), release)
	perl -pe 'BEGIN{$$a="$(ONPAGE_RELEASE)"}; s#// INSERT INIT CODE#$$a#' src/web/example.template.html > example.html
else ifeq ($(MAKECMDGOALS),dev)
	perl -pe 'BEGIN{$$b="$(KEY_VALUE)"}; s#key_place_holder#$$b#' src/web/example.template.html > dev/example.template.html
	perl -pe 'BEGIN{$$a="$(ONPAGE_DEV)"}; s#// INSERT INIT CODE#$$a#' dev/example.template.html > dev/example.html
	rm -rf dev/example.template.html
else
	perl -pe 'BEGIN{$$a="$(ONPAGE_DEV)"}; s#// INSERT INIT CODE#$$a#' src/web/example.template.html > example.html
endif

# Documentation

docs/web/3_branch_web.md: $(SOURCES)
	perl -pe 's/\/\*\*\ =CORDOVA/\/\*\*\*/gx' src/6_branch.js > src/3_branch_web.js
	perl -p -i -e 's/=WEB//gx' src/3_branch_web.js
	jsdox src/3_branch_web.js --output docs/web
	rm src/3_branch_web.js

# integration test page

test/integration-test.html: test/integration-test.template.html
	perl -pe 'BEGIN{$$a="$(ONPAGE_TEST)"}; s#// INSERT INIT CODE#$$a#' test/integration-test.template.html > test/integration-test.html
