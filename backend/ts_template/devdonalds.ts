import express, { Request, Response } from "express";

// ==== Type Definitions, feel free to add or modify ==========================
interface cookbookEntry {
  name: string;
  type: string;
}

interface requiredItem {
  name: string;
  quantity: number;
}

interface recipe extends cookbookEntry {
  requiredItems: requiredItem[];
}

interface ingredient extends cookbookEntry {
  cookTime: number;
}

// =============================================================================
// ==== HTTP Endpoint Stubs ====================================================
// =============================================================================
const app = express();
app.use(express.json());

// Store your recipes here!
const cookbook: Map<string, recipe | ingredient> = new Map();

// Task 1 helper (don't touch)
app.post("/parse", (req:Request, res:Response) => {
  const { input } = req.body;

  const parsed_string = parse_handwriting(input)
  if (parsed_string == null) {
    res.status(400).send("this string is cooked");
    return;
  }
  res.json({ msg: parsed_string });
  return;
});

// [TASK 1] ====================================================================
// Takes in a recipeName and returns it in a form that
const parse_handwriting = (recipeName: string): string | null => {
  if (!recipeName) return null;

  // Replace hyphens and underscores with spaces
  recipeName = recipeName.replace(/[-_]/g, " ");

  // Remove all non-letter characters except spaces
  recipeName = recipeName.replace(/[^a-zA-Z\s]/g, "");

  // Collapse multiple spaces into a single space
  recipeName = recipeName.replace(/\s+/g, " ");

  // Trim leading and trailing whitespace
  recipeName = recipeName.trim();

  // If empty after cleaning → return null
  if (recipeName.length === 0) return null;

  // Capitalise first letter of each word, lowercase the rest
  recipeName = recipeName
    .split(" ")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");

  return recipeName;
}

// [TASK 2] ====================================================================
// Endpoint that adds a CookbookEntry to your magical cookbook
app.post("/entry", (req:Request, res:Response) => {
  const success = addCookbookEntry(req.body);

  if (!success) {
    return res.status(400).send();
  }
  return res.status(200).send();
});

// Task 2 Backend function
const addCookbookEntry = (entry: any): boolean => {
  if (!entry || typeof entry.name !== "string" || typeof entry.type !== "string") {
    return false;
  }

  const { name, type } = entry;

  // Check valid type
  if (type !== "recipe" && type !== "ingredient") {
    return false;
  }

  // Check for unique name
  if (cookbook.has(name)) {
    return false;
  }

  // Testing ingredient now...
  if (type === "ingredient") {
    if (typeof entry.cookTime !== "number" || entry.cookTime < 0) {
      return false;
    }
    const newIngredient: ingredient = {
      name,
      type,
      cookTime: entry.cookTime
    }
    cookbook.set(name, newIngredient);
    return true;
  }

  // Testing recipe now...
  if (type === "recipe") {
    if (!Array.isArray(entry.requiredItems)) {
      return false;
    }

    const seen = new Set<string>();
    for (const item of entry.requiredItems) {
      if (typeof item.name !== "string" || typeof item.quantity !== "number") {
        return false;
      }

      if (seen.has(item.name)) {
        return false;
      }
      seen.add(item.name);
    }

    const newRecipe: recipe = {
      name,
      type,
      requiredItems: entry.requiredItems
    };
    cookbook.set(name, newRecipe);
    return true;
  }

  return false;
}

// [TASK 3] ====================================================================
// Endpoint that returns a summary of a recipe that corresponds to a query name
app.get("/summary", (req:Request, res:Request) => {
  // TODO: implement me
  res.status(500).send("not yet implemented!")

});

// =============================================================================
// ==== DO NOT TOUCH ===========================================================
// =============================================================================
const port = 8080;
app.listen(port, () => {
  console.log(`Running on: http://127.0.0.1:8080`);
});
