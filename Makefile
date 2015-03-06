COMPILER=java -jar compiler/compiler.jar
COMPILER_LIBRARY=compiler/library/closure-library-master/closure
SOURCES=src/0_config.js src/0_storage.js src/0_utils.js src/0_queue.js src/0_banner_utils.js src/1_api.js src/1_resources.js src/1_banner_css.js src/1_banner_html.js src/2_banner.js src/3_branch.js src/4_initialization.js $(COMPILER_LIBRARY)/goog/**
EXTERN=src/extern.js
COMPILER_ARGS=--js $(SOURCES) --externs $(EXTERN) --output_wrapper "(function() {%output%})();" --only_closure_dependencies --closure_entry_point branch_instance

.PHONY: clean

all: dist/build.js dist/build.min.js.gz README.md example.html
docs: README.md
clean:
	rm dist/build.js dist/build.min.js docs/1_onpage.md docs/3_branch.md dist/build.min.js.gz README.md example.html


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

calcdeps.py: $(SOURCES) compiler/library
	@echo "\nCalculating dependencies for compiler tests..."
	python $(COMPILER_LIBRARY)/bin/calcdeps.py \
	--dep $(COMPILER_LIBRARY)/goog \
	--path src \
	--path tests \
	--output_mode deps \
	--exclude tests/branch-deps.js \
	> tests/branch-deps.js

docs/3_branch.md: $(SOURCES)
	@echo "\nGenerating docs..."
	jsdox src/3_branch.js --output docs

dist/build.js: $(SOURCES) $(EXTERN) compiler/compiler.jar 
	@echo "\nMinifying debug js..."
	mkdir -p dist
	$(COMPILER) $(COMPILER_ARGS) \
		--formatting=print_input_delimiter \
		--formatting=pretty_print \
		--define 'DEBUG=true' > dist/build.js

dist/build.min.js: $(SOURCES) $(EXTERN) compiler/compiler.jar
	@echo "\nMinifying compressed js..."
	mkdir -p dist
	$(COMPILER) $(COMPILER_ARGS) \
		--compilation_level ADVANCED_OPTIMIZATIONS \
		--define 'DEBUG=false' > dist/build.min.js

dist/build.min.js.gz: dist/build.min.js
	@echo "\nCompressing JS js..."
	gzip -c dist/build.min.js > dist/build.min.js.gz

docs/1_onpage.md: src/onpage.js compiler/compiler.jar
	@echo "\nMinifying on page script into README"
	perl -pe 'BEGIN{$$sub="$(version)"?"https://cdn.branch.io/branch-$(version).min.js":"dist/build.js"};s#SCRIPT_URL_HERE#$$sub#' src/onpage.js | \
		$(COMPILER) | \
		node transform.js branch_sdk > docs/1_onpage.md

example.html: src/example.template.html docs/1_onpage.md
	perl -pe 'BEGIN{$$a=`cat docs/1_onpage.md`}; s#// INSERT INIT CODE#$$a#' src/example.template.html > example.html

README.md: docs/0_intro.md docs/1_onpage.md docs/2_intro.md docs/3_branch.md docs/4_footer.md
	@echo "\nConcatinating readme"
	cat docs/0_intro.md docs/1_onpage.md docs/2_intro.md docs/3_branch.md docs/4_footer.md > README.md

