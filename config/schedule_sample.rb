# Use this file to easily define all of your cron jobs.
#
# It's helpful, but not entirely necessary to understand cron before proceeding.
# http://en.wikipedia.org/wiki/Cron

# Example:
#
# set :output, "/path/to/my/cron_log.log"
#
# every 2.hours do
#   command "/usr/bin/some_great_command"
#   runner "MyModel.some_method"
#   rake "some:great:rake:task"
# end
#
# every 4.days do
#   runner "AnotherModel.prune_old_records"
# end


# Example (for Trust Tools):
#
# root = File.expand_path("../../", __FILE__)
# # publish provider list
# every 1.days do
#   set :output, :standard
#   command "ruby #{root}/script/conv_metadata.rb #{root}/files/metadata.xml #{root}/config/pattern_map.yml > #{root}/files/providers_data.csv"
#   set :output, "#{root}/log/cron_log.log"
#   command "perl #{root}/script/getservercert.pl #{root}/files/providers_data.csv #{root}/config/object_signing_key.pem https://gakunin.example.com/trusttools/object_signing_cert.pem #{root}/config/pattern_script.js #{root}/certs > #{root}/files/providers.json"
#   command "scp #{root}/config/object_signing_cert.pem username@gakunin.example.com:/var/www/html/trusttools/object_signing_cert.pem"
#   command "scp #{root}/files/providers.json username@gakunin.example.com:/var/www/html/trusttools/"
# end
#
# # publish browser extension
# every 1.days do
#   set :output, "#{root}/log/cron_log.log"
#   command "perl #{root}/script/mdsignxpi.pl #{root}/files/metadata.xml #{root}/keystore trusttools #{root}/trusttools https://gakunin.example.com/trusttools/providers.json _redirect_user_idp gakunin.example.com"
#   command "scp #{root}/files/trusttools.*.xpi username@gakunin.example.com:/var/www/html/trusttools/"
# end

# Learn more: http://github.com/javan/whenever
