#!/bin/sh

if [ $# -lt 7 ]; then
    echo "usage: signxpi.sh keystore_path xpi_file_prefix xpi_path providers_uri idp_entity_id idp_cookie_name_for_ds ds_domainname"
    exit 1
fi

if [ ! -d $3 ]; then
    echo "$3 doesn't exist"
    exit 1
fi

signtool="signtool"
if [ `uname` = "Darwin" ]; then
  signtool="nss-signtool"
fi

nickname="Your Certificate Name"
password=your_password

prefs_template="$3/../../config/prefs_template.js"
prefs_path="$3/defaults/preferences"
prefs="prefs.js"
TMPFILE=`mktemp /tmp/trusttools.XXXXXX` || exit 1
sed s?PROVIDERS_URI?$4? $prefs_template  | sed s?COOKIE_VALUE?$5? | sed s?COOKIE_NAME?$6? | sed s?COOKIE_DOMAIN?$7? > $TMPFILE
mkdir -p $prefs_path
mv $TMPFILE $prefs_path/$prefs

$signtool -d $1 -k "$nickname" -p $password -X -Z $2."xpi" $3
