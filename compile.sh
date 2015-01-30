#--compilation_level ADVANCED_OPTIMIZATIONS
java -jar /Users/dmitrig01/Downloads/compiler-latest/compiler.jar \
	--formatting=print_input_delimiter \
	--formatting=pretty_print \
	--js \
		src/api.js \
		src/branch.js \
		src/branch_instance.js \
		src/config.js \
		src/resources.js \
		src/umd.js \
		src/utils.js \
		--externs src/extern.js \
		--output_wrapper "(function() {%output%})();" \
		--define 'DEBUG=true'