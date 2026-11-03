output "instance_public_ip" {
  description = "Public IP address of the EC2 instance"
  value       = aws_instance.mern_server.public_ip
}

output "ssh_connection_string" {
  description = "Command to connect via SSH"
  value       = "ssh -i 'your-key-name.pem' ubuntu@${aws_instance.mern_server.public_ip}"
}