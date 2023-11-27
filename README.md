# BonusX Coding Test

## Description

Hello, this is my solution to the coding test. This component exposes a REST api with  operations to upload and download files.  This was built using [Nest](https://github.com/nestjs/nest) framework, [emqx](https://www.emqx.io//) for message broker, [S3 Ninja](https://s3ninja.net/) for S3 simulation and [jest](https://jestjs.io/) for unit tests.



## Pre-requisites

-   **NodeJS**: v16.15.0 or higher
-   **Docker**(https://www.docker.com/get-started)


## How to install

### Using Git (recommended)

```sh
$ git clone https://github.com/bellopromise/bx-solution # or clone your own fork
```

### Using manual download ZIP

1.  Download repository
2.  Uncompress to your desired directory
   
### Set environment variables

Navigate to `bx-file-transfer-service` folder and rename .env.example to .env


## Installation


## Running the app

Default port for API is `3000`. So 
```bash
$ docker-compose up --build
```

## Test


```bash
$ cd bx-file-transfer-service
$ npm install
$ npm run test
```


## API documentation

#### Postman

To access the Postman documentation, you can import the provided Postman collection into your own instance of Postman. 

#### Swagger
Swagger is an interactive documentation tool that allows you to easily explore the API's endpoints, test requests, and view responses. To access the Swagger documentation, simply navigate to the following URL:


`http://localhost:3000/api-docs/`

Once there, you'll be able to see all of the available endpoints, as well as details on the required parameters, expected responses, and more.


## API Endpoint
The API endpoints for this solution will be structured as follows:

#### File Transfer Service
- POST `/file-transfer/upload`
  * Uploads a file
  * Sends the file via message broker and persist on S3.
  * Returns a success message upon successful upload.
  * Request Body Example:
    ```bash
    {
        "fileName": "ticket",
        "file": Multipart-form-data **File to upload**
    }

    ```
- GET `/file-transfer/download/{fileName}`
  * Downloads the file using fileName.
  * Returns a success message upon successful download.
  * Path Parameter:
   - `fileName` (String): Unique identifier for the name of file.
  

## Assumptions and Trade-offs

### Assumptions:
- File Size Limitation: Assuming a maximum file size of 250 MB. This might not cater to very large files, but it's a practical limit for typical use cases.
- Network Stability: The service assumes a stable network connection. Interruptions during file upload or download could result in failures or corrupted files.
- Security: Basic security measures are assumed, but extensive security protocols (like advanced encryption) may not be implemented in the initial version.
- Storage Scalability: The service uses S3Ninja for object storage, assuming it will scale to the needed capacity. This might not be suitable for extremely high volumes of large files.
- Message Broker Reliability: The use of a message broker (EMQX) assumes reliable message delivery, which might not always be the case in distributed systems.

### Trade-offs:
- Simplicity vs. Complexity: The service is designed for simplicity and ease of use, potentially at the cost of advanced features.
- Performance vs. Cost: Using a message broker and object storage provides scalability but might incur additional costs and complexity compared to simpler storage solutions.
- Usability vs. Security: Prioritizing ease of use might lead to tradeoffs in security features, which are critical for sensitive data.

## Future Enhancements
With more time, the following enhancements can be made:

- Enhanced Security: Implementing end-to-end encryption, secure access controls, and audit logs to enhance data security.
- Support for Larger Files: Introducing chunked uploading and downloading to handle larger files more efficiently.
- Improved Error Handling and Retry Logic: To make the service more robust against network failures and other transient errors.
- Scalability Enhancements: Optimizing storage and message broker usage to handle higher loads and larger numbers of concurrent users.
- Advanced Analytics and Logging: Implementing detailed logging and analytics to monitor usage patterns, performance bottlenecks, and potential security threats.
- User Authentication and Authorization: Integrating a robust authentication and authorization mechanism to control access to files.
- API Rate Limiting: To prevent abuse and ensure fair usage of resources.
- Multi-part Uploads: For better handling of large file uploads, especially in unstable network conditions.
- Compression and Optimization: Implementing file compression techniques to reduce bandwidth usage and increase transfer speeds.


## Support
For more questions and clarifications, you can reach out to me here `bellopromise5322@gmail.com`




