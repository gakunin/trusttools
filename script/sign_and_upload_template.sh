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
pattern_script=pattern_script.js
signing_cert=object_signing_cert.pem
signing_key=object_signing_key.pem
providers=providers.json
xpi_file_prefix=trusttools
idp_cookie_name_for_ds=_redirect_user_idp

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
