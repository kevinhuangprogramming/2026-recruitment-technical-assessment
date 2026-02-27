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

interface recipeSummary {
  name: string;
  cookTime: number;
  ingredients: requiredItem[];
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

  // Make sure string is not empty after cleaning
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
    res.status(400).send();
    return;
  }
  res.status(200).send();
  return;
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
    // checking cook time is not less than 0
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
      // Checking required items are all unique
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
app.get("/summary", (req:Request, res:Response) => {
  const name = req.query.name as string;
  if (!name) {
    res.status(400).send();
    return;
  }

  const summary = getRecipeSummary(name);

  if (!summary) {
    res.status(400).send();
    return;
  }
  return res.status(200).json(summary);
});

// Task 3 Backend function
const getRecipeSummary = (name: string): recipeSummary | null => {
  // Checking
  const entry = cookbook.get(name);
  if (!entry || entry.type === "ingredient") {
    return null;
  }

  const recipeEntry = entry as recipe;
  const baseIngredients: requiredItem[] = [];
  let totalCookingTime = 0;

  for (const item of recipeEntry.requiredItems) {
    const time = processRequiredItem(item, baseIngredients, 1);
    if (time === -1) return null; // ingredient or recipe does not exist
    totalCookingTime += time;
  }

  return {
    name: recipeEntry.name,
    cookTime: totalCookingTime,
    ingredients: baseIngredients
  };
}

// Recursive helper function
const processRequiredItem = (
  item: requiredItem,
  baseIngredients: requiredItem[],
  multiplier: number
): number => {
  // Check whether item exists in cookbook
  const entry = cookbook.get(item.name);
  if (!entry) return -1;

  if (entry.type === "ingredient") {
    // Add ingredient to base ingredients
    const existing = baseIngredients.find(ing => ing.name === item.name);
    if (!existing) {
      baseIngredients.push({ name: item.name,
                             quantity: item.quantity * multiplier });
    } else {
      existing.quantity += item.quantity * multiplier;
    }

    return item.quantity * multiplier * (entry as ingredient).cookTime;
  } else {
    // entry is a recipe, so we recurse
    const recipeEntry = entry as recipe;
    let time = 0;
    for (const subItem of recipeEntry.requiredItems) {
      const subTime = processRequiredItem(subItem, baseIngredients,
                                          item.quantity * multiplier);
      if (subTime === -1) return -1; // propagate the error
      time += subTime;
    }
    return time;
  }
}


// =============================================================================
// ==== DO NOT TOUCH ===========================================================
// =============================================================================
const port = 8080;
app.listen(port, () => {
  console.log(`Running on: http://127.0.0.1:8080`);
});
