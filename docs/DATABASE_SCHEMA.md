# Database Schema

Filamentify uses SQLite through `better-sqlite3`. The live database file is created under `data/filamentify.sqlite` at runtime and is intentionally ignored by Git.

The source of truth for schema creation and migrations is [`apps/server/src/db.ts`](../apps/server/src/db.ts).

## Core tables

### `Category_TB`

Filament categories.

- `ID`
- `Name`

### `Filament_TB`

Filament inventory with stock tracking.

- `ID`
- `CategoryID`
- `Name`
- `Color`
- `Price`
- `Gram`
- `Available_Gram`
- `PurchaseDate`
- `Status`
- `Refresh_Day`
- `Score`
- `Link`

### `ModelCategory_TB`

3D model categories.

- `ID`
- `Name`

### `Model_TB`

Stored print model definitions.

- `ID`
- `CategoryID`
- `Name`
- `Link`
- `Gram`
- `FilePath`
- `PieceCount`
- `PurchaseDate`

### `MaterialCategory_TB`

Non-filament material categories.

- `ID`
- `Name`

### `Material_TB`

Supplementary inventory such as bearings, screws, or packaging.

- `ID`
- `CategoryID`
- `Name`
- `Quantity`
- `TotalPrice`
- `Link`
- `PurchaseDate`
- `UsagePerUnit`

### `ProductCategory_TB`

Product categories for sellable items.

- `ID`
- `Name`

### `Product_TB`

Sellable product records and optional parent-child grouping.

- `ID`
- `Name`
- `Description`
- `Price`
- `Stock`
- `ImageFront`
- `ImageBack`
- `ProfitMultiplier`
- `PurchaseDate`
- `ParentID`
- `CategoryID`

### Relationship tables

- `ProductMaterials_TB`
- `ProductModels_TB`
- `ProductFilaments_TB`

Each stores `ProductID`, the related entity ID, and a `Quantity` value.

## Notes

- Foreign keys are enabled with `PRAGMA foreign_keys = ON`.
- Product create and update operations run inside transactions.
- Uploaded files are stored outside the schema in `data/uploads/`; only the generated file name is kept in the database.
