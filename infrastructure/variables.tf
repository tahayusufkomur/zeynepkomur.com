variable "hcloud_token" {
  description = "Hetzner Cloud API token"
  sensitive   = true
}

variable "cloudflare_api_token" {
  description = "Cloudflare API token"
  sensitive   = true
}

variable "github_token" {
  description = "GitHub personal access token for cloning private repos"
  sensitive   = true
}

variable "cloudflare_zone_name" {
  description = "Cloudflare zone (root domain)"
  default     = "zeynepkomur.com"
}

variable "server_name" {
  description = "Name for the Hetzner server"
  default     = "zeynepkomur-prod"
}

variable "server_type" {
  description = "Hetzner server type"
  default     = "cx23"
}

variable "location" {
  description = "Hetzner datacenter location"
  default     = "fsn1"
}

variable "email_forward_to" {
  description = "Destination email for forwarding (e.g. your Gmail)"
  type        = string
}
