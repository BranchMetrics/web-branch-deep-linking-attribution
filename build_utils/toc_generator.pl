#!/usr/bin/perl

# Table Of Contents Generator for the Branch Web SDK
# Scott Hasbrouck, scott@branchmetrics.io
#
# Documenting this here so some poor soul doesn't come along X years in the future wondering what the hell this does.
#
# Using this thing is pretty simple.
# There are two arguments:
# (1) *Required* the file you want it to read,
# (2) *Required* The you'r emaking the Table of contents for: WEB, CORDOVA, etc.
#
# Example:
# $ perl toc_generator.pl YOUR_SWEET_FILE.js TARGET
# *Note* The default for TARGET is 'WEB', if left blank.
#
# TOC Generator will read the entire contents of the file, and look for two matches, in this format:
# 1. TOC headings:     /*** +TOC_HEADING &Name of heading& ^TARGET ***/
# 2. TOC items:        /*** +TOC_ITEM #anchor-link-on-github &.nameOfMethod()&  ^TARGET ***/
#
# HOT TIP OF THE DAY: We use /*** and not /** to comment the lines out because then JSDoc will ignore it :-P
#
# The file is read from top to bottom, and the TOC headings and items are written
# to the table of contents in the order they are matched in the file, in this format:
# 1. Branch Session
#  + [.init()](#initbranch_key-options)
#  + [.setIdentity()](#setidentityidentity-callback)
#
# Motivation for doing this: I kept forgetting to add new links at the top to new methods,
# and to update the links if I changed the name of the method or the arguments. Plus, it just
# made sense to have all this in-line with the source code, since the rest of the documentation was that way.
#
# That's all!

my $file = @ARGV[0];
my $target = @ARGV[1] || "WEB";
my @file_array;
my @toc_output;
my $heading_count = 1;

# Read the file in the first argument
open(my $fh, "<", $file) or die "Sorry Hommie: $!\n";
while(<$fh>) {
    chomp;
    push @file_array, $_;
}
close $fh;

# All the regex's
my $heading_regex = '\\/\\*\\*\\* \\+TOC_HEADING &([\w\s.,_\(\)]+?)& \\^(.*?) \\*\\*\\*\\/';
my $item_regex = '\\/\\*\\*\\* \\+TOC_ITEM (#.*?) &([\w\s.,_\(\)]+?)& \\^(.*?) \\*\\*\\*\\/';

# Look for matches
foreach $file_line (@file_array) {
	my @heading_matches = $file_line =~ m/$heading_regex/g;
	if ($#heading_matches > 0 && (@heading_matches[1] eq $target || @heading_matches[1] eq "ALL")) {
		if ($heading_count != 1) { print "\n"; } # Extra new line between headings
		print $heading_count.". ".@heading_matches[0]."\n";
		$heading_count++;
	}
	my @item_matches = $file_line =~ m/$item_regex/g;
	if ($#item_matches > 0 && (@item_matches[2] eq $target || @item_matches[2] eq "ALL")) {
		#print @item_matches[2]."\n";
		print '  + ['.@item_matches[1].']('.@item_matches[0].")\n";
	}
}
# Visual horizontal rule seperator for documentation
print "\n___\n";

