#!/usr/bin/perl

use strict;
use JSON qw/encode_json/;
use Digest::SHA qw/sha256_base64/;
use MIME::Base64;
use Data::Dumper;

if (@ARGV < 4) {
    print "usage: getservercert.pl providers_data.csv private_key certs_uri pattern_script [ca_certs]\n";
    exit 1;
}


my $json = JSON->new->sort_by('json_sort');


# obtain list data
my @list_data = &obtain_list_data();

# obtain discovery methods
my $_discovery_methods = &obtain_discovery_methods();

# obtain MAIN contents of this json file
my $_contents = {};
$_contents->{cert_list} = \@list_data;
$_contents->{discovery_methods} = $_discovery_methods;

# obtain ascii armoured payload
my $b64_digest = &obtain_ascii_armoured_payload();

# obtain the signature by sha256
my $_signature = &obtain_the_signature();

# json simple sign 1.0
my $_envelope = &json_simple_sign_1_0();

# output the json file
print $json->pretty(1)->encode($_envelope)."\n";


#################### subroutines ####################

# sort json
sub JSON::PP::json_sort {
    # main
    if ($JSON::PP::a eq "type") {
        return -1;
    }
    elsif ($JSON::PP::a eq "data_type") {
        return ($JSON::PP::b eq "type") ? 1 : -1;
    }
    elsif ($JSON::PP::a eq "data") {
        return ($JSON::PP::b eq "type" || $JSON::PP::b eq "data_type") ? 1 : -1;
    }
    elsif ($JSON::PP::a eq "sig_params") {
        return ($JSON::PP::b eq "type" || $JSON::PP::b eq "data_type" || $JSON::PP::b eq "data") ? 1 : -1;
    }
    elsif ($JSON::PP::a eq "sigs") {
        return ($JSON::PP::b eq "type" || $JSON::PP::b eq "data_type" || $JSON::PP::b eq "data" || $JSON::PP::b eq "sig_params") ? 1 : -1;
    }
    #
    if ($JSON::PP::b eq "type") {
        return 1;
    }
    elsif ($JSON::PP::b eq "data_type") {
        return ($JSON::PP::a eq "type") ? -1 : 1;
    }
    elsif ($JSON::PP::b eq "data") {
        return ($JSON::PP::a eq "type" || $JSON::PP::a eq "data_types") ? -1 : 1;
    }
    elsif ($JSON::PP::b eq "sig_params") {
        return ($JSON::PP::a eq "type" || $JSON::PP::a eq "data_types" || $JSON::PP::a eq "data") ? -1 : 1;
    }
    elsif ($JSON::PP::b eq "sigs") {
        return ($JSON::PP::a eq "type" || $JSON::PP::a eq "data_types" || $JSON::PP::a eq "data" || $JSON::PP::a eq "sig_params") ? -1 : 1;
    }

    # cert_list
    if ($JSON::PP::a eq "entity_id") {
        return -1;
    }
    elsif ($JSON::PP::a eq "cert_uri_prefix") {
        return ($JSON::PP::b eq "entity_id") ? 1 : -1;
    }
    elsif ($JSON::PP::a eq "x509_certificate_fingerprint") {
        return ($JSON::PP::b eq "entity_id" || $JSON::PP::b eq "cert_uri_prefix") ? 1 : -1;
    }
    elsif ($JSON::PP::a eq "idp_sp_flag") {
        return ($JSON::PP::b eq "entity_id" || $JSON::PP::b eq "cert_uri_prefix" || $JSON::PP::b eq "x509_certificate_fingerprint") ? 1 : -1;
    }
    elsif ($JSON::PP::a eq "login_uri_prefix") {
        return ($JSON::PP::b eq "entity_id" || $JSON::PP::b eq "cert_uri_prefix" || $JSON::PP::b eq "x509_certificate_fingerprint" || $JSON::PP::b eq "idp_sp_flag") ? 1 : -1;
    }
    elsif ($JSON::PP::a eq "pattern_name") {
        return ($JSON::PP::b eq "entity_id" || $JSON::PP::b eq "cert_uri_prefix" || $JSON::PP::b eq "x509_certificate_fingerprint" || $JSON::PP::b eq "idp_sp_flag" || $JSON::PP::b eq "login_uri_prefix") ? 1 : -1;
    }
    #
    if ($JSON::PP::b eq "entity_id") {
        return 1;
    }
    elsif ($JSON::PP::b eq "cert_uri_prefix") {
        return ($JSON::PP::a eq "entity_id") ? -1 : 1;
    }
    elsif ($JSON::PP::b eq "x509_certificate_fingerprint") {
        return ($JSON::PP::a eq "entity_id" || $JSON::PP::a eq "cert_uri_prefix") ? -1 : 1;
    }
    elsif ($JSON::PP::b eq "idp_sp_flag") {
        return ($JSON::PP::a eq "entity_id" || $JSON::PP::a eq "cert_uri_prefix" || $JSON::PP::a eq "x509_certificate_fingerprint") ? -1 : 1;
    }
    elsif ($JSON::PP::b eq "login_uri_prefix") {
        return ($JSON::PP::a eq "entity_id" || $JSON::PP::a eq "cert_uri_prefix" || $JSON::PP::a eq "x509_certificate_fingerprint" || $JSON::PP::a eq "idp_sp_flag") ? -1 : 1;
    }
    elsif ($JSON::PP::b eq "pattern_name") {
        return ($JSON::PP::a eq "entity_id" || $JSON::PP::a eq "cert_uri_prefix" || $JSON::PP::a eq "x509_certificate_fingerprint" || $JSON::PP::a eq "idp_sp_flag" || $JSON::PP::a eq "login_uri_prefix") ? -1 : 1;
    }

    # others
    $JSON::PP::a cmp $JSON::PP::b;
}


