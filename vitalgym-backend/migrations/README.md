# Database Migrations

## Quick Routine Feature

To enable the quick routine feature, you need to add two new columns to the `Routines` table:

### Running the Migration

Execute the SQL script:

```bash
mysql -u YOUR_USER -p YOUR_DATABASE < migrations/add_quick_routine_fields.sql
```

Or manually run the following SQL:

```sql
ALTER TABLE Routines 
ADD COLUMN isQuickRoutine BOOLEAN DEFAULT FALSE,
ADD COLUMN shareToken VARCHAR(255) UNIQUE;

CREATE INDEX idx_routines_shareToken ON Routines(shareToken);
```

### What This Does

- `isQuickRoutine`: A boolean flag to identify quick routines (text-only, shareable)
- `shareToken`: A unique token for generating shareable public links
- Index on `shareToken` for faster public lookups

### Using Sequelize Sync

Alternatively, if you're using Sequelize sync in development, the models will automatically create these columns:

```javascript
// In your server startup code
await sequelize.sync({ alter: true });
```

**Note:** Be careful with `sync({ alter: true })` in production as it can cause data loss.
