package main

import (
	"context"

	"github.com/aws/aws-lambda-go/lambda"
)

type testResponse struct {
	StatusCode int `json:"statusCode"`
}

func handleRequest(ctx context.Context) (testResponse, error) {
	return testResponse{
		StatusCode: 200,
	}, nil
}

func main() {
	lambda.Start(handleRequest)
}
