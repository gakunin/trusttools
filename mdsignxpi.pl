#!/usr/bin/perl

use strict;
use Data::Dumper;

if (@ARGV < 6) {
    print "usage: mdsignxpi.pl metadata certdir xpifile sourcedir cookiename cookiedomain";
    exit 1;
}

open XML, "< $ARGV[0]";

my @entityids = ();
my $entityid;
my $is_idp;
while (<XML>) {
    if ($_ =~ /<EntityDescriptor entityID="([^"]+)">/) {
        $entityid = $1;
        $is_idp = 0;
    } elsif ($_ =~ /<IDPSSODescriptor /) {
        $is_idp = 1;
    } elsif ($_ =~ /<\/EntityDescriptor>/) {
        if ($entityid && $is_idp) {
            push(@entityids, $entityid);
        }
        $entityid = '';
        $is_idp = 0;
    }
};

for (my $i = 0; $i < @entityids; $i++) {
	my ($host) = ($entityids[$i] =~ /^https?:\/\/([^\/]+)/);
	print $host."\n";
    system("./signxpi.sh $ARGV[1] $ARGV[2].$host $ARGV[3] $entityids[$i] $ARGV[4] $ARGV[5]");
}

exit 0;
