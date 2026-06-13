# Sunglasses Management System

## Overview

A full stack product management application designed to track customers, employees, inventory, and invoices. This project showcases data modeling integrity, relational constraints, and production pipeline execution.

**Live Application:** [sunglasses-management-system.vercel.app](https://sunglasses-management-system.vercel.app)


## System Architecture  

| Layer | Technology |
| :--- | :--- |
| **Framework** | Next.js (React & API Routes) |
| **Styling** | Tailwind CSS |
| **Database** | PostgreSQL (Neon) |
| **ORM** | Prisma |
| **Storage** | Supabase Objects |
| **Hosting** | Vercel Cloud |


## Features

### State Recovery & Lifecycle
* **Instant Reset**: Backs up active tables to a snapshot file before initializing a clean, seeded state.
* **Rolling Rollback**: Captures and maintains the last 5 operational database states for point in time recovery.
* **Health Tracking**: Visual UI badge displaying active database connection stability.

### Data Management
* **Validation Forms**: Strict type-checked entry points for onboarding personnel, customers, and stock.
* **Inline Mutation**: Secure operational components handling atomic updates to prices, counts, and status flags.


## Relational Logic

### Schema Structure
* **Core Tables**: `Customers`, `Employees`, `Invoices`, and `Sunglasses`.
* **Junction Table**: `InvoiceSunglasses` handles the many to many relationship between sales orders and physical items.

### Data Constraints
* **Idempotent Items**: A composite unique constraint on `InvoiceSunglasses([invoiceID, itemID])` halts accidental duplication within a single sales invoice.
* **Audit Protection**: `onDelete: Restrict` prevents wiping active customer or employee records that are linked to transaction histories.
* **Automated Cascade**: `onDelete: Cascade` purges transactional items instantly if the parent invoice is removed, preventing orphaned records.


## Database Schema

![Schema Diagram](/assets/schema_diagram.png)


## Citations

All codebase architecture, database design, and implementation work belong entirely to me.
AI tools were used in a limited support role for schema queries, structural debugging assistance, and documentation support.


