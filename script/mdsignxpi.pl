#!/usr/bin/perl

use strict;
use Data::Dumper;
use File::Spec::Functions qw/rel2abs/;
use File::Basename qw/dirname/;

my $dir = rel2abs(dirname(rel2abs($0)));

if (@ARGV < 7) {
    print "usage: mdsignxpi.pl metadata keystore_path xpi_file_prefix xpi_path providers_uri idp_cookie_name_for_ds ds_domainname\n";
    exit 1;
}

open XML, "< $ARGV[0]";

my @entityids = ();
my $entityid;
my $is_idp;
while (<XML>) {
    if ($_ =~ /<EntityDescriptor/ && $_ =~ /entityID="([^"]+)">/) {
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
  system("$dir/signxpi.sh $ARGV[1] $ARGV[2].$host $ARGV[3] $ARGV[4] $entityids[$i] $ARGV[5] $ARGV[6]");
}

exit 0;
