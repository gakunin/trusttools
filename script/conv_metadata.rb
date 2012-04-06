#!/usr/bin/env ruby
require 'rexml/document'
require 'uri'
require 'yaml'
require 'csv'
require 'timeout'
require 'optparse'

$command = File.basename(__FILE__)

$options = {
  :check => false,
  :metadata => "metadata.xml",
  :pattern => "pattern.yml"
}

parser = OptionParser.new do |opts|
  opts.banner = "Usage: #{$command} [options]"
  opts.separator ""
  opts.separator "options:"
  opts.on("-c", "--check-alive", "Check that the IdP/SP servers are alive. If they are not alive, skipped in the outputs.", "Default: false") { |v| $options[:check] = v }
  opts.on("-m", "--metadata=file", String, "Specify SAML metadata file.", "Default: metadata.xml") { |v| $options[:metadata] = v }
  opts.on("-p", "--pattern=file", String, "Specify auto-redirect config file.", "Default: pattern.yml") { |v| $options[:pattern] = v }

  opts.separator ""

  opts.on("-h", "--help", "Show this help message.") { puts opts; exit }
end

parser.parse! ARGV

file = File.new($options[:metadata])
doc = REXML::Document.new(file)
config = YAML.load_file($options[:pattern])

def get_type(elem)
  if !elem.elements["IDPSSODescriptor"].nil?
    return "idp"
  end
  "sp"
end

def create_entity_array(elem, config)
  case get_type(elem)
  when "idp"
    idp_elem = elem.elements["IDPSSODescriptor"]
    saml1_sso = nil
    saml2_sso = nil
    idp_elem.elements.each("SingleSignOnService") do |e|
      case e.attributes["Binding"]
      when "urn:mace:shibboleth:1.0:profiles:AuthnRequest"
        saml1_sso = e.attributes["Location"]
      when "urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect"
        saml2_sso = e.attributes["Location"]
      end
    end
    entity_id = elem.attributes["entityID"]
    return ["idp", entity_id, URI.parse(entity_id).host, saml1_sso, saml2_sso]
  when "sp"
    sp_elem = elem.elements["SPSSODescriptor"]
    saml_acs = nil
    acs_index = nil
    saml_version = 0
    sp_elem.elements.each("AssertionConsumerService") do |e|
      case e.attributes["Binding"]
      when "urn:oasis:names:tc:SAML:1.0:profiles:browser-post"
        if acs_index.nil? || acs_index.to_i > e.attributes["index"].to_i
          saml_acs = e.attributes["Location"]
          acs_index = e.attributes["index"]
          saml_version = 1
        end
      when "urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST"
        saml_acs = e.attributes["Location"]
        saml_version = 2
        break
      end
    end
    entity_id = elem.attributes["entityID"]
    verify_uri_prefix = URI.parse(entity_id).host
    login_prefix_uri = nil
    pattern_name = nil
    cookie_flag = nil
    if !config[entity_id].nil?
      verify_uri_prefix = config[entity_id]["verify_uri_prefix"] || verify_uri_prefix
      login_prefix_uri = config[entity_id]["login_prefix_uri"]
      pattern_name = config[entity_id]["pattern_name"]
      cookie_flag = config[entity_id]["cookie_flag"]
    end
    return ["sp", entity_id, verify_uri_prefix, login_prefix_uri, pattern_name, saml_acs, saml_version, cookie_flag]
  end
end

def alive?(host, port)
  return true if !$options[:check]
  begin
    pid = nil
    com = nil
    timeout(5) {
      com = IO.popen("openssl s_client -connect #{host}:#{port}", "r+")
      pid = com.pid
      com.puts "GET /"
      while line = com.gets
        $stderr.puts line
      end
    }
  rescue Timeout::Error => err
    Process.kill('SIGKILL', pid)
    com.close unless com.nil?
    return false
  end
  true
end

def output_csv(elem, config)
  CSV do |csv|
    entity_array = create_entity_array(elem, config) 
    if alive?(entity_array[2], 443) 
      csv << entity_array
    end
  end
end

doc.elements.each("EntityDescriptor") do |elem|
  output_csv(elem, config)
end

doc.elements.each("EntitiesDescriptor/EntityDescriptor") do |elem|
  output_csv(elem, config)
end
