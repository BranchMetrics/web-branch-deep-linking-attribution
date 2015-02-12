COMPILER=java -jar compiler/compiler.jar
SOURCES=src/0_config.js src/0_utils.js src/1_api.js src/1_resources.js src/2_branch.js src/3_branch_instance.js src/4_umd.js
EXTERN=src/extern.js
COMPILER_ARGS=--js $(SOURCES) --externs $(EXTERN) --output_wrapper "(function() {%output%})();"

all: dist/build.js dist/build.min.js

# Kinda gross, but will download closure compiler if you don't have it.
compiler/compiler.jar:
	mkdir -p compiler && \
	wget http://dl.google.com/closure-compiler/compiler-latest.zip && \
	unzip compiler-latest.zip -d compiler && \
	rm -f compiler-latest.zip

dist/build.js: $(SOURCES) $(EXTERN) compiler/compiler.jar
	$(COMPILER) $(COMPILER_ARGS) \
		--formatting=print_input_delimiter \
		--formatting=pretty_print \
		--define 'DEBUG=true' > dist/build.js

dist/build.min.js: $(SOURCES) $(EXTERN) compiler/compiler.jar
	$(COMPILER) $(COMPILER_ARGS) \
		--compilation_level ADVANCED_OPTIMIZATIONS \
		--define 'DEBUG=false' > dist/build.min.js

