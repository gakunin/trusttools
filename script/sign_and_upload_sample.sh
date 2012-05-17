#!/bin/bash

if [ $# -lt 1 ]; then
  echo "usage: sign_and_upload.sh root_path"
  exit 1
fi

### for rvm users
# [[ -s "$HOME/.rvm/scripts/rvm" ]] && . "$HOME/.rvm/scripts/rvm"
# rvm use 1.9.3
### for local cpan users
# export PERL5LIB=$HOME/perl/lib/perl5:$HOME/perl/lib/perl5/site_perl

publish_server=test-ds.gakunin.nii.ac.jp
publish_uri=https://$publish_server/trusttools
upload_server=username@$publish_server
upload_path=/var/www/html/trusttools
ds_server=ds.gakunin.nii.ac.jp
metadata=gakunin-metadata.xml
metadata_uri=https://metadata.gakunin.nii.ac.jp/$metadata
metadata_signing_cert=gakunin-signer-2010.cer
pattern_script=pattern_script.js
signing_cert=object_signing_cert.pem
signing_key=object_signing_key.pem
providers=providers.json
xpi_file_prefix=trusttools
idp_cookie_name_for_ds=_redirect_user_idp

# download metadata
/usr/bin/env curl -R -o $1/files/$metadata $metadata_uri

# verify metadata
if [ -z "`/usr/bin/env xmlsec1 --verify --trusted-pem $1/config/$metadata_signing_cert $1/files/$metadata 2>&1 | grep 'OK'`" ]; then
  echo "`date`: Error: failed to verify the metadata file $1/config/$metadata"
  exit 1
fi

# collect certificates, then sign and upload them.
/usr/bin/env ruby $1/script/conv_metadata.rb -m $1/files/$metadata -p $1/config/pattern_map.yml > $1/files/providers_data.csv
echo ""
echo "`date`: start collecting certificates, then sign and upload them."
/usr/bin/env perl $1/script/getservercert.pl $1/files/providers_data.csv $1/config/$signing_key $publish_uri/$signing_cert $1/config/$pattern_script $1/certs > $1/files/$providers
/usr/bin/env scp -i $1/config/id_rsa $1/config/$signing_cert $upload_server:$upload_path/$signing_cert
/usr/bin/env scp -i $1/config/id_rsa $1/files/$providers $upload_server:$upload_path/

# sign browser extension and upload it.
echo ""
echo "`date`: start signing browser extension and upload it."
/usr/bin/env perl $1/script/mdsignxpi.pl $1/files/$metadata $1/keystore $1/files/$xpi_file_prefix $1/trusttools $publish_uri/$providers $idp_cookie_name_for_ds $ds_server
/usr/bin/env scp -i $1/config/id_rsa $1/files/$xpi_file_prefix.*.xpi $upload_server:$upload_path/
