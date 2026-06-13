# Sunglasses Management System

## Overview

A full stack product management application designed to track customers, employees, inventory, and invoices. This project showcases data modeling integrity, relational constraints, and production pipeline execution.

## Hosted URL

🚀 **Live Application:** [sunglasses-management-system.vercel.app](https://sunglasses-management-system.vercel.app)

---

## Features

### Lifecycle & Backup Management
* **Instant Database Reset**: Saves a snapshot of current schema state before creating a fresh default database.
* **Database Rollback**: System maintains a historical log of the recent 5 database snapshots. This provides an automated recovery path to previous points in time.
* **Live Connection Badge**: A real time status badge that gives operators an instant confirmation of database operational health.

### Data Capture & Operations
* **Creation Forms**: Integrated forms for adding new database transactions.
* **Update Actions**: Pre-validated modification forms that handle editing table attributes.

---

## System Architecture  

* **Frontend Framework**: Next.js
* **Styling**: Tailwind CSS
* **Backend Runtime**: Next.js API Routes
* **Database Engine**: PostgreSQL (Neon)
* **Object Relational Mapper**: Prisma ORM
* **Asset Storage**: Supabase Storage
* **Hosting Platform**: Vercel Cloud

---

## Relational Logic

### Core Entities
* **Customers**: Customer contact information and purchase association.
* **Employees**: Employee records and hire information.
* **Invoices**: Purchase records connecting customers and employees.
* **Sunglasses**: Inventory records including price, stock quantity, and sale status.
* **InvoiceSunglasses**: Intersection table connecting invoices and sunglasses purchases.

### Referential Integrity Constraints
* **Many-to-Many Junction**: `InvoiceSunglasses` table bridges `Invoices` and `Sunglasses`, featuring a composite unique constraint `([invoiceID, itemID])` to prevent duplicate line items within a single order.
* **Strict Deletion Restrictions**: `onDelete: Restrict` on `Customers` and `Employees` prevents orphan invoices or the accidental loss of historical sales data.
* **Cascading Purges**: `onDelete: Cascade` on `InvoiceSunglasses` ensures that the removal of an invoice cleanly purges its specific line items without manual cleanup.

---

## Database Schema

```mermaid
erDiagram
    Customers ||--o{ Invoices : "places"
    Employees ||--o{ Invoices : "processes"
    Invoices ||--|{ InvoiceSunglasses : "contains"
    Sunglasses ||--o{ InvoiceSunglasses : "included_in"

    Customers {
        int customerID PK
        string firstName
        string lastName
        string email
        string phoneNumber
    }
    Employees {
        int employeeID PK
        string firstName
        string lastName
        DateTime hireDate
        int isActive
        DateTime terminationDate
    }
    Invoices {
        int invoiceID PK
        int customerID FK
        int employeeID FK
        DateTime invoiceDate
    }
    Sunglasses {
        int itemID PK
        string itemName
        decimal retailPrice
        int stockQuantity
        int isListed
        string imagePath
    }
    InvoiceSunglasses {
        int invoiceItemID PK
        int invoiceID FK
        int itemID FK
        int quantity
    }

---

## Citations

All codebase architecture, database design, and implementation work belong entirely to me.
AI tools were used in a limited support role for schema queries, structural debugging assistance, and documentation support.


