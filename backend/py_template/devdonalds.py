from dataclasses import dataclass
from typing import List, Dict, Union
from flask import Flask, request, jsonify
import re

# ==== Type Definitions, feel free to add or modify ===========================
@dataclass
class CookbookEntry:
	name: str

@dataclass
class RequiredItem():
	name: str
	quantity: int

@dataclass
class Recipe(CookbookEntry):
	required_items: List[RequiredItem]

@dataclass
class Ingredient(CookbookEntry):
	cook_time: int


# =============================================================================
# ==== HTTP Endpoint Stubs ====================================================
# =============================================================================
app = Flask(__name__)

# Store your recipes here!
cookbook = Dict[str, Union[Recipe, Ingredient]] = {}

# Task 1 helper (don't touch)
@app.route("/parse", methods=['POST'])
def parse():
	data = request.get_json()
	recipe_name = data.get('input', '')
	parsed_name = parse_handwriting(recipe_name)
	if parsed_name is None:
		return 'Invalid recipe name', 400
	return jsonify({'msg': parsed_name}), 200

# [TASK 1] ====================================================================
# Takes in a recipeName and returns it in a form that
def parse_handwriting(recipeName: str) -> Union[str | None]:
	if recipeName is None:
		return None

	# Replace hyphens with spaces
	recipeName = recipeName.replace("-", " ")

	# Replace underscores with spaces
	recipeName = recipeName.replace("_", " ")

	# Remove all non-letter characters expect spaces
	recipeName = re.sub(r"[^a-zA-Z\s]", "", recipeName)

	# Collapse multiple spaces into one
	recipeName = re.sub(r"\s+", " ", recipeName)

	# Trim leading and trailing spaces
	recipeName = recipeName.strip()

	# Return None if string is empty after cleaning
	if len(recipeName) == 0:
		return None

	# Capitalise each word
	words = recipeName.split(" ")
	words = [word.capitalize() for word in words]
	recipeName = " ".join(words)

	return recipeName


# [TASK 2] ====================================================================
# Endpoint that adds a CookbookEntry to your magical cookbook
@app.route('/entry', methods=['POST'])
def create_entry():
	data = request.get_json()

	success = add_cookbook_entry(data)

	if not success:
		return '', 400

	return '', 200


# Backend function
def add_cookbook_entry(data: dict) -> bool:
	global cookbook

	# Basic validation
	if not isinstance(data, dict):
		return False

	name = data.get("name")
	entry_type = data.get("type")

	if not isinstance(name, str) or not isinstance(entry_type, str):
		return False

	# Type must be recipe or ingredient
	if entry_type not in ["recipe", "ingredient"]:
		return False

	# Name must be unique
	if name in cookbook:
		return False


	# Testing ingredient...
	if entry_type == "ingredient":
		cook_time = data.get("cookTime")

		if not isinstance(cook_time, int) or cook_time < 0:
			return False
		cookbook[name] = Ingredient(name=name, cook_time=cook_time)
		return True


	# Testing recipe...
	if entry_type == "recipe":
		required_items = data.get("requiredItems")

		if not isinstance(required_items, list):
			return False

		seen_names = set()
		parsed_items: List[RequiredItem] = []

		for item in required_items:
			if not isinstance(item, dict):
				return False

			item_name = item.get("name")
			quantity = item.get("quantity")

			if not isinstance(item_name, str) or not isinstance(quantity, int):
				return False

			# Only one element per name
			if item_name in seen_names:
				return False

			seen_names.add(item_name)
			parsed_items.append(RequiredItem(name=item_name, quantity=quantity))

		cookbook[name] = Recipe(name=name, required_items=parsed_items)
		return True

	return False


# [TASK 3] ====================================================================
# Endpoint that returns a summary of a recipe that corresponds to a query name
@app.route('/summary', methods=['GET'])
def summary():
	# TODO: implement me
	return 'not implemented', 500


# =============================================================================
# ==== DO NOT TOUCH ===========================================================
# =============================================================================

if __name__ == '__main__':
	app.run(debug=True, port=8080)
