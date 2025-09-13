cmake_minimum_required(VERSION 3.9)
set(CMAKE_CXX_STANDARD 11)
project(maxdaylambda LANGUAGES CXX)
find_package(aws-lambda-runtime)
add_executable(${PROJECT_NAME} "main.cpp")
target_link_libraries(${PROJECT_NAME} PRIVATE AWS::aws-lambda-runtime)
target_compile_features(${PROJECT_NAME} PRIVATE "cxx_std_11")
target_compile_options(${PROJECT_NAME} PRIVATE "-Wall" "-Wextra" "-fno-rtti" "-fno-exceptions")

# this line creates a target that packages your binary and zips it up
aws_lambda_package_target(${PROJECT_NAME})
