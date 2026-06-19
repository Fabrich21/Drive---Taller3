terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 4.0" 
    }
  }
}
//configuracion para localstack de forma local
provider "aws" {
  region                      = "us-east-1"
  access_key                  = "test"
  secret_key                  = "test"
  skip_credentials_validation = true
  skip_metadata_api_check     = true
  skip_requesting_account_id  = true
  s3_use_path_style           = true // Necesario para LocalStack 

// Configuración de endpoints para LocalStack
  endpoints {
    s3 = "http://localhost:4566"
  }
}
// creacion del bucket en localstack para almacenar los archivos de drive clone
resource "aws_s3_bucket" "drive" {
  bucket = "drive-clone-bucket" 

  tags = {
    Name        = "Drive Clone Bucket"
    Environment = "Development"
  }
  
}