sub obtain_list_data {
    my @list_data = ();
    open(LIST, "< $ARGV[0]");
    while (<LIST>) {
        chop;
        # common
        my ($idpSpFlag, $entityid, $certUriPrefix);
        # idp only
        my ($ssosV1, $ssosV2);
        # sp only
        my ($loginUriPrefix, $patternName, $acs, $samlVersion, $cookieFlag);

        # for ca_certs option
        my $ca_certs = "";
        $ca_certs = "-CApath $ARGV[$#ARGV]" if $#ARGV == 4;

        if ($_ =~ s/^idp,\s*//) {
            ($entityid, $certUriPrefix, $ssosV1, $ssosV2) = split(/\s*,\s*/);
            $idpSpFlag = "idp";
            if (!$ssosV1) {
                $ssosV1 = '';
            }
            if (!$ssosV2) {
                $ssosV2 = '';
            }
        }
        elsif ($_ =~ s/^sp,\s*//) {
            ($entityid, $certUriPrefix, $loginUriPrefix, $patternName, $acs, $samlVersion, $cookieFlag) = split(/\s*,\s*/);
            $idpSpFlag = "sp";
            if (!$loginUriPrefix) {
                $loginUriPrefix = '';
            }
            if (!$patternName) {
                $patternName = '';
            }
            if (!$acs) {
                $acs = '';
            }
            if (!$samlVersion) {
                $samlVersion = '';
            }
            if (!$cookieFlag) {
                $cookieFlag = '';
            }
        }

        # get host certificate and fingerprint
        my @result;
        my $timeout = 0;
        $SIG{ALRM} = sub {
            $timeout = 1;
            next;
        };
        eval {
            alarm(3);
            print STDERR "openssl s_client -connect $certUriPrefix:443 $ca_certs\n";
            @result = `echo "GET /" | openssl s_client -connect $certUriPrefix:443 $ca_certs`;
            alarm(0);
        };
        if($timeout eq '1') {
            print STDERR "timeout: $entityid\n";
            # open TIMEOUTLIST, ">>/tmp/timeoutlist.dat"; print TIMEOUTLIST "$entityid\n"; close TIMEOUTLIST;
            # COMMENT out the next line if you want to keep the entity with null x509_server_certificate.
            # UNCOMMENT the next line if you DONOT want to keep the entity.
            next;
        }

        my $cert;
        my $match = 0;
        foreach my $line (@result) {
            chop $line;
            if ($line eq '-----BEGIN CERTIFICATE-----') {
                $match = 1;
            } elsif ($line eq '-----END CERTIFICATE-----') {
                last;
            } elsif ($match) {
                $cert .= "\n$line";
            }
        }
        my $tmpCert = "-----BEGIN CERTIFICATE-----".$cert."\n-----END CERTIFICATE-----";
        my ($fingerprint) = `echo "$tmpCert" | openssl x509 -sha1 -noout -fingerprint`;
        chop $fingerprint;
        $fingerprint =~ s/SHA1 Fingerprint=//;
        my $x509ServerCertificate = $cert;
        $x509ServerCertificate =~ s/\n//g;

        if (!$x509ServerCertificate) {
            $x509ServerCertificate = '';
        }
        if (!$fingerprint) {
            $fingerprint = '';
        }

        # build entity data
        my $entity_data = {};
        $entity_data->{entity_id} = $entityid;
        $entity_data->{cert_uri_prefix} = $certUriPrefix;
        $entity_data->{x509_server_certificate} = $x509ServerCertificate;    # x509_server_certificate not used.
        $entity_data->{x509_certificate_fingerprint} = $fingerprint;

        $entity_data->{idp_sp_flag} = $idpSpFlag;
        if ($idpSpFlag eq 'idp') {
            $entity_data->{ssos_v1} = $ssosV1;
            $entity_data->{ssos_v2} = $ssosV2;
        }
        elsif ($idpSpFlag eq 'sp') {
            $entity_data->{login_uri_prefix} = $loginUriPrefix;
            $entity_data->{pattern_name} = $patternName;
            $entity_data->{assertion_consumer_service} = $acs;
            $entity_data->{saml_version} = $samlVersion;
            $entity_data->{cookie_flag} = $cookieFlag;
        }

        push(@list_data, $entity_data);
    }
    close(LIST);

    return @list_data;
}


