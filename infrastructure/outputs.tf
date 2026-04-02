output "server_ipv4" {
  value = hcloud_server.prod.ipv4_address
}

output "ssh_command" {
  value = "ssh root@${hcloud_server.prod.ipv4_address}"
}

output "app_url" {
  value = "https://${var.cloudflare_zone_name}"
}

output "dns_record" {
  value = var.cloudflare_zone_name
}
