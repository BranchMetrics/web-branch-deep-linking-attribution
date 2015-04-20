COMPILER=java -jar compiler/compiler.jar
COMPILER_LIBRARY=compiler/library/closure-library-master/closure

COMPILER_ARGS=--js $(SOURCES) --externs $(EXTERN) --output_wrapper "(function() {%output%})();" --only_closure_dependencies --closure_entry_point branch_instance
COMPILER_MIN_ARGS=--compilation_level ADVANCED_OPTIMIZATIONS --define 'DEBUG=false'
COMPILER_DEBUG_ARGS=--formatting=print_input_delimiter --formatting=pretty_print --warning_level=VERBOSE --define 'DEBUG=true'

SOURCES=src/0_config.js src/0_storage.js src/0_utils.js src/0_queue.js src/0_banner_utils.js src/1_api.js src/1_resources.js src/1_banner_css.js src/1_banner_html.js src/2_banner.js src/3_branch.js src/4_initialization.js $(COMPILER_LIBRARY)/goog/**
EXTERN=src/extern.js

VERSION=$(shell grep "version" package.json | perl -pe 's/\s+"version": "(.*)",/$$1/')

ONPAGE_RELEASE=$(subst ",\",$(shell perl -pe 'BEGIN{$$sub="https://cdn.branch.io/branch-v$(VERSION).min.js"};s\#SCRIPT_URL_HERE\#$$sub\#' src/onpage.js | $(COMPILER) | node transform.js branch_sdk))
ONPAGE_DEV=$(subst ",\",$(shell perl -pe 'BEGIN{$$sub="../../dist/web/build.js"};s\#SCRIPT_URL_HERE\#$$sub\#' src/onpage.js | $(COMPILER) | node transform.js branch_sdk))

.PHONY: clean

all: dist/web/build.min.js dist/web/build.js README.md CORDOVA_GUIDE.md testbeds/web/example.html test/branch-deps.js dist/cordova/build.js dist/cordova/build.min.js
clean:
	rm -f dist/web/** dist/cordova/** docs/3_branch.md README.md testbeds/web/example.html test/branch-deps.js
release: clean all dist/web/build.min.js.gz
	@echo "released"


# Kinda gross, but will download closure compiler if you don't have it.
compiler/compiler.jar:
	mkdir -p compiler && \
		wget http://dl.google.com/closure-compiler/compiler-latest.zip && \
		unzip compiler-latest.zip -d compiler && \
		rm -f compiler-latest.zip

compiler/library/closure-library-master/closure/goog/**:
	mkdir -p compiler/library && \
		wget https://github.com/google/closure-library/archive/master.zip && \
		unzip master.zip -d compiler/library && \
		rm -f master.zip

test/branch-deps.js: $(SOURCES) compiler/library
	python $(COMPILER_LIBRARY)/bin/calcdeps.py \
		--dep $(COMPILER_LIBRARY)/goog \
		--path src \
		--path test \
		--output_mode deps \
		--exclude test/branch-deps.js > test/branch-deps.js.tmp
	echo "// jscs:disable" | cat - test/branch-deps.js.tmp | sed -e 's#src/0_config.js#test/web-config.js#' > test/branch-deps.js && \
		rm test/branch-deps.js.tmp

docs/3_branch.md: $(SOURCES)
	jsdox src/3_branch.js --output docs

dist/web/build.js: $(SOURCES) $(EXTERN) compiler/compiler.jar
	$(COMPILER) $(COMPILER_ARGS) $(COMPILER_DEBUG_ARGS) --define 'config.WEB_BUILD=true' > dist/web/build.js

dist/web/build.min.js: $(SOURCES) $(EXTERN) compiler/compiler.jar
	$(COMPILER) $(COMPILER_ARGS) $(COMPILER_MIN_ARGS) --define 'config.WEB_BUILD=true' > dist/web/build.min.js

dist/web/build.min.js.gz: dist/web/build.min.js
	gzip -c dist/web/build.min.js > dist/web/build.min.js.gz

dist/cordova/build.js: $(SOURCES) $(EXTERN) compiler/compiler.jar
	$(COMPILER) $(COMPILER_ARGS) $(COMPILER_DEBUG_ARGS) --define 'config.CORDOVA_BUILD=true' > dist/cordova/build.js

dist/cordova/build.min.js: $(SOURCES) $(EXTERN) compiler/compiler.jar
	$(COMPILER) $(COMPILER_ARGS) $(COMPILER_MIN_ARGS) --define 'config.CORDOVA_BUILD=true' > dist/cordova/build.min.js

testbeds/web/example.html: src/web/example.template.html
ifeq ($(MAKECMDGOALS), release)
	perl -pe 'BEGIN{$$a="$(ONPAGE_RELEASE)"}; s#// INSERT INIT CODE#$$a#' src/web/example.template.html > testbeds/web/example.html
else
	perl -pe 'BEGIN{$$a="$(ONPAGE_DEV)"}; s#// INSERT INIT CODE#$$a#' src/web/example.template.html > testbeds/web/example.html
endif

README.md: docs/0_intro.md docs/3_branch.md
	cat docs/0_intro.md docs/3_branch.md docs/4_footer.md | \
		perl -pe 'BEGIN{$$a="$(ONPAGE_RELEASE)"}; s#// INSERT INIT CODE#$$a#' > README.md

CORDOVA_GUIDE.md: docs/CORDOVA_GUIDE.template.md
	perl -pe 'BEGIN{$$a="$(ONPAGE_RELEASE)"}; s#// INSERT INIT CODE#$$a#' docs/CORDOVA_GUIDE.template.md > CORDOVA_GUIDE.md

CORDOVA_UPGRADE_GUIDE.md: docs/CORDOVA_UPGRADE_GUIDE.template.md
	perl -pe 'BEGIN{$$a="$(ONPAGE_RELEASE)"}; s#// INSERT INIT CODE#$$a#' docs/CORDOVA_UPGRADE_GUIDE.template.md > CORDOVA_UPGRADE_GUIDE.md
