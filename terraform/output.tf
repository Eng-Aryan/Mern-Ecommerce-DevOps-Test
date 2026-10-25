output "vpc_id" {
  value       = aws_vpc.mern_vpc.id
  description = "The ID of the VPC"
}

output "s3_bucket_name" {
  value       = aws_s3_bucket.mern_storage.id
  description = "The name of the S3 bucket"
}