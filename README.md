# Twitter Clone

This project emulates the functionality of Twitter, allowing users to sign up, log in, post tweets with photos, add profile photos, follow, unfollow, and more. It incorporates various technologies for performance optimization, AWS services, and features like in-memory caching, error handling, and mail verification.

## Table of Contents
- [Features](#features)
- [Technologies Used](#technologies-used)
- [Performance Optimization](#performance-optimization)
- [AWS Services](#aws-services)
- [Error Handling](#error-handling)
- [Mail Verification](#mail-verification)
- [Contributing](#contributing)
- [License](#license)

## Features
- **User Authentication:**
  - Sign up and login functionality.
  - OAuth support for Google sign-up.

- **Tweeting Functionality:**
  - Post tweets with up to 4 photos.
  - Add and update profile photos.
  - Comment on tweets.
  - Like and unlike tweets.
  - Follow and unfollow users.

- **Search Functionality:**
  - Search users by name.
  - Search tweets by content.

- **Cache Invalidation:**
  - Used Time-to-Live (TTL) for cache invalidation.
  - Invalidate cache when a user deletes their profile.
  - Update cache on profile and tweet updates.

- **Caching Mechanisms:**
  - In-memory caching using Redis for frequently accessed requests.
  - Static caching using Cloudfront CDN for faster content delivery.

- **AWS Services:**
  - AWS S3 for storing user profile/cover photos and tweet photos.
  - Cloudfront CDN integrated with S3 for optimized photo retrieval.

## Technologies Used
- Node.js
- Express.js
- MongoDB with Mongoose ODM
- Redis
- AWS S3 and Cloudfront CDN
- OAuth for Google sign-up
- Multer for handling file uploads
- Nodemailer for email verification
- JWT for token-based authentication
