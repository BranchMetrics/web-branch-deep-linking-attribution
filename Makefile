COMPILER=java -jar compiler/compiler.jar
COMPILER_LIBRARY=compiler/library/closure-library-master/closure
SOURCES=src/0_config.js src/0_storage.js src/0_utils.js src/0_queue.js src/0_banner_utils.js src/1_api.js src/1_resources.js src/1_banner_css.js src/1_banner_html.js src/2_banner.js src/3_branch.js src/4_initialization.js $(COMPILER_LIBRARY)/goog/**
EXTERN=src/extern.js
COMPILER_ARGS=--js $(SOURCES) --externs $(EXTERN) --output_wrapper "(function() {%output%})();" --only_closure_dependencies --closure_entry_point branch_instance
VERSION=$(shell grep "version" package.json | perl -pe 's/\s+"version": "(.*)",/$$1/')
ONPAGE_VERSION=$(subst ",\",$(shell perl -pe 'BEGIN{$$sub="https://cdn.branch.io/branch-v$(VERSION).min.js"};s\#SCRIPT_URL_HERE\#$$sub\#' src/onpage.js | $(COMPILER) | node transform.js branch_sdk))
ONPAGE_BUILD=$(subst ",\",$(shell perl -pe 'BEGIN{$$sub="dist/web/build.js"};s\#SCRIPT_URL_HERE\#$$sub\#' src/onpage.js | $(COMPILER) | node transform.js branch_sdk))

.PHONY: clean

all: dist/web/build.js dist/web/build.min.js.gz README.md testbeds/web/example.html tests/branch-deps.js
docs: README.md
clean:
	rm dist/web/build.js dist/web/build.min.js docs/3_branch.md dist/web/build.min.js.gz README.md testbeds/web/example.html tests/branch-deps.js


# Kinda gross, but will download closure compiler if you don't have it.
compiler/compiler.jar:
	@echo "\nFetching and installing closure compiler..."
	mkdir -p compiler && \
	wget http://dl.google.com/closure-compiler/compiler-latest.zip && \
	unzip compiler-latest.zip -d compiler && \
	rm -f compiler-latest.zip

compiler/library/closure-library-master/closure/goog/**:
	@echo "\nFetching and installing closure library..."
	mkdir -p compiler/library && \
	wget https://github.com/google/closure-library/archive/master.zip && \
	unzip master.zip -d compiler/library && \
	rm -f master.zip

tests/branch-deps.js: $(SOURCES) compiler/library
	@echo "\nCalculating dependencies for compiler tests..."
	python $(COMPILER_LIBRARY)/bin/calcdeps.py \
	--dep $(COMPILER_LIBRARY)/goog \
	--path src \
	--path tests \
	--output_mode deps \
	--exclude tests/branch-deps.js \
	> tests/branch-deps.js.tmp
	echo "// jscs:disable" | cat - tests/branch-deps.js.tmp > tests/branch-deps.js && \
	rm tests/branch-deps.js.tmp

docs/3_branch.md: $(SOURCES)
	@echo "\nGenerating docs..."
	jsdox src/3_branch.js --output docs

dist/web/build.js: $(SOURCES) $(EXTERN) compiler/compiler.jar
	@echo "\nMinifying debug js..."
	mkdir -p dist/web
	$(COMPILER) $(COMPILER_ARGS) \
		--formatting=print_input_delimiter \
		--formatting=pretty_print \
		--warning_level=VERBOSE \
		--define 'DEBUG=true' > dist/web/build.js

dist/web/build.min.js: $(SOURCES) $(EXTERN) compiler/compiler.jar
	@echo "\nMinifying compressed js..."
	mkdir -p dist/web
	$(COMPILER) $(COMPILER_ARGS) \
		--compilation_level ADVANCED_OPTIMIZATIONS \
		--define 'DEBUG=false' > dist/web/build.min.js

dist/web/build.min.js.gz: dist/web/build.min.js
	@echo "\nCompressing JS js..."
	gzip -c dist/web/build.min.js > dist/web/build.min.js.gz

testbeds/web/example.html: src/web/example.template.html
	@echo "\nMinifying on page build script into testbeds/web/example.html"
ifeq "$(release)" "true"
	perl -pe 'BEGIN{$$a="$(ONPAGE_VERSION)"}; s#// INSERT INIT CODE#$$a#' src/web/example.template.html > testbeds/web/example.html
else
	perl -pe 'BEGIN{$$a="$(ONPAGE_BUILD)"}; s#// INSERT INIT CODE#$$a#' src/web/example.template.html > testbeds/web/example.html
endif

README.md: docs/0_intro.md docs/3_branch.md
	@echo "\nConcatinating README"
	cat docs/0_intro.md docs/3_branch.md docs/4_footer.md > README.md
	@echo "\nMinifying on page script into README"
	perl -i -pe 'BEGIN{$$a="$(ONPAGE_VERSION)"}; s#// INSERT INIT CODE#$$a#' README.md