sub obtain_ascii_armoured_payload {
    my $originalData = $json->encode($_contents);
    #print $originalData;
    open TMP, ">/tmp/data.dat"; print TMP $originalData; close TMP;
    my $b64_digest = sha256_base64($originalData);
    while (length($b64_digest) % 4) {
        $b64_digest .= '=';
    }

    return $b64_digest;
}


sub obtain_the_signature {
    my @_signature = `openssl dgst -sha256 -sign $ARGV[1] -out /tmp/sign.dat /tmp/data.dat; base64 /tmp/sign.dat`;
    unlink('/tmp/data.dat');
    unlink('/tmp/sign.dat');
    my $_signature;
    for (my $i = 0; $i < @_signature; $i++) {
        $_signature[$i] =~ s/[\r\n]//g;
        $_signature .= $_signature[$i];
    }

    return $_signature;
}


sub json_simple_sign_1_0 {
    my $_type = "http://openid.net/specs/ab/1.0#jss";
    my $_data_type = "application/json";
    my $_data = $b64_digest;

    my @_sig_params = ();
    my $_signature_param = {};
    my $_algorithm = "RSA-SHA256";
    my $_certs_uri = $ARGV[2];
    $_signature_param->{algorithm} = $_algorithm;
    $_signature_param->{certs_uri} = $_certs_uri;
    push(@_sig_params, $_signature_param);

    my @_sigs = ();
    push(@_sigs, $_signature);

    my $_envelope = {};
    $_envelope->{type} = $_type;
    $_envelope->{data_type} = $_data_type;
    $_envelope->{data} = $_data;
    $_envelope->{sig_params} = \@_sig_params;
    $_envelope->{sigs} = \@_sigs;

    $_envelope->{contents} = $_contents;

    return $_envelope;
}


sub obtain_discovery_methods {
    my $_discovery_methods;
    my $lineNumber = 0;
    my $functionname;
    my $functionself;
    open(SCRIPTS, "<$ARGV[3]");
    while (<SCRIPTS>) {
        chop;
        # a new function starts
        if ($_ =~ /(.+):\s*(function\s*\(.*\)\s*{)/) {
            if ($lineNumber != 0) {
                # another function starts means previous function ends
                $_discovery_methods->{$functionname} = $functionself;
            }
            $lineNumber++;

            # new function starts here
            $functionname = trim($1);
            $functionself = $2;
        }
        # continue with the current function
        else {
            $functionself .= $_;
        }

        # reach the end of file means the current function ends
        if (eof) {
            $_discovery_methods->{$functionname} = $functionself;
        }
    }
    close(SCRIPTS);

    return $_discovery_methods;
}

#################### subroutines ####################

# Perl trim function to remove whitespace from the start and end of the string
sub trim($) {
    my $string = shift;
    $string =~ s/^\s+//;
    $string =~ s/\s+$//;
    return $string;
}

# Left trim function to remove leading whitespace
sub ltrim($) {
    my $string = shift;
    $string =~ s/^\s+//;
    return $string;
}

# Right trim function to remove trailing whitespace
sub rtrim($) {
    my $string = shift;
    $string =~ s/\s+$//;
    return $string;
}



