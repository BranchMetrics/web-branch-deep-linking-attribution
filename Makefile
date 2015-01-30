COMPILER=java -jar /Users/dmitrig01/Downloads/compiler-latest/compiler.jar
SOURCES=src/api.js src/branch.js src/branch_instance.js src/config.js src/resources.js src/umd.js src/utils.js
EXTERN=src/extern.js
COMPILER_ARGS=--js $(SOURCES) --externs $(EXTERN) --output_wrapper "(function() {%output%})();"

all: dist/build.js dist/build.min.js

dist/build.js: $(SOURCES) $(EXTERN)
	$(COMPILER) $(COMPILER_ARGS) \
		--formatting=print_input_delimiter \
		--formatting=pretty_print \
		--compilation_level ADVANCED_OPTIMIZATIONS \
		--define 'DEBUG=true' > dist/build.js

dist/build.min.js: $(SOURCES) $(EXTERN)
	$(COMPILER) $(COMPILER_ARGS) \
		--compilation_level ADVANCED_OPTIMIZATIONS \
		--define 'DEBUG=false' > dist/build.min.js
