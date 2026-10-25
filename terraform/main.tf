resource "aws_vpc" "mern_vpc" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "mern-${var.environment}-vpc"
  }
}

resource "aws_subnet" "mern_subnet" {
  vpc_id                  = aws_vpc.mern_vpc.id
  cidr_block              = "10.0.1.0/24"
  map_public_ip_on_launch = true

  tags = {
    Name = "mern-${var.environment}-subnet"
  }
}

resource "aws_s3_bucket" "mern_storage" {
  bucket = "mern-app-storage-bucket-${var.environment}"

  tags = {
    Name = "mern-storage"
  }
}