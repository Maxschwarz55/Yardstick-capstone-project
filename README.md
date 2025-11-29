# Yardstik Capstone Project

A background check platform that provides **fast, automated, and continuously updated** criminal and public record screening.

---

## Overview

Traditional background checks are accurate but slow, involving manual searches, outdated information, and long wait times. For high throughput industries such as rideshare, delivery, and contracting, **time to approval** directly impacts revenue and user onboarding.

This project implements a prototype SaaS platform that aggregates multiple public data sources, keeps them continuously up to date through automated scrapers, and provides a simple user interface for quickly retrieving relevant records. The goal is to demonstrate **speed and automation** as key differentiators.

---

## Key Features

### Automated Data Collection
- Scrapers (NestJS scheduled cron jobs) collect and refresh data from multiple public datasets.
- Crawls are logged to the database with timestamps, record counts, and updates.
- Ensures data is frequently updated with minimal manual intervention.

### Unified Record Database
Aggregates multiple criminal/public datasets into a normalized schema, including:
- Persons
- Addresses
- Aliases
- Arrest records
- Court cases
- Crawl logs

Provides a single source of truth for background check queries.

### Image Similarity Matching
- Uploaded selfies are validated and compared using **AWS Rekognition**.
- Similarity scores help prioritize likely matches when multiple records share the same or similar names.
- Supports scenarios where only a name is provided and other fields are optional.

### Fast Lookup Workflow
The frontend accepts:
- **Required:** Name  
- **Optional:** Date of Birth, Address, Selfie

If optional information is missing, the system uses matching logic and similarity scoring to determine the most likely record.

### Diagnostics Dashboard
A developer-facing page that displays:
- Total records per table
- Last and next scheduled crawl
- Number of records added on the most recent crawl
- Data freshness indicators

Useful for monitoring scraper performance and database health.

### Deployed Cloud Infrastructure
The entire system runs on AWS:
- **EC2** – hosts the NestJS backend and React frontend  
- **RDS Postgres** – production database  
- **S3** – stores uploaded images  
- **AWS Rekognition** – image similarity checks  

---

## System Architecture

### **Frontend — React**
- Form for entering name, DOB, and address
- Selfie uploader with real-time preview
- Results page displaying matched records with summary boxes and photos
- Diagnostics page for monitoring system health

### **Backend — NestJS**
- REST API for search, results processing, diagnostics, and record retrieval  
- Image validation & similarity scoring using AWS services  
- Scheduled scrapers using NestJS Cron jobs  
- Integration with Postgres via TypeORM  

### **Database — PostgreSQL**
Core tables include:

| Table         | Description |
|---------------|-------------|
| `person`      | Main entity containing identifying attributes |
| `address`     | Street, city, state, ZIP, county linked to a person |
| `alias_name`     | Alternative names for individuals |
| `charges` | Arrest information and related metadata |
| `convictions` | Court documents and case histories |
| `crawl_log`   | Stores metadata from every scraper run |

The schema is designed to support aggregation from multiple external data sources while maintaining consistency across records.

---

## Scraper System
*update this*

---

## Frontend Pages

### **1. Search Page**
Users can submit:
- Name (required)
- Date of birth (optional)
- Address details (optional)
- Selfie upload (optional)

### **2. Results Page**
- Displays top matching individual
- Shows associated addresses, aliases, arrest/court records
- Includes similarity scores and extracted photos

### **3. Diagnostics Page**
- Shows high level database stats
- Displays scraper activity and crawl schedules

---

## Deployment

This project is deployed on **AWS EC2**.  

The production environment includes:
- React build served from
- Postgres hosted on RDS  

---

## Future Work