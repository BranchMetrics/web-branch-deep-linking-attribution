COMPILER=java -jar compiler/compiler.jar
COMPILER_LIBRARY=compiler/library/closure-library-master/closure
SOURCES=src/0_config.js src/0_utils.js src/1_banner.js src/1_api.js src/1_resources.js src/2_branch.js src/3_branch_instance.js src/4_umd.js
EXTERN=src/extern.js json3/lib/json3.js
COMPILER_ARGS=--js $(SOURCES) --externs $(EXTERN) --output_wrapper "(function() {%output%})();"

all: dist/build.js dist/build.min.js dist/onpage.min.js
docs: README.md

# Kinda gross, but will download closure compiler if you don't have it.
compiler/compiler.jar:
	@echo "\nFetching and installing closure compiler..."
	mkdir -p compiler && \
	wget http://dl.google.com/closure-compiler/compiler-latest.zip && \
	unzip compiler-latest.zip -d compiler && \
	rm -f compiler-latest.zip

compiler/library:
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

docs/2_branch.md: $(SOURCES)
	@echo "\nGenerating docs..."
	mkdir -p docs
	jsdox src/2_branch.js \
	--output docs

README.md: docs/2_branch.md dist/onpage.min.js docs/footer.md docs/intro.md docs/intro2.md
	@echo "\nConcatinating readme"
	cat docs/intro.md dist/onpage.min.js docs/Intro2.md docs/2_branch.md docs/footer.md > README.md

dist/build.js: $(SOURCES) $(EXTERN) compiler/compiler.jar 
	@echo "\Minifying debug compressed js..."
	$(COMPILER) $(COMPILER_ARGS) \
		--formatting=print_input_delimiter \
		--formatting=pretty_print \
		--define 'DEBUG=true' > dist/build.js

dist/build.min.js: $(SOURCES) $(EXTERN) compiler/compiler.jar
	@echo "\Minifying compressed and gzipped js..."
	$(COMPILER) $(COMPILER_ARGS) \
		--compilation_level ADVANCED_OPTIMIZATIONS \
		--define 'DEBUG=false' > dist/build.min.js
	gzip -c dist/build.min.js > dist/build.min.js.gzip

dist/onpage.min.js: src/onpage.js compiler/compiler.jar
	@echo "\nMinifying on page script into README"
	$(COMPILER) --js src/onpage.js \
		--define 'DEBUG=false' > dist/onpage.min.js