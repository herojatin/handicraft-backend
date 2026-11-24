
import "dotenv/config";
import mongoose from "mongoose";
import csv from "csv-parser";
import { createReadStream } from "fs";

const CSV_PATH = String.raw`E:\product og excel.csv`;
const DATABASE_NAME = "haswani";
const COLLECTION_NAME = "products";

// Dry run by default. No database changes unless explicitly enabled.
const APPLY_CHANGES = process.env.APPLY_CHANGES === "true";

async function readCsv() {
  return new Promise((resolve, reject) => {
    const rows = [];

    createReadStream(CSV_PATH)
      .pipe(
        csv({
          mapHeaders: ({ header }) =>
            header.replace(/^\uFEFF/, "").trim(),
        })
      )
      .on("data", (row) => rows.push(row))
      .on("end", () => resolve(rows))
      .on("error", reject);
  });
}

async function updateDescriptions() {
  let connected = false;

  try {
    // 1. Check Atlas connection string
    const mongoUri = process.env.MONGO_URI;

    if (!mongoUri || !mongoUri.startsWith("mongodb+srv://")) {
      throw new Error(
        "MONGO_URI is missing or is not an Atlas connection string. Check your backend .env file."
      );
    }

    // 2. Read CSV
    console.log("Reading CSV:", CSV_PATH);

    const rows = await readCsv();

    if (!rows.length) {
      throw new Error("CSV file is empty.");
    }

    console.log("CSV headers:", Object.keys(rows[0]));
    console.log("First CSV record:", rows[0]);

    // 3. Validate actual CSV columns
    if (
      !Object.prototype.hasOwnProperty.call(rows[0], "Tags") ||
      !Object.prototype.hasOwnProperty.call(rows[0], "description")
    ) {
      throw new Error(
        "CSV must contain Tags and description columns."
      );
    }

    // 4. Prepare unique product codes and descriptions
    const sourceMap = new Map();
    const duplicateSourceCodes = new Set();
    let invalidRows = 0;

    for (const row of rows) {
      const productCode = String(row.Tags || "").trim();
      const description = String(row.description || "").trim();

      if (!productCode || !description) {
        invalidRows++;
        continue;
      }

      if (sourceMap.has(productCode)) {
        duplicateSourceCodes.add(productCode);
      } else {
        sourceMap.set(productCode, description);
      }
    }

    // Remove duplicate source codes to avoid ambiguous updates.
    for (const code of duplicateSourceCodes) {
      sourceMap.delete(code);
    }

    console.log("\nCSV processing:");
    console.log("Valid unique product codes:", sourceMap.size);
    console.log("Duplicate CSV product codes:", duplicateSourceCodes.size);
    console.log("Invalid or empty rows:", invalidRows);

    if (sourceMap.size === 0) {
      throw new Error("No valid product codes and descriptions found.");
    }

    // 5. Connect to Atlas
    await mongoose.connect(mongoUri, {
      dbName: DATABASE_NAME,
    });

    connected = true;

    console.log("\nConnected to MongoDB Atlas.");
    console.log("Database:", mongoose.connection.name);
    console.log("Collection:", COLLECTION_NAME);

    // 6. Access existing products collection
    const products = mongoose.connection.db.collection(
      COLLECTION_NAME
    );

    // 7. Find existing products by productCode
    const codes = [...sourceMap.keys()];

    const existingProducts = await products
      .find({
        productCode: { $in: codes },
      })
      .project({
        _id: 1,
        productCode: 1,
        description: 1,
      })
      .toArray();

    // Group live products by productCode.
    const existingMap = new Map();

    for (const product of existingProducts) {
      const code = String(product.productCode || "").trim();

      if (!existingMap.has(code)) {
        existingMap.set(code, []);
      }

      existingMap.get(code).push(product);
    }

    // 8. Prepare safe updates
    const operations = [];

    let unmatched = 0;
    let ambiguous = 0;
    let unchanged = 0;

    for (const [productCode, description] of sourceMap) {
      const matches = existingMap.get(productCode) || [];

      if (matches.length === 0) {
        unmatched++;
        continue;
      }

      // Never update multiple products sharing the same code.
      if (matches.length !== 1) {
        ambiguous++;
        continue;
      }

      if (matches[0].description === description) {
        unchanged++;
        continue;
      }

      operations.push({
        updateOne: {
          filter: {
            _id: matches[0]._id,
            productCode,
          },
          update: {
            $set: {
              description,
            },
          },
        },
      });
    }
const unmatchedCodes = [];
    // 9. Display migration report
    console.log("\n========== MIGRATION REPORT ==========");
    console.log("CSV records:", rows.length);
    console.log("Unique valid product codes:", sourceMap.size);
    console.log("Existing matching products:", existingProducts.length);
    console.log("Descriptions to update:", operations.length);
    console.log("Already identical:", unchanged);
    console.log("Unmatched products:", unmatched);
    console.log("Unmatched product codes:", unmatchedCodes);
    console.log("Ambiguous live product codes:", ambiguous);
    console.log("Duplicate CSV product codes:", duplicateSourceCodes.size);
    console.log("Invalid or empty rows:", invalidRows);

    // 10. Stop safely during dry run
    if (!APPLY_CHANGES) {
      console.log("\nDRY RUN ONLY: No database changes were made.");
      console.log(
        "Review the report before enabling APPLY_CHANGES=true."
      );
      return;
    }

    if (operations.length === 0) {
      console.log("\nNothing needs updating.");
      return;
    }

    // 11. Update ONLY the description field
    const result = await products.bulkWrite(operations, {
      ordered: false,
    });

    console.log("\n========== UPDATE COMPLETE ==========");
    console.log("Matched documents:", result.matchedCount);
    console.log("Modified documents:", result.modifiedCount);
    console.log("No other product fields were changed.");

  } catch (error) {
    console.error("\nMigration failed:", error.message);
  } finally {
    if (connected) {
      await mongoose.disconnect();
      console.log("\nDatabase connection closed.");
    }
  }
}

updateDescriptions();
