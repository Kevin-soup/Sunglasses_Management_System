# Sunglasses Management System

## Overview

A full stack product management application designed to track customers, employees, inventory, and invoices. 
This project showcases data modeling integrity, relational constraints, and production pipeline execution.

The system implements automated backup mechanics, live health monitoring, and defensive cascade handling. 
Built for high volume operations, it ensures zero transaction loss and precise data consistency across the schema.


**LIVE APPLICATION:** [sunglasses-management-system.vercel.app](https://sunglasses-management-system.vercel.app)

### System Features

<table width="100%">
<tr>
<td width="50%" valign="top">

#### 🔄 Infrastructure & Recovery
* **Database Reset**
  Archives active tables to a snapshot file before running a fresh seed.
* **Database Rollback**
  Holds a rolling history of the last 5 operational states.
* **Health Tracking**
  Renders a live UI badge displaying active connection stability.

</td>
<td width="50%" valign="top">

#### ⚡ Operations & Intake
* **Validation Forms**
  Enforces strict type-checked UI fields for secure row creation.
* **Inline Edits**
  Validates and processes atomic updates to data records instantly.

</td>
</tr>
</table>


## System Architecture  

| Layer | Technology |
| :--- | :--- |
| **Framework** | Next.js (React & API Routes) |
| **Styling** | Tailwind CSS |
| **Database** | PostgreSQL (Neon) |
| **ORM** | Prisma |
| **Storage** | Supabase Objects |
| **Hosting** | Vercel Cloud |


## Database Schema

![Schema Diagram](public/assets/schema_diagram.png)


## Relational Logic

### Core Tables
* `Customers`, `Employees`, `Invoices`, and `Sunglasses` form the base schema.

### Junction Table
* `InvoiceSunglasses` manages the many-to-many relationship between sales orders and inventory.

### Idempotent Items
* A composite unique constraint on `InvoiceSunglasses([invoiceID, itemID])` halts product duplication within a single sales invoice.

### Audit Protection
* `onDelete: Restrict` blocks the deletion of customer or employee records linked to historical transaction records.

### Automated Cascade
* `onDelete: Cascade` purges line items instantly if the parent invoice is removed to prevent orphan database rows.


## Citations

All codebase architecture, database design, and implementation work belong entirely to me.
AI tools were used in a limited support role for schema queries, structural debugging assistance, and documentation support.


