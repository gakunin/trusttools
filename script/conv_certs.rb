#!/usr/bin/env ruby
#
# This tool convert DER encoded X509 certificates to PEM format certificates.
# Then create symbolic links with the hashed subject names.
require 'fileutils'
require 'rexml/document'
require 'uri'

if ARGV.size < 2
  puts "usage: conv_certs.rb src_der_certs_dir dst_pem_certs_dir"
  exit(1)
end

src_dir = Dir.open(ARGV[0])
dst_dir = ARGV[1]
FileUtils.mkdir_p(dst_dir)
src_dir.each do |in_file|
  # skip special files
  next if (in_file == '.' || in_file == '..')
  out_file = in_file.gsub("\.der", "\.pem")
  #puts out_file
  system("openssl x509 -inform der -in \"#{src_dir.path}/#{in_file}\" -outform pem -out \"#{dst_dir}/#{out_file}\"")
end
system("c_rehash #{dst_dir}")
